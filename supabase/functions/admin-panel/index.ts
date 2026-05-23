import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

import { validateAdmin } from "../_shared/auth.ts";
import { resolveBaseUrl } from "../_shared/base-url.ts";
import { createAdminClient } from "../_shared/client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { isSafeHttpUrl, json } from "../_shared/utils.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createAdminClient();

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action as string | undefined;

    if (!action) {
      return json({ error: "Missing action" }, 400, corsHeaders);
    }

    if (action === "login") {
      const auth = await validateAdmin(supabase, body.username ?? null, body.password ?? null);
      if (!auth.ok) {
        return json({ error: auth.message }, auth.status, corsHeaders);
      }

      return json({ admin: auth.data }, 200, corsHeaders);
    }

    const auth = await validateAdmin(
      supabase,
      req.headers.get("x-admin-username"),
      req.headers.get("x-admin-password"),
    );

    if (!auth.ok) {
      return json({ error: auth.message }, auth.status, corsHeaders);
    }

    if (action === "dashboard") {
      const [usersCount, streamsCount, categoriesCount, latestUsersResult, usersResult, streamsResult, categoriesResult] = await Promise.all([
        supabase.from("iptv_users").select("id", { count: "exact", head: true }),
        supabase.from("live_streams").select("id", { count: "exact", head: true }),
        supabase.from("live_categories").select("id", { count: "exact", head: true }),
        supabase
          .from("iptv_users")
          .select("id, username, status, expiry_date, max_connections, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("iptv_users")
          .select("id, username, status, start_date, expiry_date, max_connections, notes, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("live_streams")
          .select("id, name, stream_url, logo_url, status, sort_order, created_at, category_id, live_categories(name)")
          .order("sort_order", { ascending: true })
          .order("id", { ascending: true }),
        supabase
          .from("live_categories")
          .select("id, name, sort_order, image_url, created_at")
          .order("sort_order", { ascending: true })
          .order("id", { ascending: true }),
      ]);

      const baseUrl = await resolveBaseUrl(supabase, req);

      return json(
        {
          counts: {
            users: usersCount.count ?? 0,
            streams: streamsCount.count ?? 0,
            categories: categoriesCount.count ?? 0,
          },
          latestUsers: latestUsersResult.data ?? [],
          users: usersResult.data ?? [],
          streams: (streamsResult.data ?? []).map((stream: any) => ({
            ...stream,
            category_name: stream.live_categories?.name ?? "Uncategorized",
          })),
          categories: categoriesResult.data ?? [],
          server: {
            baseUrl,
            playerApi: `${baseUrl}/player_api.php?username=testuser&password=testpass`,
            m3u: `${baseUrl}/get.php?username=testuser&password=testpass&type=m3u_plus&output=m3u8`,
            xmltv: `${baseUrl}/xmltv.php?username=testuser&password=testpass`,
            live: `${baseUrl}/live/testuser/testpass/1.ts`,
          },
          admin: auth.data,
        },
        200,
        corsHeaders,
      );
    }

    if (action === "create_user") {
      const username = (body.username ?? "").trim();
      const password = (body.password ?? "").trim();
      const status = body.status === "Banned" || body.status === "Expired" ? body.status : "Active";
      const expiryDate = (body.expiry_date ?? "").trim();
      const maxConnections = Number(body.max_connections ?? 1);
      const notes = (body.notes ?? "").trim();

      if (!username || !password || !expiryDate || !Number.isFinite(maxConnections) || maxConnections < 1) {
        return json({ error: "Invalid IPTV user payload" }, 400, corsHeaders);
      }

      const { data, error } = await supabase
        .from("iptv_users")
        .insert({
          username,
          password,
          status,
          expiry_date: expiryDate,
          max_connections: maxConnections,
          notes,
          updated_at: new Date().toISOString(),
        })
        .select("id, username, status, start_date, expiry_date, max_connections, notes, created_at")
        .single();

      if (error) {
        return json({ error: error.message }, 400, corsHeaders);
      }

      return json({ user: data }, 200, corsHeaders);
    }

    if (action === "create_category") {
      const name = (body.name ?? "").trim();
      const sortOrder = Number(body.sort_order ?? 0);
      const imageUrl = (body.image_url ?? "").trim();

      if (!name) {
        return json({ error: "Category name is required" }, 400, corsHeaders);
      }

      if (imageUrl && !isSafeHttpUrl(imageUrl)) {
        return json({ error: "Category image must be a valid http(s) URL" }, 400, corsHeaders);
      }

      const { data, error } = await supabase
        .from("live_categories")
        .insert({
          name,
          sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
          image_url: imageUrl || null,
        })
        .select("id, name, sort_order, image_url, created_at")
        .single();

      if (error) {
        return json({ error: error.message }, 400, corsHeaders);
      }

      return json({ category: data }, 200, corsHeaders);
    }

    if (action === "create_stream") {
      const name = (body.name ?? "").trim();
      const streamUrl = (body.stream_url ?? "").trim();
      const logoUrl = (body.logo_url ?? "").trim();
      const status = body.status === "Disabled" ? "Disabled" : "Active";
      const sortOrder = Number(body.sort_order ?? 0);
      const categoryId = Number(body.category_id ?? 0);

      if (!name || !streamUrl || !Number.isFinite(categoryId) || categoryId < 1) {
        return json({ error: "Invalid stream payload" }, 400, corsHeaders);
      }

      if (!isSafeHttpUrl(streamUrl)) {
        return json({ error: "Stream URL must be a valid http(s) URL" }, 400, corsHeaders);
      }

      if (logoUrl && !isSafeHttpUrl(logoUrl)) {
        return json({ error: "Logo URL must be a valid http(s) URL" }, 400, corsHeaders);
      }

      const { data, error } = await supabase
        .from("live_streams")
        .insert({
          name,
          stream_url: streamUrl,
          logo_url: logoUrl || null,
          category_id: categoryId,
          status,
          sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
        })
        .select("id, name, stream_url, logo_url, status, sort_order, created_at, category_id")
        .single();

      if (error) {
        return json({ error: error.message }, 400, corsHeaders);
      }

      return json({ stream: data }, 200, corsHeaders);
    }

    return json({ error: "Unsupported action" }, 400, corsHeaders);
  } catch (error) {
    console.error("[admin-panel] unhandled error", error);
    return json({ error: "Internal server error" }, 500, corsHeaders);
  }
});

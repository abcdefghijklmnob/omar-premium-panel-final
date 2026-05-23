import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

import { validateIptvUser } from "../_shared/auth.ts";
import { resolveBaseUrl } from "../_shared/base-url.ts";
import { createAdminClient } from "../_shared/client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { asUnixTimestamp, getServerContext, json } from "../_shared/utils.ts";

function buildUserInfo(user: any, status: string) {
  return {
    username: user?.username ?? "",
    password: user?.password ?? "",
    message: status,
    auth: status === "Active" ? 1 : 0,
    status,
    exp_date: user?.expiry_date ? asUnixTimestamp(user.expiry_date) : "0",
    is_trial: "0",
    active_cons: "0",
    created_at: user?.created_at ?? null,
    max_connections: String(user?.max_connections ?? 1),
    allowed_output_formats: ["ts", "m3u8"],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createAdminClient();
  const url = new URL(req.url);
  const username = url.searchParams.get("username");
  const password = url.searchParams.get("password");
  const action = url.searchParams.get("action");

  try {
    const baseUrl = await resolveBaseUrl(supabase);

    const auth = await validateIptvUser(supabase, username, password);

    if (!auth.ok) {
      return json(
        {
          user_info: buildUserInfo(auth.data, auth.message),
          server_info: getServerContext(baseUrl),
        },
        200,
        corsHeaders,
      );
    }

    const user = auth.data;

    if (!action) {
      return json(
        {
          user_info: buildUserInfo(user, user.effectiveStatus),
          server_info: getServerContext(baseUrl),
        },
        200,
        corsHeaders,
      );
    }

    if (action === "get_live_categories") {
      const { data } = await supabase
        .from("live_categories")
        .select("id, name")
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

      return json(
        (data ?? []).map((category: any) => ({
          category_id: String(category.id),
          category_name: category.name,
          parent_id: 0,
        })),
        200,
        corsHeaders,
      );
    }

    if (action === "get_live_streams") {
      const { data } = await supabase
        .from("live_streams")
        .select("id, name, logo_url, category_id, status, created_at")
        .eq("status", "Active")
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

      return json(
        (data ?? []).map((stream: any) => ({
          num: Number(stream.id),
          name: stream.name,
          stream_type: "live",
          stream_id: Number(stream.id),
          stream_icon: stream.logo_url ?? "",
          epg_channel_id: String(stream.id),
          added: stream.created_at,
          category_id: String(stream.category_id ?? "0"),
          custom_sid: "",
          tv_archive: 0,
          direct_source: "",
          tv_archive_duration: 0,
          container_extension: "ts",
        })),
        200,
        corsHeaders,
      );
    }

    return json({ error: "Unsupported action in phase 1" }, 400, corsHeaders);
  } catch (error) {
    console.error("[player-api] unhandled error", error);
    return json({ error: "Internal server error" }, 500, corsHeaders);
  }
});

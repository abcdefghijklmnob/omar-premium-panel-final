import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

import { validateAdmin } from "../_shared/auth.ts";
import { createAdminClient } from "../_shared/client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { json } from "../_shared/utils.ts";

const BUCKET_NAME = "playlists";
const CONTENT_TYPE = "application/x-mpegURL; charset=utf-8";

function cleanText(value: string | null | undefined, fallback = "") {
  return (value ?? fallback).replace(/[\r\n]+/g, " ").replace(/"/g, "").trim() || fallback;
}

function buildM3u(streams: Array<any>) {
  const lines = ["#EXTM3U"];

  for (const stream of streams) {
    lines.push(
      `#EXTINF:-1 tvg-id="${stream.id}" tvg-name="${cleanText(stream.name, "Channel")}" tvg-logo="${cleanText(stream.logo_url)}" group-title="${cleanText(stream.live_categories?.name, "Live TV")}",${cleanText(stream.name, "Channel")}`,
    );
    lines.push(cleanText(stream.stream_url));
  }

  lines.push("");
  return lines.join("\r\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, corsHeaders);
  }

  const supabase = createAdminClient();

  try {
    const body = await req.json().catch(() => ({}));
    const adminUsername = cleanText(body.adminUsername);
    const adminPassword = cleanText(body.adminPassword);
    const targetUsername = cleanText(body.targetUsername);

    console.log("[generate-ibo-playlist] request received", { targetUsername });

    const auth = await validateAdmin(supabase, adminUsername, adminPassword);
    if (!auth.ok) {
      console.warn("[generate-ibo-playlist] admin auth failed", { targetUsername, status: auth.status });
      return json({ error: auth.message }, auth.status, corsHeaders);
    }

    if (!targetUsername) {
      return json({ error: "Target username is required" }, 400, corsHeaders);
    }

    const { data: user, error: userError } = await supabase
      .from("iptv_users")
      .select("id, username, status, expiry_date")
      .eq("username", targetUsername)
      .maybeSingle();

    if (userError || !user) {
      console.error("[generate-ibo-playlist] target user lookup failed", { targetUsername, message: userError?.message });
      return json({ error: "IPTV user not found" }, 404, corsHeaders);
    }

    const { data: streams, error: streamsError } = await supabase
      .from("live_streams")
      .select("id, name, stream_url, logo_url, sort_order, live_categories(name)")
      .eq("status", "Active")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (streamsError) {
      console.error("[generate-ibo-playlist] streams lookup failed", { message: streamsError.message });
      return json({ error: streamsError.message }, 400, corsHeaders);
    }

    const activeStreams = (streams ?? []).filter((stream: any) => cleanText(stream.stream_url) !== "");
    const m3u = buildM3u(activeStreams);
    const storagePath = `ibo/${user.username}.m3u`;

    const { error: bucketError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      allowedMimeTypes: ["application/x-mpegURL", "audio/x-mpegurl", "text/plain"],
      fileSizeLimit: 1024 * 1024,
    });

    if (bucketError && !bucketError.message.toLowerCase().includes("already exists")) {
      console.error("[generate-ibo-playlist] bucket creation failed", { message: bucketError.message });
      return json({ error: bucketError.message }, 400, corsHeaders);
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, new TextEncoder().encode(m3u), {
        contentType: CONTENT_TYPE,
        upsert: true,
      });

    if (uploadError) {
      console.error("[generate-ibo-playlist] storage upload failed", { storagePath, message: uploadError.message });
      return json({ error: uploadError.message }, 400, corsHeaders);
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
    const now = new Date().toISOString();

    const playlistRow = {
      user_id: user.id,
      username: user.username,
      bucket_name: BUCKET_NAME,
      storage_path: storagePath,
      public_url: publicUrlData.publicUrl,
      channel_count: activeStreams.length,
      generated_at: now,
      updated_at: now,
    };

    const { data: savedRow, error: saveError } = await supabase
      .from("ibo_playlists")
      .upsert(playlistRow, { onConflict: "username" })
      .select("id, user_id, username, bucket_name, storage_path, public_url, channel_count, generated_at, updated_at")
      .single();

    if (saveError) {
      console.error("[generate-ibo-playlist] metadata save failed", { message: saveError.message });
      return json({ error: saveError.message }, 400, corsHeaders);
    }

    console.log("[generate-ibo-playlist] playlist generated", {
      username: user.username,
      channelCount: activeStreams.length,
      storagePath,
    });

    return json({ playlist: savedRow }, 200, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[generate-ibo-playlist] unexpected failure", { message });
    return json({ error: message }, 500, corsHeaders);
  }
});

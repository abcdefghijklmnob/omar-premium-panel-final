import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

import { validateAdmin } from "../_shared/auth.ts";
import { createAdminClient } from "../_shared/client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { json } from "../_shared/utils.ts";

const BUCKET_NAME = "playlists";
const CONTENT_TYPE = "application/x-mpegURL; charset=utf-8";

type PlaylistRow = {
  tvgId: string;
  tvgName: string;
  tvgLogo: string;
  groupTitle: string;
  displayName: string;
  streamUrl: string;
};

function cleanText(value: string | null | undefined, fallback = "") {
  return (value ?? fallback).replace(/[\r\n]+/g, " ").replace(/"/g, "").trim() || fallback;
}

function buildM3u(rows: PlaylistRow[]) {
  const lines = ["#EXTM3U"];

  for (const row of rows) {
    lines.push(
      `#EXTINF:-1 tvg-id="${cleanText(row.tvgId)}" tvg-name="${cleanText(row.tvgName, "Channel")}" tvg-logo="${cleanText(row.tvgLogo)}" group-title="${cleanText(row.groupTitle, "Live TV")}",${cleanText(row.displayName, "Channel")}`,
    );
    lines.push(cleanText(row.streamUrl));
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
      .select("id, username")
      .eq("username", targetUsername)
      .maybeSingle();

    if (userError || !user) {
      console.error("[generate-ibo-playlist] target user lookup failed", { targetUsername, message: userError?.message });
      return json({ error: "IPTV user not found" }, 404, corsHeaders);
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from("ibo_user_subscriptions")
      .select("id, package_id, status, expiry_date")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError) {
      console.error("[generate-ibo-playlist] subscription lookup failed", { targetUsername, message: subscriptionError.message });
      return json({ error: subscriptionError.message }, 400, corsHeaders);
    }

    if (!subscription?.package_id) {
      return json({ error: "No package assigned to this user" }, 400, corsHeaders);
    }

    if (subscription.status && subscription.status !== "Active") {
      return json({ error: `Subscription status is ${subscription.status}` }, 400, corsHeaders);
    }

    const [liveResult, vodResult, seriesEpisodeResult] = await Promise.all([
      supabase
        .from("ibo_package_live_streams")
        .select("live_stream_id, live_streams(id, name, stream_url, logo_url, live_categories(name))")
        .eq("package_id", subscription.package_id),
      supabase
        .from("ibo_package_vod_streams")
        .select("vod_stream_id, vod_streams(id, title, stream_url, poster_url, vod_categories(name))")
        .eq("package_id", subscription.package_id),
      supabase
        .from("ibo_package_series")
        .select("series_id, series(title, poster_url), series_episodes!inner(id, episode_title, episode_number, stream_url, poster_url, status, season_id)")
        .eq("package_id", subscription.package_id),
    ]);

    if (liveResult.error || vodResult.error || seriesEpisodeResult.error) {
      const message = liveResult.error?.message || vodResult.error?.message || seriesEpisodeResult.error?.message || "Failed to load package content";
      console.error("[generate-ibo-playlist] package content lookup failed", { message });
      return json({ error: message }, 400, corsHeaders);
    }

    const rows: PlaylistRow[] = [];

    for (const item of liveResult.data ?? []) {
      const stream = item.live_streams as any;
      if (!stream?.stream_url) continue;
      rows.push({
        tvgId: String(stream.id),
        tvgName: cleanText(stream.name, "Live Channel"),
        tvgLogo: cleanText(stream.logo_url),
        groupTitle: cleanText(stream.live_categories?.name, "Live TV"),
        displayName: cleanText(stream.name, "Live Channel"),
        streamUrl: cleanText(stream.stream_url),
      });
    }

    for (const item of vodResult.data ?? []) {
      const stream = item.vod_streams as any;
      if (!stream?.stream_url) continue;
      rows.push({
        tvgId: `vod-${stream.id}`,
        tvgName: cleanText(stream.title, "Movie"),
        tvgLogo: cleanText(stream.poster_url),
        groupTitle: cleanText(stream.vod_categories?.name, "Movies"),
        displayName: cleanText(stream.title, "Movie"),
        streamUrl: cleanText(stream.stream_url),
      });
    }

    for (const item of seriesEpisodeResult.data ?? []) {
      const series = item.series as any;
      const episode = item.series_episodes as any;
      if (!episode?.stream_url || episode?.status !== "Active") continue;
      const episodeTitle = `${cleanText(series?.title, "Series")} - E${episode.episode_number} ${cleanText(episode.episode_title, "Episode")}`;
      rows.push({
        tvgId: `series-${episode.id}`,
        tvgName: episodeTitle,
        tvgLogo: cleanText(episode.poster_url || series?.poster_url),
        groupTitle: cleanText(series?.title, "Series"),
        displayName: episodeTitle,
        streamUrl: cleanText(episode.stream_url),
      });
    }

    if (rows.length === 0) {
      return json({ error: "No package content assigned to this user yet" }, 400, corsHeaders);
    }

    const m3u = buildM3u(rows);
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
      channel_count: rows.length,
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

    await supabase.from("ibo_activity_logs").insert({
      action: "generate_playlist",
      entity_type: "playlist",
      entity_id: savedRow.id,
      message: `Generated IBO playlist for ${user.username} with ${rows.length} items`,
    });

    console.log("[generate-ibo-playlist] playlist generated", {
      username: user.username,
      itemCount: rows.length,
      storagePath,
    });

    return json({ playlist: savedRow }, 200, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[generate-ibo-playlist] unexpected failure", { message });
    return json({ error: message }, 500, corsHeaders);
  }
});

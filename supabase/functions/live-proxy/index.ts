import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

import { validateIptvUser } from "../_shared/auth.ts";
import { createAdminClient } from "../_shared/client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { isSafeHttpUrl } from "../_shared/utils.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createAdminClient();
  const url = new URL(req.url);
  const username = url.searchParams.get("username");
  const password = url.searchParams.get("password");
  const streamId = url.searchParams.get("stream_id");

  try {
    const auth = await validateIptvUser(supabase, username, password);
    if (!auth.ok) {
      return new Response("Access denied", {
        status: auth.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    const numericStreamId = Number(streamId);
    if (!Number.isFinite(numericStreamId) || numericStreamId < 1) {
      return new Response("Invalid stream id", {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    const { data, error } = await supabase
      .from("live_streams")
      .select("stream_url, status")
      .eq("id", numericStreamId)
      .maybeSingle();

    if (error || !data || data.status !== "Active") {
      return new Response("Stream not found", {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    if (!isSafeHttpUrl(data.stream_url)) {
      return new Response("Unsafe stream source", {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    return Response.redirect(data.stream_url, 302);
  } catch (error) {
    console.error("[live-proxy] unhandled error", error);
    return new Response("Internal server error", {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
});

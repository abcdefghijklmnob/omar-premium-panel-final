import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

import { validateIptvUser } from "../_shared/auth.ts";
import { resolveBaseUrl } from "../_shared/base-url.ts";
import { createAdminClient } from "../_shared/client.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createAdminClient();
  const url = new URL(req.url);
  const username = url.searchParams.get("username");
  const password = url.searchParams.get("password");

  try {
    const auth = await validateIptvUser(supabase, username, password);
    if (!auth.ok) {
      return new Response("Authentication failed", {
        status: auth.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    const baseUrl = await resolveBaseUrl(supabase);

    const { data } = await supabase
      .from("live_streams")
      .select("id, name, logo_url, category_id, live_categories(name)")
      .eq("status", "Active")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    const lines = [
      `#EXTM3U x-tvg-url=\"${baseUrl}/xmltv.php?username=${encodeURIComponent(username ?? "")}&password=${encodeURIComponent(password ?? "")}\"`,
    ];

    for (const stream of data ?? []) {
      const categoryName = stream.live_categories?.name ?? "Live";
      lines.push(
        `#EXTINF:-1 tvg-id=\"${stream.id}\" tvg-name=\"${stream.name}\" tvg-logo=\"${stream.logo_url ?? ""}\" group-title=\"${categoryName}\",${stream.name}`,
      );
      lines.push(`${baseUrl}/live/${encodeURIComponent(username ?? "")}/${encodeURIComponent(password ?? "")}/${stream.id}.ts`);
    }

    return new Response(lines.join("\n"), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/x-mpegURL; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[get] unhandled error", error);
    return new Response("Internal server error", {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
});

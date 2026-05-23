import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

import { validateIptvUser } from "../_shared/auth.ts";
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
      return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?><tv></tv>", {
        status: auth.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/xml; charset=utf-8",
        },
      });
    }

    const { data } = await supabase
      .from("live_streams")
      .select("id, name, logo_url")
      .eq("status", "Active")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    const channelsXml = (data ?? [])
      .map((stream: any) => {
        const icon = stream.logo_url ? `<icon src=\"${stream.logo_url}\" />` : "";
        return `<channel id=\"${stream.id}\"><display-name>${stream.name}</display-name>${icon}</channel>`;
      })
      .join("");

    const xml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?><tv generator-info-name=\"OMAR PREMIUM PANEL\">${channelsXml}</tv>`;

    return new Response(xml, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[xmltv] unhandled error", error);
    return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?><tv></tv>", {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  }
});

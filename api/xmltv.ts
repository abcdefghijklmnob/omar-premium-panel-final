const ROUTE = "xmltv";
const EMPTY_XML = '<?xml version="1.0" encoding="UTF-8"?><tv></tv>';
const DEFAULT_SUPABASE_URL = "https://gsfzfsylnrirrhdtvjmg.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZnpmc3lsbnJpcnJoZHR2am1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NzY5MjgsImV4cCI6MjA5NTE1MjkyOH0.31h7kDHADeH_65pgvVyrmvZl219OUV6WMMEL5jQBi1U";

function getQuery(req: any, key: string) {
  const value = req?.query?.[key];
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    DEFAULT_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return { url, key };
}

async function callRpc(name: string, payload: Record<string, unknown>) {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Supabase RPC failed with status ${response.status}`);
  }

  return text;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "GET") {
      res.status(405).setHeader("Content-Type", "application/xml; charset=utf-8");
      return res.send(EMPTY_XML);
    }

    const xml = await callRpc("xtream_xmltv", {
      p_username: getQuery(req, "username"),
      p_password: getQuery(req, "password"),
    });

    const body = xml && xml.trim().startsWith("<?xml") ? xml : EMPTY_XML;
    res.status(200).setHeader("Content-Type", "application/xml; charset=utf-8");
    return res.send(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[api-xmltv] route failure", { message });
    res.status(200).setHeader("Content-Type", "application/xml; charset=utf-8");
    return res.send(`<?xml version="1.0" encoding="UTF-8"?><tv><!-- ${message.replace(/--/g, "")} --></tv>`);
  }
}

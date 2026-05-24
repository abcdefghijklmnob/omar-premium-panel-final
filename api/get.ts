const ROUTE = "get";
const DEFAULT_SUPABASE_URL = "https://gsfzfsylnrirrhdtvjmg.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZnpmc3lsbnJpcnJoZHR2am1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NzY5MjgsImV4cCI6MjA5NTE1MjkyOH0.31h7kDHADeH_65pgvVyrmvZl219OUV6WMMEL5jQBi1U";

function getBaseUrl(req: any) {
  const proto = req?.headers?.["x-forwarded-proto"] || "https";
  const host = req?.headers?.["x-forwarded-host"] || req?.headers?.host || "omar-premium-panel-final.vercel.app";
  return `${Array.isArray(proto) ? proto[0] : proto}://${Array.isArray(host) ? host[0] : host}`;
}

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
  const rpcUrl = `${url}/rest/v1/rpc/${name}`;

  console.log("[api-get] rpc start", {
    rpcUrl,
    hasKey: Boolean(key),
    payload,
  });

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();

  console.log("[api-get] rpc response", {
    status: response.status,
    ok: response.ok,
    preview: text.slice(0, 300),
  });

  if (!response.ok) {
    throw new Error(text || `Supabase RPC failed with status ${response.status}`);
  }

  return text;
}

export default async function handler(req: any, res: any) {
  console.log("[api-get] handler invoked", {
    method: req?.method,
    query: req?.query ?? null,
    hasHeaders: Boolean(req?.headers),
  });

  try {
    if (req.method !== "GET") {
      res.status(405).setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
      return res.send("#EXTM3U\n# ERROR: Method not allowed");
    }

    const baseUrl = getBaseUrl(req);
    const username = getQuery(req, "username");
    const password = getQuery(req, "password");

    console.log("[api-get] parsed request", {
      baseUrl,
      username,
      hasPassword: Boolean(password),
    });

    const playlist = await callRpc("xtream_get_m3u", {
      p_username: username,
      p_password: password,
      p_base_url: baseUrl,
    });

    const body = playlist && playlist.startsWith("#EXTM3U") ? playlist : "#EXTM3U";
    res.status(200).setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
    return res.send(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[api-get] route failure", {
      message,
      stack: error instanceof Error ? error.stack : null,
    });
    res.status(200).setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
    return res.send(`#EXTM3U\n# ERROR: ${message}`);
  }
}

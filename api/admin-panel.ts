const ROUTE = "admin_panel";
const DEFAULT_SUPABASE_URL = "https://gsfzfsylnrirrhdtvjmg.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZnpmc3lsbnJpcnJoZHR2am1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NzY5MjgsImV4cCI6MjA5NTE1MjkyOH0.31h7kDHADeH_65pgvVyrmvZl219OUV6WMMEL5jQBi1U";

function getHeader(req: any, key: string) {
  const value = req?.headers?.[key] ?? req?.headers?.[key.toLowerCase()];
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

async function getBody(req: any) {
  if (req?.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req?.body === "string") {
    return JSON.parse(req.body || "{}");
  }

  return {};
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

  return text ? JSON.parse(text) : {};
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: true, route: ROUTE, message: "Method not allowed" });
    }

    const body = await getBody(req);
    const action = String(body?.action ?? "");
    const username = getHeader(req, "x-admin-username") || String(body?.username ?? "");
    const password = getHeader(req, "x-admin-password") || String(body?.password ?? "");

    if (action === "login") {
      const admin = await callRpc("admin_login", {
        p_username: String(body?.username ?? ""),
        p_password: String(body?.password ?? ""),
      });
      return res.status(200).json({ admin });
    }

    if (action === "dashboard") {
      const dashboard = await callRpc("admin_dashboard", {
        p_username: username,
        p_password: password,
      });
      return res.status(200).json(dashboard);
    }

    if (action === "update_settings") {
      const server = await callRpc("admin_update_base_url", {
        p_username: username,
        p_password: password,
        p_base_url: String(body?.base_url ?? ""),
      });
      return res.status(200).json({ server });
    }

    if (action === "create_user") {
      const user = await callRpc("admin_create_user", {
        p_username: username,
        p_password: password,
        p_new_username: String(body?.username ?? ""),
        p_new_password: String(body?.password ?? ""),
        p_status: String(body?.status ?? "Active"),
        p_expiry_date: String(body?.expiry_date ?? ""),
        p_max_connections: Number(body?.max_connections ?? 1),
        p_notes: String(body?.notes ?? ""),
      });
      return res.status(200).json({ user });
    }

    if (action === "create_category") {
      const category = await callRpc("admin_create_category", {
        p_username: username,
        p_password: password,
        p_name: String(body?.name ?? ""),
        p_sort_order: Number(body?.sort_order ?? 0),
        p_image_url: String(body?.image_url ?? ""),
      });
      return res.status(200).json({ category });
    }

    if (action === "create_stream") {
      const stream = await callRpc("admin_create_stream", {
        p_username: username,
        p_password: password,
        p_name: String(body?.name ?? ""),
        p_stream_url: String(body?.stream_url ?? ""),
        p_logo_url: String(body?.logo_url ?? ""),
        p_category_id: Number(body?.category_id ?? 0),
        p_status: String(body?.status ?? "Active"),
        p_sort_order: Number(body?.sort_order ?? 0),
      });
      return res.status(200).json({ stream });
    }

    return res.status(400).json({ error: true, route: ROUTE, message: "Unsupported action", details: { action } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[api-admin-panel] route failure", { message });
    return res.status(400).json({ error: true, route: ROUTE, message });
  }
}

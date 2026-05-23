import { callRpc } from "./_lib/supabase";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const credentials = {
      username: String(req.headers["x-admin-username"] ?? body.username ?? ""),
      password: String(req.headers["x-admin-password"] ?? body.password ?? ""),
    };

    if (body.action === "login") {
      const admin = await callRpc("admin_login", {
        p_username: String(body.username ?? ""),
        p_password: String(body.password ?? ""),
      });
      res.status(200).json({ admin });
      return;
    }

    if (body.action === "dashboard") {
      const dashboard = await callRpc("admin_dashboard", {
        p_username: credentials.username,
        p_password: credentials.password,
      });
      res.status(200).json(dashboard);
      return;
    }

    if (body.action === "update_settings") {
      const server = await callRpc("admin_update_base_url", {
        p_username: credentials.username,
        p_password: credentials.password,
        p_base_url: String(body.base_url ?? ""),
      });
      res.status(200).json({ server });
      return;
    }

    if (body.action === "create_user") {
      const user = await callRpc("admin_create_user", {
        p_username: credentials.username,
        p_password: credentials.password,
        p_new_username: String(body.username ?? ""),
        p_new_password: String(body.password ?? ""),
        p_status: String(body.status ?? "Active"),
        p_expiry_date: String(body.expiry_date ?? ""),
        p_max_connections: Number(body.max_connections ?? 1),
        p_notes: String(body.notes ?? ""),
      });
      res.status(200).json({ user });
      return;
    }

    if (body.action === "create_category") {
      const category = await callRpc("admin_create_category", {
        p_username: credentials.username,
        p_password: credentials.password,
        p_name: String(body.name ?? ""),
        p_sort_order: Number(body.sort_order ?? 0),
        p_image_url: String(body.image_url ?? ""),
      });
      res.status(200).json({ category });
      return;
    }

    if (body.action === "create_stream") {
      const stream = await callRpc("admin_create_stream", {
        p_username: credentials.username,
        p_password: credentials.password,
        p_name: String(body.name ?? ""),
        p_stream_url: String(body.stream_url ?? ""),
        p_logo_url: String(body.logo_url ?? ""),
        p_category_id: Number(body.category_id ?? 0),
        p_status: String(body.status ?? "Active"),
        p_sort_order: Number(body.sort_order ?? 0),
      });
      res.status(200).json({ stream });
      return;
    }

    res.status(400).json({ error: "Unsupported action" });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
}

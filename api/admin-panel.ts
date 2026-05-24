import {
  callRpc,
  createErrorPayload,
  getBody,
  getHeader,
  getMethod,
  sendJson,
} from "./_lib/supabase";

const ROUTE = "admin_panel";

export default async function handler(req: any, res?: any) {
  if (getMethod(req) !== "POST") {
    return sendJson(res, 405, {
      error: true,
      route: ROUTE,
      message: "Method not allowed",
      details: null,
    });
  }

  try {
    const body = await getBody(req);
    const action = String(body?.action ?? "");
    const credentials = {
      username: getHeader(req, "x-admin-username") || String(body?.username ?? ""),
      password: getHeader(req, "x-admin-password") || String(body?.password ?? ""),
    };

    if (action === "login") {
      const admin = await callRpc("admin_login", {
        p_username: String(body?.username ?? ""),
        p_password: String(body?.password ?? ""),
      });
      return sendJson(res, 200, { admin });
    }

    if (action === "dashboard") {
      const dashboard = await callRpc("admin_dashboard", {
        p_username: credentials.username,
        p_password: credentials.password,
      });
      return sendJson(res, 200, dashboard);
    }

    if (action === "update_settings") {
      const server = await callRpc("admin_update_base_url", {
        p_username: credentials.username,
        p_password: credentials.password,
        p_base_url: String(body?.base_url ?? ""),
      });
      return sendJson(res, 200, { server });
    }

    if (action === "create_user") {
      const user = await callRpc("admin_create_user", {
        p_username: credentials.username,
        p_password: credentials.password,
        p_new_username: String(body?.username ?? ""),
        p_new_password: String(body?.password ?? ""),
        p_status: String(body?.status ?? "Active"),
        p_expiry_date: String(body?.expiry_date ?? ""),
        p_max_connections: Number(body?.max_connections ?? 1),
        p_notes: String(body?.notes ?? ""),
      });
      return sendJson(res, 200, { user });
    }

    if (action === "create_category") {
      const category = await callRpc("admin_create_category", {
        p_username: credentials.username,
        p_password: credentials.password,
        p_name: String(body?.name ?? ""),
        p_sort_order: Number(body?.sort_order ?? 0),
        p_image_url: String(body?.image_url ?? ""),
      });
      return sendJson(res, 200, { category });
    }

    if (action === "create_stream") {
      const stream = await callRpc("admin_create_stream", {
        p_username: credentials.username,
        p_password: credentials.password,
        p_name: String(body?.name ?? ""),
        p_stream_url: String(body?.stream_url ?? ""),
        p_logo_url: String(body?.logo_url ?? ""),
        p_category_id: Number(body?.category_id ?? 0),
        p_status: String(body?.status ?? "Active"),
        p_sort_order: Number(body?.sort_order ?? 0),
      });
      return sendJson(res, 200, { stream });
    }

    return sendJson(res, 400, {
      error: true,
      route: ROUTE,
      message: "Unsupported action",
      details: { action },
    });
  } catch (error) {
    return sendJson(res, 400, createErrorPayload(ROUTE, error));
  }
}

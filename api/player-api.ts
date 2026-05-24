import {
  callRpc,
  createErrorPayload,
  getMethod,
  getQueryParam,
  getRequestBaseUrl,
  sendJson,
} from "./_lib/supabase";

const ROUTE = "player_api";

export default async function handler(req: any, res?: any) {
  if (getMethod(req) !== "GET") {
    return sendJson(res, 405, {
      error: true,
      route: ROUTE,
      message: "Method not allowed",
      details: null,
    });
  }

  try {
    const baseUrl = getRequestBaseUrl(req);
    const data = await callRpc("xtream_player_api", {
      p_username: getQueryParam(req, "username"),
      p_password: getQueryParam(req, "password"),
      p_action: getQueryParam(req, "action") || null,
      p_base_url: baseUrl,
    });

    return sendJson(res, 200, data ?? {});
  } catch (error) {
    return sendJson(res, 200, createErrorPayload(ROUTE, error));
  }
}

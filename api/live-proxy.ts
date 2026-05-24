import {
  callRpc,
  createErrorPayload,
  getMethod,
  getQueryParam,
  redirectTo,
  sendJson,
} from "./_lib/supabase";

const ROUTE = "live_proxy";

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
    const sourceUrl = await callRpc("xtream_live_redirect_source", {
      p_username: getQueryParam(req, "username"),
      p_password: getQueryParam(req, "password"),
      p_stream_id: Number(getQueryParam(req, "stream_id") || 0),
    });

    if (typeof sourceUrl !== "string" || !sourceUrl) {
      return sendJson(res, 404, {
        error: true,
        route: ROUTE,
        message: "Stream source not found",
        details: null,
      });
    }

    return redirectTo(res, sourceUrl, 302);
  } catch (error) {
    return sendJson(res, 404, createErrorPayload(ROUTE, error));
  }
}

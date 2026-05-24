import {
  callRpc,
  createErrorPayload,
  getMethod,
  getQueryParam,
  getRequestBaseUrl,
  sendText,
} from "./_lib/supabase";

const ROUTE = "get";

export default async function handler(req: any, res?: any) {
  if (getMethod(req) !== "GET") {
    return sendText(res, 405, "#EXTM3U\n# Method not allowed", "application/x-mpegURL; charset=utf-8");
  }

  try {
    const baseUrl = getRequestBaseUrl(req);
    const playlist = await callRpc("xtream_get_m3u", {
      p_username: getQueryParam(req, "username"),
      p_password: getQueryParam(req, "password"),
      p_base_url: baseUrl,
    });

    const body = typeof playlist === "string" && playlist.startsWith("#EXTM3U") ? playlist : "#EXTM3U";
    return sendText(res, 200, body, "application/x-mpegURL; charset=utf-8");
  } catch (error) {
    const errorBody = createErrorPayload(ROUTE, error);
    return sendText(
      res,
      200,
      `#EXTM3U\n# ERROR: ${errorBody.message}`,
      "application/x-mpegURL; charset=utf-8",
    );
  }
}

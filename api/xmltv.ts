import {
  callRpc,
  createErrorPayload,
  getMethod,
  getQueryParam,
  sendText,
} from "./_lib/supabase";

const ROUTE = "xmltv";
const EMPTY_XML = '<?xml version="1.0" encoding="UTF-8"?><tv></tv>';

export default async function handler(req: any, res?: any) {
  if (getMethod(req) !== "GET") {
    return sendText(res, 405, EMPTY_XML, "application/xml; charset=utf-8");
  }

  try {
    const xml = await callRpc("xtream_xmltv", {
      p_username: getQueryParam(req, "username"),
      p_password: getQueryParam(req, "password"),
    });

    const body = typeof xml === "string" && xml.trim().startsWith("<?xml") ? xml : EMPTY_XML;
    return sendText(res, 200, body, "application/xml; charset=utf-8");
  } catch (error) {
    const errorBody = createErrorPayload(ROUTE, error);
    return sendText(
      res,
      200,
      `<?xml version="1.0" encoding="UTF-8"?><tv><!-- ${String(errorBody.message).replace(/--/g, "") } --></tv>`,
      "application/xml; charset=utf-8",
    );
  }
}

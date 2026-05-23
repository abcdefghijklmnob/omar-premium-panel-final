import { callRpc, getRequestBaseUrl } from "./_lib/supabase";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const baseUrl = getRequestBaseUrl(req);
    const playlist = await callRpc("xtream_get_m3u", {
      p_username: String(req.query.username ?? ""),
      p_password: String(req.query.password ?? ""),
      p_base_url: baseUrl,
    });

    res.status(200).setHeader("Content-Type", "application/x-mpegURL; charset=utf-8");
    res.send(String(playlist ?? "#EXTM3U"));
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : "Internal server error");
  }
}

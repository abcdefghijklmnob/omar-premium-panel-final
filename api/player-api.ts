import { callRpc, getRequestBaseUrl } from "./_lib/supabase";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const baseUrl = getRequestBaseUrl(req);
    const data = await callRpc("xtream_player_api", {
      p_username: String(req.query.username ?? ""),
      p_password: String(req.query.password ?? ""),
      p_action: req.query.action ? String(req.query.action) : null,
      p_base_url: baseUrl,
    });

    res.status(200).setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(JSON.stringify(data));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
}

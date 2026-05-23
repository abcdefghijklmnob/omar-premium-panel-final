import { callRpc } from "./_lib/supabase";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const sourceUrl = await callRpc("xtream_live_redirect_source", {
      p_username: String(req.query.username ?? ""),
      p_password: String(req.query.password ?? ""),
      p_stream_id: Number(req.query.stream_id ?? 0),
    });

    res.writeHead(302, { Location: String(sourceUrl) });
    res.end();
  } catch (error) {
    res.status(404).send(error instanceof Error ? error.message : "Stream not found");
  }
}

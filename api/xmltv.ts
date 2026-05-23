import { callRpc } from "./_lib/supabase";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const xml = await callRpc("xtream_xmltv", {
      p_username: String(req.query.username ?? ""),
      p_password: String(req.query.password ?? ""),
    });

    res.status(200).setHeader("Content-Type", "application/xml; charset=utf-8");
    res.send(String(xml ?? '<?xml version="1.0" encoding="UTF-8"?><tv></tv>'));
  } catch (error) {
    res.status(500).setHeader("Content-Type", "application/xml; charset=utf-8");
    res.send('<?xml version="1.0" encoding="UTF-8"?><tv></tv>');
  }
}

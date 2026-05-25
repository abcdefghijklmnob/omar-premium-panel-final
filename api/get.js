export default function handler(req, res) {
  const proto = Array.isArray(req?.headers?.["x-forwarded-proto"])
    ? req.headers["x-forwarded-proto"][0]
    : req?.headers?.["x-forwarded-proto"] || "https";
  const host = Array.isArray(req?.headers?.["x-forwarded-host"])
    ? req.headers["x-forwarded-host"][0]
    : req?.headers?.["x-forwarded-host"] || req?.headers?.host || "omar-premium-panel-final.vercel.app";
  const baseUrl = `${proto}://${host}`;
  const lineBreak = "\r\n";
  const m3u = [
    "#EXTM3U",
    '#EXTINF:-1 tvg-id="1" tvg-name="Test Channel" tvg-logo="" group-title="Live TV",Test Channel',
    `${baseUrl}/live/testuser/testpass/1.ts`,
    "",
  ].join(lineBreak);

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  return res.status(200).send(m3u);
}

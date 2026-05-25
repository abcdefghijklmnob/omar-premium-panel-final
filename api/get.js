export default function handler(req, res) {
  const m3u = `#EXTM3U
#EXTINF:-1 tvg-name="Test Channel" group-title="Live TV",Test Channel
https://omar-premium-panel-final.vercel.app/live/testuser/testpass/1.ts
`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  return res.status(200).send(m3u);
}

const STATIC_M3U = `#EXTM3U
#EXTINF:-1 tvg-name="Test Channel" group-title="Live TV",Test Channel
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`;

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
    return res.send("#EXTM3U\n# ERROR: Method not allowed");
  }

  res.status(200).setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
  return res.send(STATIC_M3U);
}

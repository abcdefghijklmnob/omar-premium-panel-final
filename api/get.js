export default function handler(req, res) {
  const m3u = `#EXTM3U
#EXTINF:-1 tvg-name="Test Channel" group-title="Live TV",Test Channel
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
`;

  const debug = req?.query?.debug;
  const isDebug = debug === "1" || debug === 1;

  res.setHeader(
    "Content-Type",
    isDebug ? "text/plain; charset=utf-8" : "application/vnd.apple.mpegurl; charset=utf-8",
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  return res.status(200).send(m3u);
}

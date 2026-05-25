export default function handler(req, res) {
  const lineBreak = "\r\n";
  const m3u = [
    "#EXTM3U",
    '#EXTINF:-1 tvg-id="1" tvg-name="Test Channel" tvg-logo="" group-title="Live TV",Test Channel',
    "https://iptv.omar-soft.com/omar1996/omar1984/248219897.m3u8",
    "",
  ].join(lineBreak);

  res.setHeader("Content-Type", "application/x-mpegURL; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).send(m3u);
}

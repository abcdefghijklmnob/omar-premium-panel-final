const XMLTV = `<?xml version="1.0" encoding="UTF-8"?>
<tv generator-info-name="OMAR PREMIUM PANEL">
  <channel id="test-channel">
    <display-name>Test Channel</display-name>
  </channel>
  <programme start="20260101000000 +0000" stop="20260101235959 +0000" channel="test-channel">
    <title>Test Channel</title>
    <desc>Static XMLTV test feed</desc>
  </programme>
</tv>`;

export default function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  return res.status(200).send(XMLTV);
}

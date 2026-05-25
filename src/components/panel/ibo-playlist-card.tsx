import { Download, ExternalLink, Files, TestTube2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type IboPlaylistCardProps = {
  baseUrl: string;
  username: string;
};

const TEST_STREAM_URL = "https://iptv.omar-soft.com/omar1996/omar1984/248219897.m3u8";

export function IboPlaylistCard({ baseUrl, username }: IboPlaylistCardProps) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const hostedUrl = `${normalizedBaseUrl}/ibo/${username}.m3u`;
  const m3u = [
    "#EXTM3U",
    '#EXTINF:-1 tvg-id="1" tvg-name="Test Channel" tvg-logo="" group-title="Live TV",Test Channel',
    TEST_STREAM_URL,
    "",
  ].join("\r\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hostedUrl);
      toast.success("تم نسخ رابط ملف الاختبار");
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([m3u], { type: "application/x-mpegURL;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${username}-test.m3u`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("تم تنزيل ملف الاختبار");
  };

  return (
    <Card className="rounded-[2rem] border-white/10 bg-[#0b1228] shadow-[0_20px_60px_rgba(5,10,30,0.35)]">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg text-white">IBO Static Test Playlist</CardTitle>
        <TestTube2 className="h-5 w-5 text-[#f59e0b]" />
      </CardHeader>
      <CardContent className="space-y-4 text-right">
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-7 text-emerald-100">
          هذا الملف الثابت يبقى للاختبار فقط. التوليد الحقيقي لكل مستخدم يظهر الآن داخل جدول المستخدمين ويُحفظ في Supabase Storage.
        </div>

        <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-slate-400">Static test URL</p>
            <p className="mt-1 break-all text-white" dir="ltr">{hostedUrl}</p>
          </div>
          <div>
            <p className="text-slate-400">Current test stream</p>
            <p className="mt-1 break-all text-white" dir="ltr">{TEST_STREAM_URL}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button onClick={handleDownload} className="rounded-2xl bg-[#6D4CFF] text-white hover:bg-[#7B5DFF]">
            <Download className="ml-2 h-4 w-4" />
            Download test M3U
          </Button>
          <Button type="button" variant="outline" onClick={handleCopy} className="rounded-2xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">
            <Files className="ml-2 h-4 w-4" />
            نسخ الرابط
          </Button>
          <Button type="button" variant="outline" asChild className="rounded-2xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">
            <a href={hostedUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="ml-2 h-4 w-4" />
              فتح الملف
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { AlertTriangle, Globe, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ServerSettings } from "@/lib/panel-api";

type SettingsCardProps = {
  server: ServerSettings;
  onSave: (baseUrl: string) => Promise<void>;
  disabled?: boolean;
};

export function SettingsCard({ server, onSave, disabled }: SettingsCardProps) {
  const [baseUrl, setBaseUrl] = useState(server.configuredBaseUrl || server.baseUrl);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBaseUrl(server.configuredBaseUrl || server.baseUrl);
  }, [server.baseUrl, server.configuredBaseUrl]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(baseUrl);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg text-white">Settings • Server Base URL</CardTitle>
        <Globe className="h-5 w-5 text-[#8f7dff]" />
      </CardHeader>
      <CardContent className="space-y-4 text-right">
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-100">
          <div className="flex items-start justify-between gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <p className="font-medium text-amber-200">تنبيه مهم</p>
              <p className="mt-2 text-sm leading-7 text-amber-100/90">
                localhost links are only for development and will not work in IPTV apps. استخدم رابط النشر الحقيقي مثل Vercel أو دومين عام، وليس Supabase edge runtime.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Server Base URL</Label>
          <Input
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="https://omar-premium-panel.vercel.app"
            className="h-12 rounded-2xl border-white/10 bg-[#101a39] text-left text-white"
            dir="ltr"
            disabled={disabled || saving}
          />
          <p className="text-xs leading-6 text-slate-500">
            استخدم دومينًا عامًا قابلًا للوصول من الخارج مثل Vercel أو Netlify أو Render. لا تضع localhost هنا.
          </p>
        </div>

        <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-slate-400">Configured Public App URL</p>
            <p className="mt-1 break-all text-white" dir="ltr">
              {server.configuredBaseUrl || "غير محدد بعد"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Current IPTV Server URL</p>
            <p className="mt-1 break-all text-white" dir="ltr">
              {server.baseUrl}
            </p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={disabled || saving}
          className="w-full rounded-2xl bg-[#6D4CFF] text-white hover:bg-[#7B5DFF]"
        >
          <Save className="ml-2 h-4 w-4" />
          {saving ? "جارٍ حفظ الإعدادات..." : "حفظ Server Base URL"}
        </Button>
      </CardContent>
    </Card>
  );
}

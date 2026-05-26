import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Copy,
  Cpu,
  ExternalLink,
  Globe,
  Package2,
  RefreshCcw,
  Save,
  ShieldBan,
  Tv2,
  UserCog,
  WandSparkles,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import {
  AdminCredentials,
  generateIboPlaylist,
  getIboPanelData,
  IboDevice,
  IboPackage,
  IboPanelData,
  IboPanelUser,
  IboSettings,
  saveIboDevice,
  saveIboPackage,
  saveIboSettings,
  saveIboUser,
  saveIboUserSubscription,
  deleteIboDevice,
  deleteIboPackage,
} from "@/lib/ibo-api";
import { StatsCard } from "@/components/panel/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type IboAdminPanelProps = {
  credentials: AdminCredentials;
};

type IboSection = "overview" | "devices" | "users" | "packages" | "settings";

type DeviceFormState = {
  id?: string;
  mac_address: string;
  device_key: string;
  user_id?: string;
  package_id?: number;
  status: string;
  expiry_date: string;
  last_seen: string;
  last_ip: string;
  location: string;
  notes: string;
};

type PackageFormState = {
  id?: number;
  name: string;
  description: string;
  duration_days: number;
  max_connections: number;
  status: string;
  notes: string;
  live_stream_ids: number[];
  vod_stream_ids: number[];
  series_ids: number[];
};

type SubscriptionFormState = {
  user_id: string;
  package_id?: number;
  status: string;
  expiry_date: string;
  max_connections: number;
  notes: string;
};

type UserFormState = {
  user_id: string;
  status: string;
  expiry_date: string;
  max_connections: number;
  notes: string;
};

const sectionButtonClass = (active: boolean) =>
  `rounded-2xl border px-4 py-2 text-sm transition ${
    active
      ? "border-[#6D4CFF]/40 bg-[#6D4CFF]/20 text-white"
      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
  }`;

const statusStyles: Record<string, string> = {
  Active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  Expired: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  Blocked: "bg-rose-500/15 text-rose-300 border-rose-500/20",
  Disabled: "bg-slate-500/15 text-slate-300 border-slate-500/20",
};

const initialDeviceForm: DeviceFormState = {
  mac_address: "",
  device_key: "",
  status: "Active",
  expiry_date: "",
  last_seen: "",
  last_ip: "",
  location: "",
  notes: "",
};

const initialPackageForm: PackageFormState = {
  name: "",
  description: "",
  duration_days: 30,
  max_connections: 1,
  status: "Active",
  notes: "",
  live_stream_ids: [],
  vod_stream_ids: [],
  series_ids: [],
};

const initialSubscriptionForm: SubscriptionFormState = {
  user_id: "",
  status: "Active",
  expiry_date: "",
  max_connections: 1,
  notes: "",
};

const initialUserForm: UserFormState = {
  user_id: "",
  status: "Active",
  expiry_date: "",
  max_connections: 1,
  notes: "",
};

function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function toDateTimeInput(value: string | null | undefined) {
  return value ? value.slice(0, 16) : "";
}

function toggleSelection(current: number[], value: number) {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

export function IboAdminPanel({ credentials }: IboAdminPanelProps) {
  const [section, setSection] = useState<IboSection>("overview");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IboPanelData | null>(null);
  const [deviceForm, setDeviceForm] = useState<DeviceFormState>(initialDeviceForm);
  const [packageForm, setPackageForm] = useState<PackageFormState>(initialPackageForm);
  const [subscriptionForm, setSubscriptionForm] = useState<SubscriptionFormState>(initialSubscriptionForm);
  const [userForm, setUserForm] = useState<UserFormState>(initialUserForm);
  const [savingDevice, setSavingDevice] = useState(false);
  const [savingPackage, setSavingPackage] = useState(false);
  const [savingSubscription, setSavingSubscription] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [generatingUser, setGeneratingUser] = useState<string | null>(null);

  const loadPanel = async () => {
    setLoading(true);
    try {
      const nextData = await getIboPanelData(credentials);
      setData(nextData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحميل لوحة IBO");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPanel();
  }, [credentials.username, credentials.password]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Active", value: data.counts.active_devices },
      { name: "Expired", value: data.counts.expired_devices },
      { name: "Blocked", value: data.counts.blocked_devices },
      { name: "Packages", value: data.counts.packages },
    ];
  }, [data]);

  const contentChartData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Live", value: data.counts.channels },
      { name: "Movies", value: data.counts.movies },
      { name: "Series", value: data.counts.series },
    ];
  }, [data]);

  const currentSettings: IboSettings = useMemo(
    () =>
      data?.settings ?? {
        app_name: "OMAR IBO PANEL",
        logo_url: "",
        api_base_url: "",
        default_epg_url: "",
        theme_mode: "system",
        primary_color: "#6D4CFF",
        secondary_color: "#1ec8a5",
        maintenance_mode: false,
        notifications_enabled: true,
      },
    [data],
  );

  const [settingsForm, setSettingsForm] = useState<IboSettings>(currentSettings);

  useEffect(() => {
    setSettingsForm(currentSettings);
  }, [currentSettings]);

  if (!data) {
    return (
      <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
        <CardContent className="p-8 text-center text-slate-300">جارٍ تحميل لوحة IBO...</CardContent>
      </Card>
    );
  }

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("تم نسخ الرابط");
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  };

  const downloadPlaylist = async (url: string, username: string) => {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to download playlist");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${username}.m3u`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("تم تنزيل ملف M3U");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تنزيل الملف");
    }
  };

  const handleSaveDevice = async () => {
    setSavingDevice(true);
    try {
      await saveIboDevice(credentials, {
        ...deviceForm,
        user_id: deviceForm.user_id || null,
        package_id: deviceForm.package_id || null,
        expiry_date: deviceForm.expiry_date || null,
        last_seen: deviceForm.last_seen || null,
      });
      toast.success(deviceForm.id ? "تم تحديث الجهاز" : "تمت إضافة الجهاز");
      setDeviceForm(initialDeviceForm);
      await loadPanel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الجهاز");
    } finally {
      setSavingDevice(false);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      await deleteIboDevice(credentials, deviceId);
      toast.success("تم حذف الجهاز");
      await loadPanel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف الجهاز");
    }
  };

  const handleSavePackage = async () => {
    setSavingPackage(true);
    try {
      await saveIboPackage(credentials, packageForm);
      toast.success(packageForm.id ? "تم تحديث الباقة" : "تمت إضافة الباقة");
      setPackageForm(initialPackageForm);
      await loadPanel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الباقة");
    } finally {
      setSavingPackage(false);
    }
  };

  const handleDeletePackage = async (packageId: number) => {
    try {
      await deleteIboPackage(credentials, packageId);
      toast.success("تم حذف الباقة");
      await loadPanel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف الباقة");
    }
  };

  const handleSaveSubscription = async () => {
    if (!subscriptionForm.user_id) {
      toast.error("اختر مستخدمًا أولًا");
      return;
    }

    setSavingSubscription(true);
    try {
      await saveIboUserSubscription(credentials, {
        ...subscriptionForm,
        package_id: subscriptionForm.package_id || null,
        expiry_date: subscriptionForm.expiry_date || null,
      });
      toast.success("تم حفظ الاشتراك وربطه بالباقة");
      setSubscriptionForm(initialSubscriptionForm);
      await loadPanel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الاشتراك");
    } finally {
      setSavingSubscription(false);
    }
  };

  const handleSaveUser = async () => {
    if (!userForm.user_id) {
      toast.error("اختر مستخدمًا أولًا");
      return;
    }

    setSavingUser(true);
    try {
      await saveIboUser(credentials, {
        ...userForm,
        expiry_date: userForm.expiry_date || null,
      });
      toast.success("تم تحديث المستخدم");
      setUserForm(initialUserForm);
      await loadPanel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث المستخدم");
    } finally {
      setSavingUser(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await saveIboSettings(credentials, settingsForm);
      toast.success("تم حفظ إعدادات IBO");
      await loadPanel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الإعدادات");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleGeneratePlaylist = async (username: string) => {
    setGeneratingUser(username);
    try {
      await generateIboPlaylist(credentials, username);
      toast.success(`تم توليد ملف IBO للمستخدم ${username}`);
      await loadPanel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر توليد الملف");
    } finally {
      setGeneratingUser(null);
    }
  };

  return (
    <section className="space-y-6">
      <Card className="rounded-[2rem] border-white/10 bg-[#0b1228] shadow-[0_30px_80px_rgba(5,10,30,0.35)]">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3 text-right">
              <div className="flex items-center justify-end gap-3">
                <div className="rounded-2xl border border-[#1ec8a5]/30 bg-[#1ec8a5]/15 p-3">
                  <Cpu className="h-6 w-6 text-[#5eead4]" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#65e3cf]">IBO</p>
                  <h2 className="text-2xl font-semibold text-white sm:text-3xl">لوحة إدارة IBO الاحترافية</h2>
                </div>
              </div>
              <p className="max-w-3xl text-sm leading-7 text-slate-400">
                إدارة الأجهزة، الباقات، الاشتراكات، ربط المحتوى، إعدادات IBO، وتوليد روابط M3U عامة تعمل عبر Supabase Storage.
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setSection("overview")} className={sectionButtonClass(section === "overview")}>Overview</button>
              <button type="button" onClick={() => setSection("devices")} className={sectionButtonClass(section === "devices")}>Devices</button>
              <button type="button" onClick={() => setSection("users")} className={sectionButtonClass(section === "users")}>Users & Links</button>
              <button type="button" onClick={() => setSection("packages")} className={sectionButtonClass(section === "packages")}>Packages</button>
              <button type="button" onClick={() => setSection("settings")} className={sectionButtonClass(section === "settings")}>Settings</button>
              <Button onClick={loadPanel} variant="outline" className="rounded-2xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">
                <RefreshCcw className="ml-2 h-4 w-4" />
                تحديث
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {section === "overview" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <StatsCard title="الأجهزة" value={data.counts.devices} description="إجمالي أجهزة IBO" icon={Cpu} iconClassName="bg-[#6D4CFF]" />
            <StatsCard title="النشطة" value={data.counts.active_devices} description="أجهزة فعّالة" icon={WandSparkles} iconClassName="bg-[#1ec8a5]" />
            <StatsCard title="المنتهية" value={data.counts.expired_devices} description="أجهزة منتهية" icon={ShieldBan} iconClassName="bg-[#f59e0b]" />
            <StatsCard title="المحظورة" value={data.counts.blocked_devices} description="أجهزة محظورة" icon={ShieldBan} iconClassName="bg-[#ef4444]" />
            <StatsCard title="الباقات" value={data.counts.packages} description="باقات IBO" icon={Package2} iconClassName="bg-[#38bdf8]" />
            <StatsCard title="المستخدمون المتصلون" value={data.counts.connected_users} description="مستخدمون بأجهزة نشطة" icon={UserCog} iconClassName="bg-[#ec4899]" />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
              <CardHeader>
                <CardTitle className="text-lg text-white">إحصائيات الأجهزة والباقات</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6D4CFF" radius={[12, 12, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
              <CardHeader>
                <CardTitle className="text-lg text-white">إجمالي المحتوى المربوط بالنظام</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1ec8a5" radius={[12, 12, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg text-white">آخر النشاطات</CardTitle>
                <BarChart3 className="h-5 w-5 text-[#8f7dff]" />
              </CardHeader>
              <CardContent className="space-y-3">
                {data.logs.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-right text-slate-400">لا توجد نشاطات بعد.</div>
                ) : (
                  data.logs.map((log) => (
                    <div key={log.id} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-right">
                      <div className="flex items-center justify-between gap-3">
                        <Badge className="rounded-full border border-white/10 bg-white/10 text-slate-200">{log.entity_type}</Badge>
                        <p className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</p>
                      </div>
                      <p className="mt-3 text-sm text-white">{log.message}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg text-white">أحدث روابط IBO</CardTitle>
                <Globe className="h-5 w-5 text-[#1ec8a5]" />
              </CardHeader>
              <CardContent className="space-y-3 text-right">
                {data.playlists.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-slate-400">لم يتم توليد أي رابط M3U بعد.</div>
                ) : (
                  data.playlists.slice(0, 5).map((playlist) => (
                    <div key={playlist.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <p className="font-medium text-white">{playlist.username}</p>
                      <p className="mt-2 break-all text-xs text-slate-400" dir="ltr">{playlist.public_url}</p>
                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(playlist.public_url)} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"><Copy className="ml-2 h-4 w-4" />Copy</Button>
                        <Button size="sm" variant="outline" asChild className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"><a href={playlist.public_url} target="_blank" rel="noreferrer"><ExternalLink className="ml-2 h-4 w-4" />Open</a></Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      ) : null}

      {section === "devices" ? (
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
            <CardHeader>
              <CardTitle className="text-lg text-white">{deviceForm.id ? "تعديل جهاز IBO" : "إضافة جهاز IBO"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-right">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label className="text-slate-300">MAC Address</Label><Input value={deviceForm.mac_address} onChange={(e) => setDeviceForm((p) => ({ ...p, mac_address: e.target.value.toUpperCase() }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
                <div className="space-y-2"><Label className="text-slate-300">Device Key</Label><Input value={deviceForm.device_key} onChange={(e) => setDeviceForm((p) => ({ ...p, device_key: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
                <div className="space-y-2"><Label className="text-slate-300">User</Label><select value={deviceForm.user_id ?? ""} onChange={(e) => setDeviceForm((p) => ({ ...p, user_id: e.target.value || undefined }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="">بدون مستخدم</option>{data.users.map((user) => <option key={user.id} value={user.id}>{user.username}</option>)}</select></div>
                <div className="space-y-2"><Label className="text-slate-300">Package</Label><select value={deviceForm.package_id ?? ""} onChange={(e) => setDeviceForm((p) => ({ ...p, package_id: e.target.value ? Number(e.target.value) : undefined }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="">بدون باقة</option>{data.packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name}</option>)}</select></div>
                <div className="space-y-2"><Label className="text-slate-300">Expiry Date</Label><Input type="date" value={deviceForm.expiry_date} onChange={(e) => setDeviceForm((p) => ({ ...p, expiry_date: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
                <div className="space-y-2"><Label className="text-slate-300">Status</Label><select value={deviceForm.status} onChange={(e) => setDeviceForm((p) => ({ ...p, status: e.target.value }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="Active">Active</option><option value="Expired">Expired</option><option value="Blocked">Blocked</option><option value="Disabled">Disabled</option></select></div>
                <div className="space-y-2"><Label className="text-slate-300">Last Seen</Label><Input type="datetime-local" value={deviceForm.last_seen} onChange={(e) => setDeviceForm((p) => ({ ...p, last_seen: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
                <div className="space-y-2"><Label className="text-slate-300">IP</Label><Input value={deviceForm.last_ip} onChange={(e) => setDeviceForm((p) => ({ ...p, last_ip: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
                <div className="space-y-2 sm:col-span-2"><Label className="text-slate-300">Location</Label><Input value={deviceForm.location} onChange={(e) => setDeviceForm((p) => ({ ...p, location: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
                <div className="space-y-2 sm:col-span-2"><Label className="text-slate-300">Notes</Label><Textarea value={deviceForm.notes} onChange={(e) => setDeviceForm((p) => ({ ...p, notes: e.target.value }))} className="min-h-24 rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSaveDevice} disabled={savingDevice} className="rounded-2xl bg-[#6D4CFF] text-white hover:bg-[#7B5DFF]"><Save className="ml-2 h-4 w-4" />{savingDevice ? "جارٍ الحفظ..." : deviceForm.id ? "حفظ الجهاز" : "إضافة الجهاز"}</Button>
                <Button type="button" variant="outline" onClick={() => setDeviceForm(initialDeviceForm)} className="rounded-2xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">إلغاء</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
            <CardHeader><CardTitle className="text-lg text-white">قائمة أجهزة IBO</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-right text-slate-400">MAC</TableHead>
                    <TableHead className="text-right text-slate-400">المستخدم</TableHead>
                    <TableHead className="text-right text-slate-400">الباقة</TableHead>
                    <TableHead className="text-right text-slate-400">الحالة</TableHead>
                    <TableHead className="text-right text-slate-400">Last seen</TableHead>
                    <TableHead className="text-right text-slate-400">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.devices.map((device) => (
                    <TableRow key={device.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-right text-white"><div><p className="font-medium" dir="ltr">{device.mac_address}</p><p className="text-xs text-slate-500" dir="ltr">{device.device_key}</p></div></TableCell>
                      <TableCell className="text-right text-slate-300">{device.username || "—"}</TableCell>
                      <TableCell className="text-right text-slate-300">{device.package_name || "—"}</TableCell>
                      <TableCell className="text-right"><Badge className={`rounded-full border ${statusStyles[device.status] ?? statusStyles.Disabled}`}>{device.status}</Badge></TableCell>
                      <TableCell className="text-right text-slate-300">{device.last_seen ? new Date(device.last_seen).toLocaleString() : "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setDeviceForm({
                            id: device.id,
                            mac_address: device.mac_address,
                            device_key: device.device_key,
                            user_id: device.user_id ?? undefined,
                            package_id: device.package_id ?? undefined,
                            status: device.status,
                            expiry_date: toDateInput(device.expiry_date),
                            last_seen: toDateTimeInput(device.last_seen),
                            last_ip: device.last_ip ?? "",
                            location: device.location ?? "",
                            notes: device.notes ?? "",
                          })} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => setDeviceForm({
                            id: device.id,
                            mac_address: device.mac_address,
                            device_key: device.device_key,
                            user_id: device.user_id ?? undefined,
                            package_id: device.package_id ?? undefined,
                            status: device.status === "Blocked" ? "Active" : "Blocked",
                            expiry_date: toDateInput(device.expiry_date),
                            last_seen: toDateTimeInput(device.last_seen),
                            last_ip: device.last_ip ?? "",
                            location: device.location ?? "",
                            notes: device.notes ?? "",
                          })} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">Toggle</Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteDevice(device.id)} className="rounded-xl border-rose-500/20 bg-transparent text-rose-300 hover:bg-rose-500/10 hover:text-rose-200">Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {section === "users" ? (
        <div className="space-y-6">
          <section className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
              <CardHeader><CardTitle className="text-lg text-white">إدارة اشتراك المستخدم وربطه بالباقة</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-right">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2"><Label className="text-slate-300">المستخدم</Label><select value={subscriptionForm.user_id} onChange={(e) => setSubscriptionForm((p) => ({ ...p, user_id: e.target.value }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="">اختر مستخدمًا</option>{data.users.map((user) => <option key={user.id} value={user.id}>{user.username}</option>)}</select></div>
                  <div className="space-y-2"><Label className="text-slate-300">الباقة</Label><select value={subscriptionForm.package_id ?? ""} onChange={(e) => setSubscriptionForm((p) => ({ ...p, package_id: e.target.value ? Number(e.target.value) : undefined }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="">بدون باقة</option>{data.packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name}</option>)}</select></div>
                  <div className="space-y-2"><Label className="text-slate-300">الحالة</Label><select value={subscriptionForm.status} onChange={(e) => setSubscriptionForm((p) => ({ ...p, status: e.target.value }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="Active">Active</option><option value="Expired">Expired</option><option value="Blocked">Blocked</option><option value="Disabled">Disabled</option></select></div>
                  <div className="space-y-2"><Label className="text-slate-300">Expiry Date</Label><Input type="date" value={subscriptionForm.expiry_date} onChange={(e) => setSubscriptionForm((p) => ({ ...p, expiry_date: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
                  <div className="space-y-2"><Label className="text-slate-300">Max Connections</Label><Input type="number" value={subscriptionForm.max_connections} onChange={(e) => setSubscriptionForm((p) => ({ ...p, max_connections: Number(e.target.value) || 1 }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label className="text-slate-300">Notes</Label><Textarea value={subscriptionForm.notes} onChange={(e) => setSubscriptionForm((p) => ({ ...p, notes: e.target.value }))} className="min-h-24 rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleSaveSubscription} disabled={savingSubscription} className="rounded-2xl bg-[#1ec8a5] text-slate-950 hover:bg-[#34d9b6]"><Save className="ml-2 h-4 w-4" />{savingSubscription ? "جارٍ الحفظ..." : "حفظ الاشتراك"}</Button>
                  <Button type="button" variant="outline" onClick={() => setSubscriptionForm(initialSubscriptionForm)} className="rounded-2xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">إلغاء</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
              <CardHeader><CardTitle className="text-lg text-white">تحديث حالة المستخدم والاتصالات</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-right">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2"><Label className="text-slate-300">المستخدم</Label><select value={userForm.user_id} onChange={(e) => setUserForm((p) => ({ ...p, user_id: e.target.value }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="">اختر مستخدمًا</option>{data.users.map((user) => <option key={user.id} value={user.id}>{user.username}</option>)}</select></div>
                  <div className="space-y-2"><Label className="text-slate-300">الحالة</Label><select value={userForm.status} onChange={(e) => setUserForm((p) => ({ ...p, status: e.target.value }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="Active">Active</option><option value="Expired">Expired</option><option value="Blocked">Blocked</option></select></div>
                  <div className="space-y-2"><Label className="text-slate-300">Expiry Date</Label><Input type="date" value={userForm.expiry_date} onChange={(e) => setUserForm((p) => ({ ...p, expiry_date: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
                  <div className="space-y-2"><Label className="text-slate-300">Max Connections</Label><Input type="number" value={userForm.max_connections} onChange={(e) => setUserForm((p) => ({ ...p, max_connections: Number(e.target.value) || 1 }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label className="text-slate-300">Notes</Label><Textarea value={userForm.notes} onChange={(e) => setUserForm((p) => ({ ...p, notes: e.target.value }))} className="min-h-24 rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleSaveUser} disabled={savingUser} className="rounded-2xl bg-[#6D4CFF] text-white hover:bg-[#7B5DFF]"><Save className="ml-2 h-4 w-4" />{savingUser ? "جارٍ الحفظ..." : "تحديث المستخدم"}</Button>
                  <Button type="button" variant="outline" onClick={() => setUserForm(initialUserForm)} className="rounded-2xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">إلغاء</Button>
                </div>
              </CardContent>
            </Card>
          </section>

          <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
            <CardHeader>
              <CardTitle className="text-lg text-white">المستخدمون والروابط والاشتراكات</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-right text-slate-400">المستخدم</TableHead>
                    <TableHead className="text-right text-slate-400">الحالة</TableHead>
                    <TableHead className="text-right text-slate-400">الباقة</TableHead>
                    <TableHead className="text-right text-slate-400">الأجهزة</TableHead>
                    <TableHead className="text-right text-slate-400">الرابط</TableHead>
                    <TableHead className="text-right text-slate-400">آخر توليد</TableHead>
                    <TableHead className="text-right text-slate-400">العناصر</TableHead>
                    <TableHead className="text-right text-slate-400">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((user) => (
                    <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-right text-white"><div><p className="font-medium">{user.username}</p><p className="text-xs text-slate-500">ينتهي في {user.subscription_expiry_date || user.expiry_date}</p></div></TableCell>
                      <TableCell className="text-right"><Badge className={`rounded-full border ${statusStyles[user.subscription_status] ?? statusStyles[user.status] ?? statusStyles.Active}`}>{user.subscription_status}</Badge></TableCell>
                      <TableCell className="text-right text-slate-300">{user.package_name || "غير مربوط"}</TableCell>
                      <TableCell className="text-right text-slate-300">{user.device_count}</TableCell>
                      <TableCell className="text-right text-slate-300">{user.playlist_url ? <a href={user.playlist_url} target="_blank" rel="noreferrer" className="block max-w-[220px] truncate text-[#a690ff] hover:text-white" dir="ltr">{user.playlist_url}</a> : <span className="text-slate-500">غير مولد</span>}</TableCell>
                      <TableCell className="text-right text-slate-300">{user.playlist_generated_at ? new Date(user.playlist_generated_at).toLocaleString() : "—"}</TableCell>
                      <TableCell className="text-right text-slate-300">{user.playlist_channel_count ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSubscriptionForm({
                            user_id: user.id,
                            package_id: user.package_id ?? undefined,
                            status: user.subscription_status,
                            expiry_date: toDateInput(user.subscription_expiry_date || user.expiry_date),
                            max_connections: user.max_connections,
                            notes: user.subscription_notes ?? "",
                          })} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">Edit Sub</Button>
                          <Button size="sm" variant="outline" onClick={() => setUserForm({
                            user_id: user.id,
                            status: user.status,
                            expiry_date: toDateInput(user.expiry_date),
                            max_connections: user.max_connections,
                            notes: user.notes ?? "",
                          })} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">Edit User</Button>
                          <Button size="sm" onClick={() => handleGeneratePlaylist(user.username)} disabled={generatingUser === user.username} className="rounded-xl bg-[#1ec8a5] text-slate-950 hover:bg-[#34d9b6]">{generatingUser === user.username ? "جارٍ التوليد..." : "Generate IBO M3U"}</Button>
                          {user.playlist_url ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => copyToClipboard(user.playlist_url!)} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">Copy</Button>
                              <Button size="sm" variant="outline" asChild className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"><a href={user.playlist_url} target="_blank" rel="noreferrer">Open</a></Button>
                              <Button size="sm" variant="outline" onClick={() => downloadPlaylist(user.playlist_url!, user.username)} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">Download</Button>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {section === "packages" ? (
        <div className="space-y-6">
          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
              <CardHeader><CardTitle className="text-lg text-white">{packageForm.id ? "تعديل باقة IBO" : "إضافة باقة IBO"}</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-right">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2"><Label className="text-slate-300">اسم الباقة</Label><Input value={packageForm.name} onChange={(e) => setPackageForm((p) => ({ ...p, name: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
                  <div className="space-y-2"><Label className="text-slate-300">المدة بالأيام</Label><Input type="number" value={packageForm.duration_days} onChange={(e) => setPackageForm((p) => ({ ...p, duration_days: Number(e.target.value) || 30 }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
                  <div className="space-y-2"><Label className="text-slate-300">Max Connections</Label><Input type="number" value={packageForm.max_connections} onChange={(e) => setPackageForm((p) => ({ ...p, max_connections: Number(e.target.value) || 1 }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
                  <div className="space-y-2"><Label className="text-slate-300">الحالة</Label><select value={packageForm.status} onChange={(e) => setPackageForm((p) => ({ ...p, status: e.target.value }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="Active">Active</option><option value="Disabled">Disabled</option></select></div>
                  <div className="space-y-2 sm:col-span-2"><Label className="text-slate-300">الوصف</Label><Textarea value={packageForm.description} onChange={(e) => setPackageForm((p) => ({ ...p, description: e.target.value }))} className="min-h-20 rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label className="text-slate-300">Notes</Label><Textarea value={packageForm.notes} onChange={(e) => setPackageForm((p) => ({ ...p, notes: e.target.value }))} className="min-h-20 rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleSavePackage} disabled={savingPackage} className="rounded-2xl bg-[#6D4CFF] text-white hover:bg-[#7B5DFF]"><Save className="ml-2 h-4 w-4" />{savingPackage ? "جارٍ الحفظ..." : packageForm.id ? "حفظ الباقة" : "إضافة الباقة"}</Button>
                  <Button type="button" variant="outline" onClick={() => setPackageForm(initialPackageForm)} className="rounded-2xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">إلغاء</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
              <CardHeader><CardTitle className="text-lg text-white">ربط المحتوى بالباقة</CardTitle></CardHeader>
              <CardContent className="grid gap-6 text-right xl:grid-cols-3">
                <div className="space-y-3">
                  <Label className="text-slate-300">Live TV</Label>
                  <div className="max-h-72 space-y-2 overflow-auto rounded-3xl border border-white/10 bg-white/5 p-4">
                    {data.content.live.map((item) => (
                      <label key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#101a39] px-3 py-2 text-sm text-white">
                        <input type="checkbox" checked={packageForm.live_stream_ids.includes(item.id)} onChange={() => setPackageForm((p) => ({ ...p, live_stream_ids: toggleSelection(p.live_stream_ids, item.id) }))} />
                        <span>{item.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-slate-300">Movies</Label>
                  <div className="max-h-72 space-y-2 overflow-auto rounded-3xl border border-white/10 bg-white/5 p-4">
                    {data.content.vod.map((item) => (
                      <label key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#101a39] px-3 py-2 text-sm text-white">
                        <input type="checkbox" checked={packageForm.vod_stream_ids.includes(item.id)} onChange={() => setPackageForm((p) => ({ ...p, vod_stream_ids: toggleSelection(p.vod_stream_ids, item.id) }))} />
                        <span>{item.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-slate-300">Series</Label>
                  <div className="max-h-72 space-y-2 overflow-auto rounded-3xl border border-white/10 bg-white/5 p-4">
                    {data.content.series.map((item) => (
                      <label key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#101a39] px-3 py-2 text-sm text-white">
                        <input type="checkbox" checked={packageForm.series_ids.includes(item.id)} onChange={() => setPackageForm((p) => ({ ...p, series_ids: toggleSelection(p.series_ids, item.id) }))} />
                        <span>{item.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
            <CardHeader><CardTitle className="text-lg text-white">الباقات الحالية</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-right text-slate-400">الباقة</TableHead>
                    <TableHead className="text-right text-slate-400">المدة</TableHead>
                    <TableHead className="text-right text-slate-400">الاتصالات</TableHead>
                    <TableHead className="text-right text-slate-400">Users</TableHead>
                    <TableHead className="text-right text-slate-400">Devices</TableHead>
                    <TableHead className="text-right text-slate-400">الحالة</TableHead>
                    <TableHead className="text-right text-slate-400">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.packages.map((pkg) => (
                    <TableRow key={pkg.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-right text-white"><div><p className="font-medium">{pkg.name}</p><p className="text-xs text-slate-500">{pkg.description || "بدون وصف"}</p></div></TableCell>
                      <TableCell className="text-right text-slate-300">{pkg.duration_days} يوم</TableCell>
                      <TableCell className="text-right text-slate-300">{pkg.max_connections}</TableCell>
                      <TableCell className="text-right text-slate-300">{pkg.user_count}</TableCell>
                      <TableCell className="text-right text-slate-300">{pkg.device_count}</TableCell>
                      <TableCell className="text-right"><Badge className={`rounded-full border ${statusStyles[pkg.status] ?? statusStyles.Active}`}>{pkg.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setPackageForm({
                            id: pkg.id,
                            name: pkg.name,
                            description: pkg.description ?? "",
                            duration_days: pkg.duration_days,
                            max_connections: pkg.max_connections,
                            status: pkg.status,
                            notes: pkg.notes ?? "",
                            live_stream_ids: pkg.live_stream_ids ?? [],
                            vod_stream_ids: pkg.vod_stream_ids ?? [],
                            series_ids: pkg.series_ids ?? [],
                          })} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeletePackage(pkg.id)} className="rounded-xl border-rose-500/20 bg-transparent text-rose-300 hover:bg-rose-500/10 hover:text-rose-200">Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {section === "settings" ? (
        <div className="space-y-6">
          <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
            <CardHeader>
              <CardTitle className="text-lg text-white">إعدادات نظام IBO</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-right sm:grid-cols-2">
              <div className="space-y-2"><Label className="text-slate-300">App Name</Label><Input value={settingsForm.app_name} onChange={(e) => setSettingsForm((p) => ({ ...p, app_name: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Logo URL</Label><Input value={settingsForm.logo_url} onChange={(e) => setSettingsForm((p) => ({ ...p, logo_url: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">API Base URL</Label><Input value={settingsForm.api_base_url} onChange={(e) => setSettingsForm((p) => ({ ...p, api_base_url: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Default EPG URL</Label><Input value={settingsForm.default_epg_url} onChange={(e) => setSettingsForm((p) => ({ ...p, default_epg_url: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Theme</Label><select value={settingsForm.theme_mode} onChange={(e) => setSettingsForm((p) => ({ ...p, theme_mode: e.target.value }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></div>
              <div className="space-y-2"><Label className="text-slate-300">Primary Color</Label><Input value={settingsForm.primary_color} onChange={(e) => setSettingsForm((p) => ({ ...p, primary_color: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Secondary Color</Label><Input value={settingsForm.secondary_color} onChange={(e) => setSettingsForm((p) => ({ ...p, secondary_color: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Maintenance Mode</Label><select value={settingsForm.maintenance_mode ? "true" : "false"} onChange={(e) => setSettingsForm((p) => ({ ...p, maintenance_mode: e.target.value === "true" }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="false">Off</option><option value="true">On</option></select></div>
              <div className="space-y-2"><Label className="text-slate-300">Notifications</Label><select value={settingsForm.notifications_enabled ? "true" : "false"} onChange={(e) => setSettingsForm((p) => ({ ...p, notifications_enabled: e.target.value === "true" }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="true">Enabled</option><option value="false">Disabled</option></select></div>
              <div className="sm:col-span-2 flex gap-3">
                <Button onClick={handleSaveSettings} disabled={savingSettings} className="rounded-2xl bg-[#6D4CFF] text-white hover:bg-[#7B5DFF]"><Save className="ml-2 h-4 w-4" />{savingSettings ? "جارٍ الحفظ..." : "حفظ الإعدادات"}</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
            <CardHeader><CardTitle className="text-lg text-white">آخر سجلات النظام</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.logs.map((log) => (
                <div key={log.id} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-right">
                  <div className="flex items-center justify-between gap-3">
                    <Badge className="rounded-full border border-white/10 bg-white/10 text-slate-200">{log.action}</Badge>
                    <p className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                  <p className="mt-3 text-white">{log.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </section>
  );
}

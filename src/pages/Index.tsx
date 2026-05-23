import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Layers3,
  Link2,
  LogOut,
  Radio,
  ShieldCheck,
  Tv2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { AddStreamDialog } from "@/components/panel/add-stream-dialog";
import { AddUserDialog } from "@/components/panel/add-user-dialog";
import { SettingsCard } from "@/components/panel/settings-card";
import { StatsCard } from "@/components/panel/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminCredentials,
  createCategory,
  createIptvUser,
  createStream,
  DashboardData,
  getDashboard,
  loginAdmin,
  updateServerBaseUrl,
} from "@/lib/panel-api";

const STORAGE_KEY = "omar-premium-admin-auth";

const statusStyles: Record<string, string> = {
  Active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  Expired: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  Banned: "bg-rose-500/15 text-rose-300 border-rose-500/20",
  Disabled: "bg-slate-500/15 text-slate-300 border-slate-500/20",
};

const Index = () => {
  const [credentials, setCredentials] = useState<AdminCredentials | null>(null);
  const [loginForm, setLoginForm] = useState<AdminCredentials>({ username: "admin", password: "admin12345" });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);

  const loadDashboard = useCallback(async (currentCredentials: AdminCredentials) => {
    setLoading(true);
    try {
      const dashboard = await getDashboard(currentCredentials);
      setData(dashboard);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load dashboard";
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (!storedValue) {
      return;
    }

    try {
      const parsedCredentials = JSON.parse(storedValue) as AdminCredentials;
      setCredentials(parsedCredentials);
      loadDashboard(parsedCredentials).catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setCredentials(null);
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [loadDashboard]);

  const handleLogin = async () => {
    setLoggingIn(true);
    try {
      await loginAdmin(loginForm);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loginForm));
      setCredentials(loginForm);
      await loadDashboard(loginForm);
      toast.success("تم تسجيل الدخول بنجاح");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل تسجيل الدخول");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCredentials(null);
    setData(null);
    toast.success("تم تسجيل الخروج");
  };

  const handleCreateUser = async (payload: {
    username: string;
    password: string;
    status: string;
    expiry_date: string;
    max_connections: number;
    notes: string;
  }) => {
    if (!credentials) return;
    await createIptvUser(credentials, payload);
    toast.success("تم إنشاء المستخدم");
    await loadDashboard(credentials);
  };

  const handleCreateCategory = async (payload: {
    name: string;
    sort_order: number;
    image_url?: string;
  }) => {
    if (!credentials) return;
    await createCategory(credentials, payload);
    toast.success("تم إنشاء التصنيف");
    await loadDashboard(credentials);
  };

  const handleCreateStream = async (payload: {
    name: string;
    stream_url: string;
    logo_url?: string;
    category_id: number;
    status: string;
    sort_order: number;
  }) => {
    if (!credentials) return;
    await createStream(credentials, payload);
    toast.success("تم حفظ القناة");
    await loadDashboard(credentials);
  };

  const handleSaveBaseUrl = async (baseUrl: string) => {
    if (!credentials) return;
    const response = await updateServerBaseUrl(credentials, baseUrl);
    setData((current) => (current ? { ...current, server: response.server } : current));
    toast.success("تم حفظ Server Base URL");
    await loadDashboard(credentials);
  };

  const apiRows = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Xtream Player API", value: data.server.playerApi },
      { label: "M3U URL", value: data.server.m3u },
      { label: "XMLTV URL", value: data.server.xmltv },
      { label: "Live Test URL", value: data.server.live },
    ];
  }, [data]);

  if (!credentials || !data) {
    return (
      <main
        dir="rtl"
        className="relative min-h-screen overflow-hidden bg-[#070b1a] px-4 py-8 text-white sm:px-6 lg:px-10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(109,76,255,0.22),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(30,200,165,0.15),transparent_18%)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="hidden rounded-[2rem] border-white/10 bg-[#0b1228]/80 p-8 shadow-[0_30px_80px_rgba(5,10,30,0.45)] backdrop-blur lg:block">
            <div className="space-y-8 text-right">
              <div className="flex items-center justify-end gap-4">
                <div className="rounded-3xl border border-[#6D4CFF]/30 bg-[#6D4CFF]/20 p-4 shadow-[0_0_40px_rgba(109,76,255,0.18)]">
                  <Tv2 className="h-10 w-10 text-[#a690ff]" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#8f7dff]">OMAR</p>
                  <h1 className="text-3xl font-semibold text-white">PREMIUM PANEL</h1>
                </div>
              </div>

              <div className="space-y-4">
                <Badge className="rounded-full border border-[#6D4CFF]/20 bg-[#6D4CFF]/10 px-4 py-1 text-[#d2c9ff]">
                  Xtream-compatible IPTV Panel
                </Badge>
                <h2 className="text-4xl font-semibold leading-tight text-white">
                  نسخة أولية عملية لاختبار IBO Player قبل التوسع
                </h2>
                <p className="max-w-xl text-lg leading-8 text-slate-300">
                  هذه المرحلة تركز على Login إداري بسيط، مستخدم IPTV واحد أو أكثر، قناة Live واحدة أو أكثر،
                  وروابط Xtream / M3U / XMLTV حقيقية مبنية على Supabase Edge Functions.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-400">بيانات الاختبار الجاهزة</p>
                  <p className="mt-3 text-xl font-medium text-white">testuser / testpass</p>
                  <p className="mt-2 text-sm text-slate-500">مع قناة Live تجريبية مضافة تلقائيًا.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-400">دخول الأدمن الافتراضي</p>
                  <p className="mt-3 text-xl font-medium text-white">admin / admin12345</p>
                  <p className="mt-2 text-sm text-slate-500">اضبط Server Base URL بعد النشر العام قبل اختبار IBO Player.</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]/90 shadow-[0_30px_80px_rgba(5,10,30,0.5)] backdrop-blur">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="space-y-3 text-right">
                <div className="flex items-center justify-end gap-3 lg:hidden">
                  <div className="rounded-2xl border border-[#6D4CFF]/30 bg-[#6D4CFF]/20 p-3">
                    <Tv2 className="h-7 w-7 text-[#a690ff]" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#8f7dff]">OMAR</p>
                    <p className="text-lg font-semibold text-white">PREMIUM PANEL</p>
                  </div>
                </div>
                <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-emerald-300">
                  Phase 1 • Admin Login + Live API
                </Badge>
                <h3 className="text-2xl font-semibold text-white">تسجيل الدخول إلى لوحة الإدارة</h3>
                <p className="text-sm leading-7 text-slate-400">
                  بعد الدخول اضبط Server Base URL العام أولًا، ثم استخدم روابط Xtream و M3U على IBO Player.
                </p>
              </div>

              <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-right text-sm leading-7 text-amber-100">
                localhost links are only for development and will not work in IPTV apps.
              </div>

              <div className="space-y-4">
                <div className="space-y-2 text-right">
                  <Label className="text-slate-300">Admin Username</Label>
                  <Input
                    value={loginForm.username}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))}
                    className="h-12 rounded-2xl border-white/10 bg-[#101a39] text-right text-white"
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="text-slate-300">Password</Label>
                  <Input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                    className="h-12 rounded-2xl border-white/10 bg-[#101a39] text-right text-white"
                  />
                </div>
                <Button
                  onClick={handleLogin}
                  disabled={loggingIn}
                  className="h-12 w-full rounded-2xl bg-[#6D4CFF] text-base text-white hover:bg-[#7B5DFF]"
                >
                  {loggingIn ? "جارٍ التحقق..." : "دخول لوحة الإدارة"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b1a] px-4 py-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="overflow-hidden rounded-[2rem] border-white/10 bg-[#0b1228] shadow-[0_30px_80px_rgba(5,10,30,0.45)]">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4 text-right">
                <Badge className="rounded-full border border-[#6D4CFF]/25 bg-[#6D4CFF]/10 px-4 py-1 text-[#d2c9ff]">
                  OMAR PREMIUM PANEL
                </Badge>
                <div>
                  <h1 className="text-3xl font-semibold text-white sm:text-4xl">لوحة IPTV التجريبية</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
                    قبل استخدام IBO Player تأكد من حفظ دومين عام في Settings حتى تُبنى جميع روابط Xtream و M3U و XMLTV على رابط قابل للوصول من الخارج.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <AddUserDialog onSubmit={handleCreateUser} disabled={loading} />
                <AddStreamDialog
                  categories={data.categories.map((category) => ({ id: category.id, name: category.name }))}
                  onCreateCategory={handleCreateCategory}
                  onCreateStream={handleCreateStream}
                  disabled={loading}
                />
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="rounded-2xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  تسجيل الخروج
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="إجمالي المستخدمين"
            value={data.counts.users}
            description="عدد حسابات IPTV المضافة"
            icon={UserRound}
            iconClassName="bg-[#6D4CFF]"
          />
          <StatsCard
            title="القنوات المباشرة"
            value={data.counts.streams}
            description="عدد قنوات Live الفعّالة"
            icon={Tv2}
            iconClassName="bg-[#1ec8a5]"
          />
          <StatsCard
            title="التصنيفات"
            value={data.counts.categories}
            description="تصنيفات Live الحالية"
            icon={Layers3}
            iconClassName="bg-[#f59e0b]"
          />
          <StatsCard
            title="حالة الربط"
            value={data.server.isConfigured ? "Public URL" : "Needs Setup"}
            description={data.server.isConfigured ? "Ready for external IPTV apps" : "Save Server Base URL first"}
            icon={ShieldCheck}
            iconClassName={data.server.isConfigured ? "bg-[#2563eb]" : "bg-[#b45309]"}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg text-white">روابط API الجاهزة للاختبار</CardTitle>
              <Link2 className="h-5 w-5 text-[#8f7dff]" />
            </CardHeader>
            <CardContent className="space-y-4">
              {data.server.warning ? (
                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-right text-sm leading-7 text-amber-100">
                  {data.server.warning}
                </div>
              ) : null}

              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-right">
                <p className="text-sm text-emerald-300">بيانات IBO Player للاختبار</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-400">Server URL</p>
                    <p className="mt-1 break-all text-sm text-white" dir="ltr">{data.server.baseUrl}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Username</p>
                    <p className="mt-1 text-sm text-white">testuser</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Password</p>
                    <p className="mt-1 text-sm text-white">testpass</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {apiRows.map((row) => (
                  <div
                    key={row.label}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4 text-right"
                  >
                    <p className="text-sm text-slate-400">{row.label}</p>
                    <p className="mt-2 break-all text-sm leading-7 text-white" dir="ltr">{row.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <SettingsCard server={data.server} onSave={handleSaveBaseUrl} disabled={loading} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg text-white">آخر المستخدمين المضافين</CardTitle>
              <Activity className="h-5 w-5 text-[#1ec8a5]" />
            </CardHeader>
            <CardContent className="space-y-3">
              {data.latestUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-4"
                >
                  <Badge className={`rounded-full border ${statusStyles[user.status] ?? statusStyles.Active}`}>
                    {user.status}
                  </Badge>
                  <div className="text-right">
                    <p className="font-medium text-white">{user.username}</p>
                    <p className="text-sm text-slate-400">ينتهي في {user.expiry_date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg text-white">حالة النشر</CardTitle>
              <ShieldCheck className="h-5 w-5 text-[#2563eb]" />
            </CardHeader>
            <CardContent className="space-y-3 text-right">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Current Base URL</p>
                <p className="mt-2 break-all text-white" dir="ltr">{data.server.baseUrl}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
                اختبار IBO Player يجب أن يتم بعد النشر على دومين عام. بعد الحفظ ضع رابط Vercel أو أي دومين عام هنا، ثم استخدم نفس الرابط في Xtream و M3U.
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg text-white">مستخدمو IPTV</CardTitle>
              <UserRound className="h-5 w-5 text-[#8f7dff]" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-right text-slate-400">المستخدم</TableHead>
                    <TableHead className="text-right text-slate-400">الحالة</TableHead>
                    <TableHead className="text-right text-slate-400">الانتهاء</TableHead>
                    <TableHead className="text-right text-slate-400">الاتصالات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((user) => (
                    <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-right text-white">
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-xs text-slate-500">{user.notes || "بدون ملاحظات"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={`rounded-full border ${statusStyles[user.status] ?? statusStyles.Active}`}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-slate-300">{user.expiry_date}</TableCell>
                      <TableCell className="text-right text-slate-300">{user.max_connections}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg text-white">قنوات Live الحالية</CardTitle>
              <Radio className="h-5 w-5 text-[#1ec8a5]" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-right text-slate-400">stream_id</TableHead>
                    <TableHead className="text-right text-slate-400">القناة</TableHead>
                    <TableHead className="text-right text-slate-400">التصنيف</TableHead>
                    <TableHead className="text-right text-slate-400">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.streams.map((stream) => (
                    <TableRow key={stream.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-right text-slate-300">{stream.id}</TableCell>
                      <TableCell className="text-right text-white">
                        <div>
                          <p className="font-medium">{stream.name}</p>
                          <p className="max-w-xs truncate text-xs text-slate-500">{stream.stream_url}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-slate-300">{stream.category_name}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={`rounded-full border ${statusStyles[stream.status] ?? statusStyles.Disabled}`}>
                          {stream.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
};

export default Index;

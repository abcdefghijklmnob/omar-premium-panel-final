import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clapperboard,
  Film,
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
import { IboAdminPanel } from "@/components/panel/ibo-admin-panel";
import { IboPlaylistCard } from "@/components/panel/ibo-playlist-card";
import { MovieManager } from "@/components/panel/movie-manager";
import { SeriesManager } from "@/components/panel/series-manager";
import { SettingsCard } from "@/components/panel/settings-card";
import { StatsCard } from "@/components/panel/stats-card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AdminCredentials,
  createCategory,
  createIptvUser,
  createStream,
  DashboardData,
  deleteSeries,
  deleteSeriesCategory,
  deleteSeriesEpisode,
  deleteSeriesSeason,
  deleteVodCategory,
  deleteVodStream,
  generateIboPlaylist,
  getDashboard,
  getIboPlaylists,
  IboPlaylistRecord,
  loginAdmin,
  saveSeries,
  saveSeriesCategory,
  saveSeriesEpisode,
  saveSeriesSeason,
  saveVodCategory,
  saveVodStream,
  updateServerBaseUrl,
} from "@/lib/panel-api";

const STORAGE_KEY = "omar-premium-admin-auth";

type AdminView = "dashboard" | "movies" | "series" | "ibo";

const statusStyles: Record<string, string> = {
  Active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  Expired: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  Banned: "bg-rose-500/15 text-rose-300 border-rose-500/20",
  Disabled: "bg-slate-500/15 text-slate-300 border-slate-500/20",
};

const navButtonClass = (active: boolean) =>
  `rounded-2xl border px-4 py-2 text-sm transition ${
    active
      ? "border-[#6D4CFF]/40 bg-[#6D4CFF]/20 text-white"
      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
  }`;

const Index = () => {
  const [credentials, setCredentials] = useState<AdminCredentials | null>(null);
  const [loginForm, setLoginForm] = useState<AdminCredentials>({ username: "admin", password: "admin12345" });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [iboPlaylists, setIboPlaylists] = useState<IboPlaylistRecord[]>([]);
  const [generatingUsername, setGeneratingUsername] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<AdminView>("dashboard");

  const loadDashboard = useCallback(async (currentCredentials: AdminCredentials) => {
    setLoading(true);
    try {
      const [dashboard, playlists] = await Promise.all([
        getDashboard(currentCredentials),
        getIboPlaylists(currentCredentials),
      ]);
      setData(dashboard);
      setIboPlaylists(playlists);
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
    if (!storedValue) return;

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

  const refreshAfter = async (message: string, action: () => Promise<unknown>) => {
    if (!credentials) return;
    await action();
    toast.success(message);
    await loadDashboard(credentials);
  };

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
    setIboPlaylists([]);
    setActiveView("dashboard");
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
    await refreshAfter("تم إنشاء المستخدم", async () => {
      if (!credentials) return;
      await createIptvUser(credentials, payload);
    });
  };

  const handleCreateCategory = async (payload: { name: string; sort_order: number; image_url?: string }) => {
    await refreshAfter("تم إنشاء التصنيف", async () => {
      if (!credentials) return;
      await createCategory(credentials, payload);
    });
  };

  const handleCreateStream = async (payload: {
    name: string;
    stream_url: string;
    logo_url?: string;
    category_id: number;
    status: string;
    sort_order: number;
  }) => {
    await refreshAfter("تم حفظ القناة", async () => {
      if (!credentials) return;
      await createStream(credentials, payload);
    });
  };

  const handleSaveBaseUrl = async (baseUrl: string) => {
    if (!credentials) return;
    const response = await updateServerBaseUrl(credentials, baseUrl);
    setData((current) => (current ? { ...current, server: response.server } : current));
    toast.success("تم حفظ Server Base URL");
    await loadDashboard(credentials);
  };

  const iboStaticUrl = useMemo(() => {
    if (!data) return "";
    return `${data.server.baseUrl.replace(/\/$/, "")}/ibo/testuser.m3u`;
  }, [data]);

  const apiRows = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Xtream Player API", value: data.server.playerApi },
      { label: "Static IBO M3U", value: iboStaticUrl },
      { label: "M3U URL", value: data.server.m3u },
      { label: "XMLTV URL", value: data.server.xmltv },
      { label: "Live Test URL", value: data.server.live },
    ];
  }, [data, iboStaticUrl]);

  const iboPlaylistsByUsername = useMemo(
    () => Object.fromEntries(iboPlaylists.map((playlist) => [playlist.username, playlist])),
    [iboPlaylists],
  );

  const handleGenerateUserPlaylist = async (username: string) => {
    if (!credentials) return;

    setGeneratingUsername(username);
    try {
      await generateIboPlaylist(credentials, username);
      toast.success(`تم توليد ملف IBO للمستخدم ${username}`);
      await loadDashboard(credentials);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر توليد ملف IBO");
    } finally {
      setGeneratingUsername(null);
    }
  };

  const handleCopyPlaylistUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ رابط الملف");
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  };

  const handleDownloadPlaylist = async (url: string, username: string) => {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to download playlist");
      }

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

  if (!credentials || !data) {
    return (
      <main dir="rtl" className="relative min-h-screen overflow-hidden bg-[#070b1a] px-4 py-8 text-white sm:px-6 lg:px-10">
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
                <Badge className="rounded-full border border-[#6D4CFF]/20 bg-[#6D4CFF]/10 px-4 py-1 text-[#d2c9ff]">Xtream-compatible IPTV Panel</Badge>
                <h2 className="text-4xl font-semibold leading-tight text-white">إصلاح /get.php أولًا ثم التوسع إلى Movies و Series</h2>
                <p className="max-w-xl text-lg leading-8 text-slate-300">
                  النسخة الحالية أصبحت تتضمن إدارة Live وقاعدة فعلية للأفلام والمسلسلات داخل Supabase، مع استمرار تثبيت مسارات Xtream و M3U للاختبار.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-400">بيانات الاختبار الجاهزة</p>
                  <p className="mt-3 text-xl font-medium text-white">testuser / testpass</p>
                  <p className="mt-2 text-sm text-slate-500">رابط /get.php المؤقت يجب أن يرجع #EXTM3U بعد وصول آخر deployment.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-400">دخول الأدمن الافتراضي</p>
                  <p className="mt-3 text-xl font-medium text-white">admin / admin12345</p>
                  <p className="mt-2 text-sm text-slate-500">اضبط Server Base URL بعد النشر العام قبل اختبار التطبيقات الخارجية.</p>
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
                <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-emerald-300">Admin Login + Live + Movies + Series</Badge>
                <h3 className="text-2xl font-semibold text-white">تسجيل الدخول إلى لوحة الإدارة</h3>
                <p className="text-sm leading-7 text-slate-400">بعد الدخول يمكنك إدارة المستخدمين والقنوات والأفلام والمسلسلات من نفس اللوحة.</p>
              </div>

              <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-right text-sm leading-7 text-amber-100">
                localhost links are only for development and will not work in IPTV apps. استخدم رابط النشر الحقيقي للتطبيق مثل Vercel، ولا تستخدم Supabase كـ Server URL داخل IBO Player.
              </div>

              <div className="space-y-4">
                <div className="space-y-2 text-right">
                  <Label className="text-slate-300">Admin Username</Label>
                  <Input value={loginForm.username} onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))} className="h-12 rounded-2xl border-white/10 bg-[#101a39] text-right text-white" />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="text-slate-300">Password</Label>
                  <Input type="password" value={loginForm.password} onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))} className="h-12 rounded-2xl border-white/10 bg-[#101a39] text-right text-white" />
                </div>
                <Button onClick={handleLogin} disabled={loggingIn} className="h-12 w-full rounded-2xl bg-[#6D4CFF] text-base text-white hover:bg-[#7B5DFF]">
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
                <Badge className="rounded-full border border-[#6D4CFF]/25 bg-[#6D4CFF]/10 px-4 py-1 text-[#d2c9ff]">OMAR PREMIUM PANEL</Badge>
                <div>
                  <h1 className="text-3xl font-semibold text-white sm:text-4xl">لوحة IPTV + IBO + Movies + Series</h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
                    تم تجهيز إدارة Live و Movies و Series داخل نفس لوحة الأدمن مع حفظ البيانات في Supabase وتجهيز أكشنات Xtream الأساسية.
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={() => setActiveView("dashboard")} className={navButtonClass(activeView === "dashboard")}>Dashboard</button>
                  <button type="button" onClick={() => setActiveView("ibo")} className={navButtonClass(activeView === "ibo")}>IBO Panel</button>
                  <button type="button" onClick={() => setActiveView("movies")} className={navButtonClass(activeView === "movies")}>Movies</button>
                  <button type="button" onClick={() => setActiveView("series")} className={navButtonClass(activeView === "series")}>Series</button>

                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <AddUserDialog onSubmit={handleCreateUser} disabled={loading} />
                <AddStreamDialog categories={data.categories.map((category) => ({ id: category.id, name: category.name }))} onCreateCategory={handleCreateCategory} onCreateStream={handleCreateStream} disabled={loading} />
                <Button variant="outline" onClick={handleLogout} className="rounded-2xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"><LogOut className="ml-2 h-4 w-4" />تسجيل الخروج</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatsCard title="المستخدمون" value={data.counts.users} description="حسابات IPTV" icon={UserRound} iconClassName="bg-[#6D4CFF]" />
          <StatsCard title="Live" value={data.counts.streams} description="قنوات مباشرة" icon={Tv2} iconClassName="bg-[#1ec8a5]" />
          <StatsCard title="Live Categories" value={data.counts.categories} description="تصنيفات البث" icon={Layers3} iconClassName="bg-[#f59e0b]" />
          <StatsCard title="Movies" value={data.counts.movies} description="أفلام VOD" icon={Film} iconClassName="bg-[#ec4899]" />
          <StatsCard title="Series" value={data.counts.series} description="مسلسلات" icon={Clapperboard} iconClassName="bg-[#38bdf8]" />
          <StatsCard title="Episodes" value={data.counts.episodes} description="حلقات محفوظة" icon={Radio} iconClassName="bg-[#22c55e]" />
        </section>

        {activeView === "dashboard" ? (
          <>
            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg text-white">روابط API الجاهزة للاختبار</CardTitle>
                  <Link2 className="h-5 w-5 text-[#8f7dff]" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.server.warning ? (
                    <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-right text-sm leading-7 text-amber-100">{data.server.warning}</div>
                  ) : null}

                  <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-right">
                    <p className="text-sm text-emerald-300">بيانات IBO Player للاختبار</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-slate-400">Server URL</p>
                        <p className="mt-1 break-all text-sm text-white" dir="ltr">{data.server.baseUrl}</p>
                        <p className="mt-1 text-xs text-slate-500">هذا يجب أن يكون رابط Vercel أو دومينك العام.</p>
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
                      <div key={row.label} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-right">
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
                    <div key={user.id} className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-4">
                      <Badge className={`rounded-full border ${statusStyles[user.status] ?? statusStyles.Active}`}>{user.status}</Badge>
                      <div className="text-right">
                        <p className="font-medium text-white">{user.username}</p>
                        <p className="text-sm text-slate-400">ينتهي في {user.expiry_date}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="space-y-6">
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
                    <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-7 text-emerald-100">
                      بما أن IBO Player قبل الملف الثابت <span dir="ltr">/ibo-test.m3u</span>، فالنسخة الحالية تعتمد رابطًا ثابتًا تحت <span dir="ltr">/ibo/testuser.m3u</span> بدل الاعتماد على <span dir="ltr">/get.php</span> في هذه المرحلة.
                    </div>
                  </CardContent>
                </Card>

                <IboPlaylistCard baseUrl={data.server.baseUrl} username="testuser" />
              </div>
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
                        <TableHead className="text-right text-slate-400">IBO M3U</TableHead>

                        <TableHead className="text-right text-slate-400">آخر توليد</TableHead>
                        <TableHead className="text-right text-slate-400">القنوات</TableHead>
                        <TableHead className="text-right text-slate-400">إجراءات</TableHead>
                      </TableRow>

                    </TableHeader>
                    <TableBody>
                      {data.users.map((user) => {
                        const playlist = iboPlaylistsByUsername[user.username];

                        return (
                          <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                            <TableCell className="text-right text-white"><div><p className="font-medium">{user.username}</p><p className="text-xs text-slate-500">{user.notes || "بدون ملاحظات"}</p></div></TableCell>
                            <TableCell className="text-right"><Badge className={`rounded-full border ${statusStyles[user.status] ?? statusStyles.Active}`}>{user.status}</Badge></TableCell>
                            <TableCell className="text-right text-slate-300">{user.expiry_date}</TableCell>
                            <TableCell className="text-right text-slate-300">{user.max_connections}</TableCell>
                            <TableCell className="text-right text-slate-300">

                              {playlist ? (
                                <a href={playlist.public_url} target="_blank" rel="noreferrer" className="block max-w-[220px] truncate text-[#a690ff] hover:text-white" dir="ltr">
                                  {playlist.public_url}
                                </a>
                              ) : (
                                <span className="text-slate-500">غير مولد بعد</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-slate-300">{playlist ? new Date(playlist.generated_at).toLocaleString() : "—"}</TableCell>
                            <TableCell className="text-right text-slate-300">{playlist?.channel_count ?? 0}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleGenerateUserPlaylist(user.username)}
                                  disabled={loading || generatingUsername === user.username}
                                  className="rounded-xl bg-[#6D4CFF] text-white hover:bg-[#7B5DFF]"
                                >
                                  {generatingUsername === user.username ? "جارٍ التوليد..." : "Generate IBO M3U"}
                                </Button>
                                {playlist ? (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => handleCopyPlaylistUrl(playlist.public_url)} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">Copy</Button>
                                    <Button size="sm" variant="outline" asChild className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"><a href={playlist.public_url} target="_blank" rel="noreferrer">Open</a></Button>
                                    <Button size="sm" variant="outline" onClick={() => handleDownloadPlaylist(playlist.public_url, user.username)} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">Download</Button>
                                  </>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}

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
                          <TableCell className="text-right text-white"><div><p className="font-medium">{stream.name}</p><p className="max-w-xs truncate text-xs text-slate-500">{stream.stream_url}</p></div></TableCell>
                          <TableCell className="text-right text-slate-300">{stream.category_name}</TableCell>
                          <TableCell className="text-right"><Badge className={`rounded-full border ${statusStyles[stream.status] ?? statusStyles.Disabled}`}>{stream.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </section>
          </>
        ) : null}

        {activeView === "ibo" ? <IboAdminPanel credentials={credentials} /> : null}

        {activeView === "movies" ? (
          <MovieManager
            categories={data.vod_categories}
            movies={data.vod_streams}
            loading={loading}
            onSaveCategory={(payload) => refreshAfter(payload.id ? "تم تحديث تصنيف الفيلم" : "تمت إضافة تصنيف الفيلم", async () => {
              if (!credentials) return;
              await saveVodCategory(credentials, payload);
            })}
            onDeleteCategory={(id) => refreshAfter("تم حذف تصنيف الفيلم", async () => {
              if (!credentials) return;
              await deleteVodCategory(credentials, id);
            })}
            onSaveMovie={(payload) => refreshAfter(payload.id ? "تم تحديث الفيلم" : "تمت إضافة الفيلم", async () => {
              if (!credentials) return;
              await saveVodStream(credentials, payload);
            })}
            onDeleteMovie={(id) => refreshAfter("تم حذف الفيلم", async () => {
              if (!credentials) return;
              await deleteVodStream(credentials, id);
            })}
          />
        ) : null}

        {activeView === "series" ? (
          <SeriesManager
            categories={data.series_categories}
            series={data.series}
            seasons={data.series_seasons}
            episodes={data.series_episodes}
            loading={loading}
            onSaveCategory={(payload) => refreshAfter(payload.id ? "تم تحديث تصنيف المسلسل" : "تمت إضافة تصنيف المسلسل", async () => {
              if (!credentials) return;
              await saveSeriesCategory(credentials, payload);
            })}
            onDeleteCategory={(id) => refreshAfter("تم حذف تصنيف المسلسل", async () => {
              if (!credentials) return;
              await deleteSeriesCategory(credentials, id);
            })}
            onSaveSeries={(payload) => refreshAfter(payload.id ? "تم تحديث المسلسل" : "تمت إضافة المسلسل", async () => {
              if (!credentials) return;
              await saveSeries(credentials, payload);
            })}
            onDeleteSeries={(id) => refreshAfter("تم حذف المسلسل", async () => {
              if (!credentials) return;
              await deleteSeries(credentials, id);
            })}
            onSaveSeason={(payload) => refreshAfter(payload.id ? "تم تحديث الموسم" : "تمت إضافة الموسم", async () => {
              if (!credentials) return;
              await saveSeriesSeason(credentials, payload);
            })}
            onDeleteSeason={(id) => refreshAfter("تم حذف الموسم", async () => {
              if (!credentials) return;
              await deleteSeriesSeason(credentials, id);
            })}
            onSaveEpisode={(payload) => refreshAfter(payload.id ? "تم تحديث الحلقة" : "تمت إضافة الحلقة", async () => {
              if (!credentials) return;
              await saveSeriesEpisode(credentials, payload);
            })}
            onDeleteEpisode={(id) => refreshAfter("تم حذف الحلقة", async () => {
              if (!credentials) return;
              await deleteSeriesEpisode(credentials, id);
            })}
          />
        ) : null}
      </div>
    </main>
  );
};

export default Index;

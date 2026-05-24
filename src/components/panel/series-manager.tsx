import { useMemo, useState } from "react";
import { Clapperboard, Pencil, PlusCircle, Power, Trash2 } from "lucide-react";

import { SeriesCategory, SeriesEpisode, SeriesRecord, SeriesSeason } from "@/lib/panel-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type SeriesManagerProps = {
  categories: SeriesCategory[];
  series: SeriesRecord[];
  seasons: SeriesSeason[];
  episodes: SeriesEpisode[];
  loading?: boolean;
  onSaveCategory: (payload: { id?: number; name: string; sort_order: number; status: string }) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
  onSaveSeries: (payload: {
    id?: number;
    title: string;
    poster_url?: string;
    backdrop_url?: string;
    category_id?: number | null;
    description?: string;
    genre?: string;
    release_year?: number | null;
    rating?: string;
    sort_order: number;
    status: string;
  }) => Promise<void>;
  onDeleteSeries: (id: number) => Promise<void>;
  onSaveSeason: (payload: { id?: number; series_id: number; season_number: number; name?: string; sort_order: number }) => Promise<void>;
  onDeleteSeason: (id: number) => Promise<void>;
  onSaveEpisode: (payload: { id?: number; series_id: number; season_id: number; episode_title: string; episode_number: number; stream_url: string; duration?: string; poster_url?: string; status: string }) => Promise<void>;
  onDeleteEpisode: (id: number) => Promise<void>;
};

const initialCategory = { id: undefined as number | undefined, name: "", sort_order: 0, status: "Active" };
const initialSeries = { id: undefined as number | undefined, title: "", poster_url: "", backdrop_url: "", category_id: undefined as number | undefined, description: "", genre: "", release_year: undefined as number | undefined, rating: "", sort_order: 0, status: "Active" };
const initialSeason = { id: undefined as number | undefined, series_id: 0, season_number: 1, name: "", sort_order: 0 };
const initialEpisode = { id: undefined as number | undefined, series_id: 0, season_id: 0, episode_title: "", episode_number: 1, stream_url: "", duration: "", poster_url: "", status: "Active" };

export function SeriesManager({ categories, series, seasons, episodes, loading, onSaveCategory, onDeleteCategory, onSaveSeries, onDeleteSeries, onSaveSeason, onDeleteSeason, onSaveEpisode, onDeleteEpisode }: SeriesManagerProps) {
  const [categoryForm, setCategoryForm] = useState(initialCategory);
  const [seriesForm, setSeriesForm] = useState(initialSeries);
  const [seasonForm, setSeasonForm] = useState(initialSeason);
  const [episodeForm, setEpisodeForm] = useState(initialEpisode);
  const [activeSeriesId, setActiveSeriesId] = useState<number>(series[0]?.id ?? 0);

  const activeCategories = useMemo(() => categories.filter((item) => item.status === "Active"), [categories]);
  const visibleSeasons = useMemo(() => seasons.filter((item) => item.series_id === activeSeriesId), [seasons, activeSeriesId]);
  const visibleEpisodes = useMemo(() => episodes.filter((item) => item.series_id === activeSeriesId), [episodes, activeSeriesId]);

  const handleSeriesPick = (seriesId: number) => {
    setActiveSeriesId(seriesId);
    setSeasonForm((prev) => ({ ...prev, series_id: seriesId }));
    setEpisodeForm((prev) => ({ ...prev, series_id: seriesId }));
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg text-white"><span>{categoryForm.id ? "تعديل تصنيف مسلسل" : "إضافة تصنيف مسلسلات"}</span><Clapperboard className="h-5 w-5 text-[#8f7dff]" /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-right">
            <div className="space-y-2"><Label className="text-slate-300">اسم التصنيف</Label><Input value={categoryForm.name} onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label className="text-slate-300">الترتيب</Label><Input type="number" value={categoryForm.sort_order} onChange={(e) => setCategoryForm((p) => ({ ...p, sort_order: Number(e.target.value) || 0 }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">الحالة</Label><select value={categoryForm.status} onChange={(e) => setCategoryForm((p) => ({ ...p, status: e.target.value }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="Active">Active</option><option value="Disabled">Disabled</option></select></div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => onSaveCategory(categoryForm).then(() => setCategoryForm(initialCategory))} disabled={loading} className="rounded-2xl bg-[#6D4CFF] text-white hover:bg-[#7B5DFF]">{categoryForm.id ? "حفظ" : "إضافة"}</Button>
              <Button type="button" variant="outline" onClick={() => setCategoryForm(initialCategory)} className="rounded-2xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">إلغاء</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
          <CardHeader><CardTitle className="text-lg text-white">قائمة تصنيفات المسلسلات</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow className="border-white/10 hover:bg-transparent"><TableHead className="text-right text-slate-400">التصنيف</TableHead><TableHead className="text-right text-slate-400">الحالة</TableHead><TableHead className="text-right text-slate-400">إجراءات</TableHead></TableRow></TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-right text-white">{category.name}</TableCell>
                    <TableCell className="text-right text-slate-300">{category.status}</TableCell>
                    <TableCell className="text-right"><div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setCategoryForm({ id: category.id, name: category.name, sort_order: category.sort_order, status: category.status })} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => onSaveCategory({ id: category.id, name: category.name, sort_order: category.sort_order, status: category.status === "Active" ? "Disabled" : "Active" })} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"><Power className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => onDeleteCategory(category.id)} className="rounded-xl border-rose-500/20 bg-transparent text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
          <CardHeader><CardTitle className="text-lg text-white">{seriesForm.id ? "تعديل مسلسل" : "إضافة مسلسل"}</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-right">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label className="text-slate-300">اسم المسلسل</Label><Input value={seriesForm.title} onChange={(e) => setSeriesForm((p) => ({ ...p, title: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Poster URL</Label><Input value={seriesForm.poster_url} onChange={(e) => setSeriesForm((p) => ({ ...p, poster_url: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Backdrop URL</Label><Input value={seriesForm.backdrop_url} onChange={(e) => setSeriesForm((p) => ({ ...p, backdrop_url: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">التصنيف</Label><select value={seriesForm.category_id ?? ""} onChange={(e) => setSeriesForm((p) => ({ ...p, category_id: e.target.value ? Number(e.target.value) : undefined }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="">بدون تصنيف</option>{activeCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
              <div className="space-y-2"><Label className="text-slate-300">Genre</Label><Input value={seriesForm.genre} onChange={(e) => setSeriesForm((p) => ({ ...p, genre: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Year</Label><Input type="number" value={seriesForm.release_year ?? ""} onChange={(e) => setSeriesForm((p) => ({ ...p, release_year: e.target.value ? Number(e.target.value) : undefined }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Rating</Label><Input value={seriesForm.rating} onChange={(e) => setSeriesForm((p) => ({ ...p, rating: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Sort order</Label><Input type="number" value={seriesForm.sort_order} onChange={(e) => setSeriesForm((p) => ({ ...p, sort_order: Number(e.target.value) || 0 }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Status</Label><select value={seriesForm.status} onChange={(e) => setSeriesForm((p) => ({ ...p, status: e.target.value }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="Active">Active</option><option value="Disabled">Disabled</option></select></div>
              <div className="space-y-2 sm:col-span-2"><Label className="text-slate-300">الوصف</Label><Textarea value={seriesForm.description} onChange={(e) => setSeriesForm((p) => ({ ...p, description: e.target.value }))} className="min-h-24 rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => onSaveSeries(seriesForm).then(() => setSeriesForm(initialSeries))} disabled={loading} className="rounded-2xl bg-[#1ec8a5] text-slate-950 hover:bg-[#34d9b6]">{seriesForm.id ? "حفظ" : "إضافة"}</Button>
              <Button type="button" variant="outline" onClick={() => setSeriesForm(initialSeries)} className="rounded-2xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">إلغاء</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
          <CardHeader><CardTitle className="text-lg text-white">قائمة المسلسلات</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow className="border-white/10 hover:bg-transparent"><TableHead className="text-right text-slate-400">المسلسل</TableHead><TableHead className="text-right text-slate-400">الحالة</TableHead><TableHead className="text-right text-slate-400">إجراءات</TableHead></TableRow></TableHeader>
              <TableBody>
                {series.map((item) => (
                  <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-right text-white"><div><p>{item.title}</p><p className="text-xs text-slate-500">{item.category_name}</p></div></TableCell>
                    <TableCell className="text-right text-slate-300">{item.status}</TableCell>
                    <TableCell className="text-right"><div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="outline" onClick={() => { setSeriesForm({ id: item.id, title: item.title, poster_url: item.poster_url ?? "", backdrop_url: item.backdrop_url ?? "", category_id: item.category_id ?? undefined, description: item.description ?? "", genre: item.genre ?? "", release_year: item.release_year ?? undefined, rating: item.rating ?? "", sort_order: item.sort_order, status: item.status }); handleSeriesPick(item.id); }} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => { handleSeriesPick(item.id); }} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"><PlusCircle className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => onSaveSeries({ id: item.id, title: item.title, poster_url: item.poster_url ?? "", backdrop_url: item.backdrop_url ?? "", category_id: item.category_id, description: item.description ?? "", genre: item.genre ?? "", release_year: item.release_year, rating: item.rating ?? "", sort_order: item.sort_order, status: item.status === "Active" ? "Disabled" : "Active" })} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"><Power className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => onDeleteSeries(item.id)} className="rounded-xl border-rose-500/20 bg-transparent text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
          <CardHeader><CardTitle className="text-lg text-white">إدارة المواسم</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-right">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label className="text-slate-300">المسلسل</Label><select value={seasonForm.series_id || activeSeriesId || ""} onChange={(e) => { const value = Number(e.target.value) || 0; handleSeriesPick(value); setSeasonForm((p) => ({ ...p, series_id: value })); }} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="">اختر مسلسلًا</option>{series.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
              <div className="space-y-2"><Label className="text-slate-300">Season number</Label><Input type="number" value={seasonForm.season_number} onChange={(e) => setSeasonForm((p) => ({ ...p, season_number: Number(e.target.value) || 1 }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Season name</Label><Input value={seasonForm.name} onChange={(e) => setSeasonForm((p) => ({ ...p, name: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Sort order</Label><Input type="number" value={seasonForm.sort_order} onChange={(e) => setSeasonForm((p) => ({ ...p, sort_order: Number(e.target.value) || 0 }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
            </div>
            <div className="flex gap-3"><Button onClick={() => onSaveSeason({ ...seasonForm, series_id: seasonForm.series_id || activeSeriesId }).then(() => setSeasonForm((p) => ({ ...initialSeason, series_id: p.series_id || activeSeriesId }))) } disabled={loading || !(seasonForm.series_id || activeSeriesId)} className="rounded-2xl bg-[#6D4CFF] text-white hover:bg-[#7B5DFF]">{seasonForm.id ? "حفظ الموسم" : "إضافة موسم"}</Button><Button type="button" variant="outline" onClick={() => setSeasonForm({ ...initialSeason, series_id: activeSeriesId })} className="rounded-2xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">إلغاء</Button></div>
            <Table>
              <TableHeader><TableRow className="border-white/10 hover:bg-transparent"><TableHead className="text-right text-slate-400">الموسم</TableHead><TableHead className="text-right text-slate-400">إجراءات</TableHead></TableRow></TableHeader>
              <TableBody>
                {visibleSeasons.map((season) => (
                  <TableRow key={season.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-right text-white">{season.name || `Season ${season.season_number}`}</TableCell>
                    <TableCell className="text-right"><div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setSeasonForm({ id: season.id, series_id: season.series_id, season_number: season.season_number, name: season.name ?? "", sort_order: season.sort_order })} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => onDeleteSeason(season.id)} className="rounded-xl border-rose-500/20 bg-transparent text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
          <CardHeader><CardTitle className="text-lg text-white">إدارة الحلقات</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-right">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label className="text-slate-300">المسلسل</Label><select value={episodeForm.series_id || activeSeriesId || ""} onChange={(e) => { const value = Number(e.target.value) || 0; handleSeriesPick(value); setEpisodeForm((p) => ({ ...p, series_id: value, season_id: 0 })); }} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="">اختر مسلسلًا</option>{series.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
              <div className="space-y-2"><Label className="text-slate-300">الموسم</Label><select value={episodeForm.season_id || ""} onChange={(e) => setEpisodeForm((p) => ({ ...p, season_id: Number(e.target.value) || 0 }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="">اختر موسمًا</option>{visibleSeasons.map((season) => <option key={season.id} value={season.id}>{season.name || `Season ${season.season_number}`}</option>)}</select></div>
              <div className="space-y-2"><Label className="text-slate-300">Episode number</Label><Input type="number" value={episodeForm.episode_number} onChange={(e) => setEpisodeForm((p) => ({ ...p, episode_number: Number(e.target.value) || 1 }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2 sm:col-span-2"><Label className="text-slate-300">عنوان الحلقة</Label><Input value={episodeForm.episode_title} onChange={(e) => setEpisodeForm((p) => ({ ...p, episode_title: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2 sm:col-span-2"><Label className="text-slate-300">رابط التشغيل</Label><Input value={episodeForm.stream_url} onChange={(e) => setEpisodeForm((p) => ({ ...p, stream_url: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Duration</Label><Input value={episodeForm.duration} onChange={(e) => setEpisodeForm((p) => ({ ...p, duration: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Poster</Label><Input value={episodeForm.poster_url} onChange={(e) => setEpisodeForm((p) => ({ ...p, poster_url: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Status</Label><select value={episodeForm.status} onChange={(e) => setEpisodeForm((p) => ({ ...p, status: e.target.value }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"><option value="Active">Active</option><option value="Disabled">Disabled</option></select></div>
            </div>
            <div className="flex gap-3"><Button onClick={() => onSaveEpisode({ ...episodeForm, series_id: episodeForm.series_id || activeSeriesId }).then(() => setEpisodeForm((p) => ({ ...initialEpisode, series_id: p.series_id || activeSeriesId }))) } disabled={loading || !(episodeForm.series_id || activeSeriesId) || !episodeForm.season_id} className="rounded-2xl bg-[#1ec8a5] text-slate-950 hover:bg-[#34d9b6]">{episodeForm.id ? "حفظ الحلقة" : "إضافة حلقة"}</Button><Button type="button" variant="outline" onClick={() => setEpisodeForm({ ...initialEpisode, series_id: activeSeriesId })} className="rounded-2xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">إلغاء</Button></div>
            <Table>
              <TableHeader><TableRow className="border-white/10 hover:bg-transparent"><TableHead className="text-right text-slate-400">الحلقة</TableHead><TableHead className="text-right text-slate-400">الموسم</TableHead><TableHead className="text-right text-slate-400">إجراءات</TableHead></TableRow></TableHeader>
              <TableBody>
                {visibleEpisodes.map((episode) => (
                  <TableRow key={episode.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-right text-white">{episode.episode_title}</TableCell>
                    <TableCell className="text-right text-slate-300">{episode.season_number}</TableCell>
                    <TableCell className="text-right"><div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setEpisodeForm({ id: episode.id, series_id: episode.series_id, season_id: episode.season_id, episode_title: episode.episode_title, episode_number: episode.episode_number, stream_url: episode.stream_url, duration: episode.duration ?? "", poster_url: episode.poster_url ?? "", status: episode.status })} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => onDeleteEpisode(episode.id)} className="rounded-xl border-rose-500/20 bg-transparent text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

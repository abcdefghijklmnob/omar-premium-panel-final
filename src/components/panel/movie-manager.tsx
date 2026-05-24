import { useMemo, useState } from "react";
import { Film, Pencil, Power, Trash2 } from "lucide-react";

import { VodCategory, VodStream } from "@/lib/panel-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type MovieManagerProps = {
  categories: VodCategory[];
  movies: VodStream[];
  loading?: boolean;
  onSaveCategory: (payload: { id?: number; name: string; sort_order: number; status: string }) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
  onSaveMovie: (payload: {
    id?: number;
    title: string;
    stream_url: string;
    poster_url?: string;
    backdrop_url?: string;
    category_id?: number | null;
    description?: string;
    genre?: string;
    release_year?: number | null;
    rating?: string;
    duration?: string;
    sort_order: number;
    status: string;
  }) => Promise<void>;
  onDeleteMovie: (id: number) => Promise<void>;
};

const initialCategory = { id: undefined as number | undefined, name: "", sort_order: 0, status: "Active" };
const initialMovie = {
  id: undefined as number | undefined,
  title: "",
  stream_url: "",
  poster_url: "",
  backdrop_url: "",
  category_id: undefined as number | undefined,
  description: "",
  genre: "",
  release_year: undefined as number | undefined,
  rating: "",
  duration: "",
  sort_order: 0,
  status: "Active",
};

export function MovieManager({
  categories,
  movies,
  loading,
  onSaveCategory,
  onDeleteCategory,
  onSaveMovie,
  onDeleteMovie,
}: MovieManagerProps) {
  const [categoryForm, setCategoryForm] = useState(initialCategory);
  const [movieForm, setMovieForm] = useState(initialMovie);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingMovie, setSavingMovie] = useState(false);

  const activeCategoryOptions = useMemo(
    () => categories.filter((category) => category.status === "Active"),
    [categories],
  );

  const resetCategory = () => setCategoryForm(initialCategory);
  const resetMovie = () => setMovieForm(initialMovie);

  const submitCategory = async () => {
    setSavingCategory(true);
    try {
      await onSaveCategory(categoryForm);
      resetCategory();
    } finally {
      setSavingCategory(false);
    }
  };

  const submitMovie = async () => {
    setSavingMovie(true);
    try {
      await onSaveMovie(movieForm);
      resetMovie();
    } finally {
      setSavingMovie(false);
    }
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg text-white">
              <span>{categoryForm.id ? "تعديل تصنيف فيلم" : "إضافة تصنيف أفلام"}</span>
              <Film className="h-5 w-5 text-[#8f7dff]" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-right">
            <div className="space-y-2">
              <Label className="text-slate-300">اسم التصنيف</Label>
              <Input value={categoryForm.name} onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-300">الترتيب</Label>
                <Input type="number" value={categoryForm.sort_order} onChange={(e) => setCategoryForm((p) => ({ ...p, sort_order: Number(e.target.value) || 0 }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">الحالة</Label>
                <select value={categoryForm.status} onChange={(e) => setCategoryForm((p) => ({ ...p, status: e.target.value }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none">
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={submitCategory} disabled={loading || savingCategory} className="rounded-2xl bg-[#6D4CFF] text-white hover:bg-[#7B5DFF]">
                {savingCategory ? "جارٍ الحفظ..." : categoryForm.id ? "حفظ التعديل" : "إضافة التصنيف"}
              </Button>
              <Button type="button" variant="outline" onClick={resetCategory} className="rounded-2xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
          <CardHeader>
            <CardTitle className="text-lg text-white">قائمة تصنيفات الأفلام</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-right text-slate-400">التصنيف</TableHead>
                  <TableHead className="text-right text-slate-400">الحالة</TableHead>
                  <TableHead className="text-right text-slate-400">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-right text-white">
                      <div>
                        <p>{category.name}</p>
                        <p className="text-xs text-slate-500">ترتيب: {category.sort_order}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-slate-300">{category.status}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setCategoryForm({ id: category.id, name: category.name, sort_order: category.sort_order, status: category.status })} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => onSaveCategory({ id: category.id, name: category.name, sort_order: category.sort_order, status: category.status === "Active" ? "Disabled" : "Active" })} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"><Power className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => onDeleteCategory(category.id)} className="rounded-xl border-rose-500/20 bg-transparent text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
          <CardHeader>
            <CardTitle className="text-lg text-white">{movieForm.id ? "تعديل فيلم" : "إضافة فيلم جديد"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-right">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-slate-300">اسم الفيلم</Label>
                <Input value={movieForm.title} onChange={(e) => setMovieForm((p) => ({ ...p, title: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-slate-300">رابط التشغيل</Label>
                <Input value={movieForm.stream_url} onChange={(e) => setMovieForm((p) => ({ ...p, stream_url: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Poster URL</Label>
                <Input value={movieForm.poster_url} onChange={(e) => setMovieForm((p) => ({ ...p, poster_url: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Backdrop URL</Label>
                <Input value={movieForm.backdrop_url} onChange={(e) => setMovieForm((p) => ({ ...p, backdrop_url: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">التصنيف</Label>
                <select value={movieForm.category_id ?? ""} onChange={(e) => setMovieForm((p) => ({ ...p, category_id: e.target.value ? Number(e.target.value) : undefined }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none">
                  <option value="">بدون تصنيف</option>
                  {activeCategoryOptions.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Genre</Label>
                <Input value={movieForm.genre} onChange={(e) => setMovieForm((p) => ({ ...p, genre: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Year</Label>
                <Input type="number" value={movieForm.release_year ?? ""} onChange={(e) => setMovieForm((p) => ({ ...p, release_year: e.target.value ? Number(e.target.value) : undefined }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Rating</Label>
                <Input value={movieForm.rating} onChange={(e) => setMovieForm((p) => ({ ...p, rating: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Duration</Label>
                <Input value={movieForm.duration} onChange={(e) => setMovieForm((p) => ({ ...p, duration: e.target.value }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Sort order</Label>
                <Input type="number" value={movieForm.sort_order} onChange={(e) => setMovieForm((p) => ({ ...p, sort_order: Number(e.target.value) || 0 }))} className="rounded-2xl border-white/10 bg-[#101a39] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Status</Label>
                <select value={movieForm.status} onChange={(e) => setMovieForm((p) => ({ ...p, status: e.target.value }))} className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none">
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-slate-300">الوصف</Label>
                <Textarea value={movieForm.description} onChange={(e) => setMovieForm((p) => ({ ...p, description: e.target.value }))} className="min-h-24 rounded-2xl border-white/10 bg-[#101a39] text-white" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={submitMovie} disabled={loading || savingMovie} className="rounded-2xl bg-[#1ec8a5] text-slate-950 hover:bg-[#34d9b6]">{savingMovie ? "جارٍ الحفظ..." : movieForm.id ? "حفظ التعديل" : "إضافة الفيلم"}</Button>
              <Button type="button" variant="outline" onClick={resetMovie} className="rounded-2xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white">إلغاء</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-white/10 bg-[#0b1228]">
          <CardHeader>
            <CardTitle className="text-lg text-white">قائمة الأفلام</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-right text-slate-400">الفيلم</TableHead>
                  <TableHead className="text-right text-slate-400">التصنيف</TableHead>
                  <TableHead className="text-right text-slate-400">الحالة</TableHead>
                  <TableHead className="text-right text-slate-400">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movies.map((movie) => (
                  <TableRow key={movie.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-right text-white">
                      <div>
                        <p>{movie.title}</p>
                        <p className="max-w-xs truncate text-xs text-slate-500">{movie.stream_url}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-slate-300">{movie.category_name}</TableCell>
                    <TableCell className="text-right text-slate-300">{movie.status}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setMovieForm({ id: movie.id, title: movie.title, stream_url: movie.stream_url, poster_url: movie.poster_url ?? "", backdrop_url: movie.backdrop_url ?? "", category_id: movie.category_id ?? undefined, description: movie.description ?? "", genre: movie.genre ?? "", release_year: movie.release_year ?? undefined, rating: movie.rating ?? "", duration: movie.duration ?? "", sort_order: movie.sort_order, status: movie.status })} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => onSaveMovie({ id: movie.id, title: movie.title, stream_url: movie.stream_url, poster_url: movie.poster_url ?? "", backdrop_url: movie.backdrop_url ?? "", category_id: movie.category_id, description: movie.description ?? "", genre: movie.genre ?? "", release_year: movie.release_year, rating: movie.rating ?? "", duration: movie.duration ?? "", sort_order: movie.sort_order, status: movie.status === "Active" ? "Disabled" : "Active" })} className="rounded-xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"><Power className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => onDeleteMovie(movie.id)} className="rounded-xl border-rose-500/20 bg-transparent text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
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

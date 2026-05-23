import { useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Category = {
  id: number;
  name: string;
};

type AddStreamDialogProps = {
  categories: Category[];
  onCreateCategory: (payload: { name: string; sort_order: number; image_url?: string }) => Promise<void>;
  onCreateStream: (payload: {
    name: string;
    stream_url: string;
    logo_url?: string;
    category_id: number;
    status: string;
    sort_order: number;
  }) => Promise<void>;
  disabled?: boolean;
};

export function AddStreamDialog({
  categories,
  onCreateCategory,
  onCreateStream,
  disabled,
}: AddStreamDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const initialCategoryId = useMemo(() => categories[0]?.id ?? 0, [categories]);
  const [categoryForm, setCategoryForm] = useState({ name: "", sort_order: 1, image_url: "" });
  const [streamForm, setStreamForm] = useState({
    name: "",
    stream_url: "",
    logo_url: "",
    category_id: initialCategoryId,
    status: "Active",
    sort_order: 1,
  });

  const handleCreateCategory = async () => {
    setSubmitting(true);
    try {
      await onCreateCategory(categoryForm);
      setCategoryForm({ name: "", sort_order: 1, image_url: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStream = async () => {
    setSubmitting(true);
    try {
      await onCreateStream({
        ...streamForm,
        category_id: Number(streamForm.category_id),
      });
      setStreamForm({
        name: "",
        stream_url: "",
        logo_url: "",
        category_id: categories[0]?.id ?? 0,
        status: "Active",
        sort_order: 1,
      });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={disabled}
          className="rounded-2xl bg-[#18244f] px-5 text-white hover:bg-[#1b2e63]"
        >
          إضافة قناة Live
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-white/10 bg-[#0f1732] text-right text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">إضافة قناة واختيار تصنيف</DialogTitle>
          <DialogDescription className="text-slate-400">
            يمكنك إنشاء تصنيف سريع ثم إضافة القناة داخل نفس النافذة.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-base font-medium text-white">تصنيف جديد</h3>
            <div className="space-y-2">
              <Label className="text-slate-300">اسم التصنيف</Label>
              <Input
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className="rounded-2xl border-white/10 bg-[#101a39] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">الترتيب</Label>
              <Input
                type="number"
                min={0}
                value={categoryForm.sort_order}
                onChange={(event) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    sort_order: Number(event.target.value) || 0,
                  }))
                }
                className="rounded-2xl border-white/10 bg-[#101a39] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">رابط الصورة (اختياري)</Label>
              <Input
                value={categoryForm.image_url}
                onChange={(event) =>
                  setCategoryForm((prev) => ({ ...prev, image_url: event.target.value }))
                }
                className="rounded-2xl border-white/10 bg-[#101a39] text-white"
              />
            </div>
            <Button
              onClick={handleCreateCategory}
              disabled={submitting}
              className="w-full rounded-2xl bg-[#6D4CFF] text-white hover:bg-[#7B5DFF]"
            >
              إنشاء التصنيف
            </Button>
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-base font-medium text-white">القناة</h3>
            <div className="space-y-2">
              <Label className="text-slate-300">اسم القناة</Label>
              <Input
                value={streamForm.name}
                onChange={(event) => setStreamForm((prev) => ({ ...prev, name: event.target.value }))}
                className="rounded-2xl border-white/10 bg-[#101a39] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">رابط البث الأصلي</Label>
              <Input
                value={streamForm.stream_url}
                onChange={(event) =>
                  setStreamForm((prev) => ({ ...prev, stream_url: event.target.value }))
                }
                className="rounded-2xl border-white/10 bg-[#101a39] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">رابط الشعار</Label>
              <Input
                value={streamForm.logo_url}
                onChange={(event) => setStreamForm((prev) => ({ ...prev, logo_url: event.target.value }))}
                className="rounded-2xl border-white/10 bg-[#101a39] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">التصنيف</Label>
              <select
                value={streamForm.category_id}
                onChange={(event) =>
                  setStreamForm((prev) => ({ ...prev, category_id: Number(event.target.value) }))
                }
                className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-300">Status</Label>
                <select
                  value={streamForm.status}
                  onChange={(event) => setStreamForm((prev) => ({ ...prev, status: event.target.value }))}
                  className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">الترتيب</Label>
                <Input
                  type="number"
                  min={0}
                  value={streamForm.sort_order}
                  onChange={(event) =>
                    setStreamForm((prev) => ({
                      ...prev,
                      sort_order: Number(event.target.value) || 0,
                    }))
                  }
                  className="rounded-2xl border-white/10 bg-[#101a39] text-white"
                />
              </div>
            </div>
            <Button
              onClick={handleCreateStream}
              disabled={submitting || categories.length === 0}
              className="w-full rounded-2xl bg-[#1ec8a5] text-slate-950 hover:bg-[#34d9b6]"
            >
              حفظ القناة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

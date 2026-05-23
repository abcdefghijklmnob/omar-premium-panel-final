import { useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";

type AddUserDialogProps = {
  onSubmit: (payload: {
    username: string;
    password: string;
    status: string;
    expiry_date: string;
    max_connections: number;
    notes: string;
  }) => Promise<void>;
  disabled?: boolean;
};

export function AddUserDialog({ onSubmit, disabled }: AddUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    status: "Active",
    expiry_date: "",
    max_connections: 1,
    notes: "",
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm({
        username: "",
        password: "",
        status: "Active",
        expiry_date: "",
        max_connections: 1,
        notes: "",
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
          className="rounded-2xl bg-[#6D4CFF] px-5 text-white hover:bg-[#7B5DFF]"
        >
          إضافة مستخدم IPTV
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-white/10 bg-[#0f1732] text-right text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">إضافة مستخدم جديد</DialogTitle>
          <DialogDescription className="text-slate-400">
            أنشئ بيانات دخول جاهزة للاختبار على IBO Player أو أي تطبيق Xtream.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-slate-300">Username</Label>
            <Input
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              className="rounded-2xl border-white/10 bg-[#101a39] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Password</Label>
            <Input
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="rounded-2xl border-white/10 bg-[#101a39] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Status</Label>
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              className="flex h-10 w-full rounded-2xl border border-white/10 bg-[#101a39] px-3 text-sm text-white outline-none"
            >
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Banned">Banned</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Expiry Date</Label>
            <Input
              type="date"
              value={form.expiry_date}
              onChange={(event) => setForm((prev) => ({ ...prev, expiry_date: event.target.value }))}
              className="rounded-2xl border-white/10 bg-[#101a39] text-white"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-slate-300">Max Connections</Label>
            <Input
              type="number"
              min={1}
              value={form.max_connections}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, max_connections: Number(event.target.value) || 1 }))
              }
              className="rounded-2xl border-white/10 bg-[#101a39] text-white"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-slate-300">ملاحظات داخلية</Label>
            <Textarea
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="min-h-24 rounded-2xl border-white/10 bg-[#101a39] text-white"
            />
          </div>
        </div>

        <div className="flex justify-start gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="rounded-2xl border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-2xl bg-[#6D4CFF] text-white hover:bg-[#7B5DFF]"
          >
            {submitting ? "جارٍ الحفظ..." : "حفظ المستخدم"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

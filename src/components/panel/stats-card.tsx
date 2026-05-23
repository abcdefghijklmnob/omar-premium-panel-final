import { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type StatsCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
};

export function StatsCard({ title, value, description, icon: Icon, iconClassName }: StatsCardProps) {
  return (
    <Card className="rounded-3xl border-white/10 bg-[#111936]/80 shadow-[0_20px_60px_rgba(5,10,30,0.35)] backdrop-blur">
      <CardContent className="flex items-center justify-between p-5">
        <div className="space-y-2 text-right">
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-3xl font-semibold text-white">{value}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconClassName}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </CardContent>
    </Card>
  );
}

// peças do portal de parceiros: filtro de período, cartão de número e
// selo de situação da loja.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RANGE_PRESETS, presetRange, type RangePreset, type StoreStatus } from "@/lib/partnerPortal";

export type DateRange = { from: string; to: string };

export const useDateRange = (initial: RangePreset = "30d") => {
  const [range, setRange] = useState<DateRange>(() => presetRange(initial));
  return [range, setRange] as const;
};

export function DateRangeFilter({ value, onChange }: { value: DateRange; onChange: (next: DateRange) => void }) {
  const { t } = useTranslation();
  const active = RANGE_PRESETS.find((p) => {
    const r = presetRange(p);
    return r.from === value.from && r.to === value.to;
  });
  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1">
        {RANGE_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(presetRange(preset))}
            className={`rounded-full px-3 py-1 text-xs transition ${active === preset ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}
          >
            {t(`partnerPortal.presets.${preset}`)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">{t("partnerPortal.from")}</span>
        <Input type="date" className="h-8 w-36" value={value.from} max={value.to} onChange={(e) => e.target.value && onChange({ ...value, from: e.target.value })} />
        <span className="text-muted-foreground">{t("partnerPortal.to")}</span>
        <Input type="date" className="h-8 w-36" value={value.to} min={value.from} onChange={(e) => e.target.value && onChange({ ...value, to: e.target.value })} />
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string | null }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  lifetime: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  trialing: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  cancelled: "bg-red-500/15 text-red-700 dark:text-red-400",
  expired: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  deleted: "bg-muted text-muted-foreground",
  unknown: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: StoreStatus }) {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className={`border-0 ${STATUS_STYLE[status] || STATUS_STYLE.unknown}`}>
      {t(`partnerPortal.status.${status}`, { defaultValue: status })}
    </Badge>
  );
}

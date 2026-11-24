// cancelamentos no portal de parceiros. A administração da Domus
// também pode registrar o motivo de uma loja (quando soube por conversa).
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateRangeFilter, StatusBadge, useDateRange } from "@/components/partners/PortalBits";
import {
  CANCELLATION_REASONS,
  brl,
  fetchPortalCancellations,
  formatDay,
  saveCancellationReason,
  type CancellationReason,
  type PortalCancellation,
} from "@/lib/partnerPortal";

export default function PartnerCancellations({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useTranslation();
  const [range, setRange] = useDateRange("12m");
  const [data, setData] = useState<{ items: PortalCancellation[]; by_reason: Record<string, number> } | null>(null);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<PortalCancellation | null>(null);
  const [reason, setReason] = useState<CancellationReason>("price");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setError(false);
    fetchPortalCancellations(range.from, range.to)
      .then(setData)
      .catch((e) => {
        console.error("Cancelamentos do portal:", e);
        setError(true);
      });
  }, [range.from, range.to]);

  useEffect(load, [load]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await saveCancellationReason(editing.id, reason, details);
      toast.success(t("partnerPortal.reasonSaved"));
      setEditing(null);
      load();
    } catch (e) {
      toast.error((e as { message?: string })?.message || t("partnerPortal.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const reasons = Object.entries(data?.by_reason || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{t("partnerPortal.cancTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("partnerPortal.cancDesc")}</p>
      </div>
      <DateRangeFilter value={range} onChange={setRange} />
      {error && <p className="text-sm text-destructive">{t("partnerPortal.loadError")}</p>}
      {!data && !error && <p className="py-10 text-center text-sm text-muted-foreground">{t("partnerPortal.loading")}</p>}
      {data && (
        <div className="grid gap-4 lg:grid-cols-4">
          <Card className="rounded-3xl lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">{t("partnerPortal.byReasonTitle")}</CardTitle>
              <CardDescription>{data.items.length}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              {reasons.length === 0 && <p className="text-muted-foreground">-</p>}
              {reasons.map(([key, count]) => (
                <p key={key} className="flex justify-between gap-2">
                  <span>{t(`partnerPortal.reasons.${key}`, { defaultValue: key })}</span>
                  <b>{count}</b>
                </p>
              ))}
            </CardContent>
          </Card>
          <div className="overflow-x-auto rounded-2xl border bg-background lg:col-span-3">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">{t("partnerPortal.colStore")}</th>
                  <th className="p-2 text-left">{t("partnerPortal.colStatus")}</th>
                  <th className="p-2 text-left">{t("partnerPortal.colEnded")}</th>
                  <th className="p-2 text-left">{t("partnerPortal.colDays")}</th>
                  <th className="p-2 text-right">{t("partnerPortal.colPaid")}</th>
                  <th className="p-2 text-left">{t("partnerPortal.colReason")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2">
                      <Link to={`/lojas/${item.id}`} className="font-medium hover:underline">
                        {item.name}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        {item.coupon_code} · {item.ambassador_name}
                      </span>
                    </td>
                    <td className="p-2">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="p-2">{formatDay(item.ended_at)}</td>
                    <td className="p-2">{t("partnerPortal.days", { count: item.days_active })}</td>
                    <td className="p-2 text-right tabular-nums">{brl(item.paid_total)}</td>
                    <td className="p-2">
                      {item.reason ? (
                        <>
                          {t(`partnerPortal.reasons.${item.reason.reason}`)}
                          {item.reason.details && <span className="block text-xs text-muted-foreground">{item.reason.details}</span>}
                        </>
                      ) : (
                        <span className="text-muted-foreground">{t("partnerPortal.noReason")}</span>
                      )}
                      {isAdmin && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => {
                            setEditing(item);
                            setReason(item.reason?.reason || "price");
                            setDetails(item.reason?.details || "");
                          }}
                        >
                          {t("partnerPortal.registerReason")}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      {t("partnerPortal.cancEmpty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("partnerPortal.registerReason")} · {editing?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={reason} onValueChange={(v) => setReason(v as CancellationReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`partnerPortal.reasons.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea value={details} maxLength={1000} onChange={(e) => setDetails(e.target.value)} placeholder={t("cancellationReason.detailsLabel")} />
            <Button className="w-full" onClick={() => void save()} disabled={saving}>
              {t("partnerPortal.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

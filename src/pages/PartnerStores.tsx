// lista de lojas do portal de parceiros.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangeFilter, StatusBadge, useDateRange } from "@/components/partners/PortalBits";
import {
  brl,
  daysUntil,
  downloadCsv,
  fetchPortalStores,
  formatDay,
  toCsv,
  usageLevel,
  type PortalStoreRow,
} from "@/lib/partnerPortal";

const USAGE_STYLE = {
  active: "text-emerald-600",
  low: "text-amber-600",
  stopped: "text-red-600",
  never: "text-muted-foreground",
} as const;

export default function PartnerStores() {
  const { t } = useTranslation();
  const [range, setRange] = useDateRange("30d");
  const [rows, setRows] = useState<PortalStoreRow[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let active = true;
    setError(false);
    fetchPortalStores(range.from, range.to)
      .then((list) => active && setRows(list))
      .catch((e) => {
        console.error("Lojas do portal:", e);
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [range.from, range.to]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows || []).filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (!q || [r.name, r.coupon_code, r.ambassador_name, r.partner_name].some((v) => String(v || "").toLowerCase().includes(q))),
    );
  }, [rows, query, status]);

  const planName = (plan: string | null) => (plan ? t(`partnerPortal.plans.${plan}`, { defaultValue: plan }) : "-");

  const exportCsv = () => {
    const columns = [
      { key: "name", label: t("partnerPortal.colStore") },
      { key: "coupon_code", label: t("partnerPortal.colCoupon") },
      { key: "ambassador_name", label: t("partnerPortal.colAmbassador") },
      { key: "created", label: t("partnerPortal.colCreated") },
      { key: "status", label: t("partnerPortal.colStatus") },
      { key: "plan", label: t("partnerPortal.colPlan") },
      { key: "monthly", label: t("partnerPortal.colMonthly") },
      { key: "sales", label: t("partnerPortal.colSales") },
      { key: "products_total", label: t("partnerPortal.colProducts") },
      { key: "sellers_count", label: t("partnerPortal.colSellers") },
      { key: "paid", label: t("partnerPortal.colPaid") },
    ];
    const data = visible.map((r) => ({
      ...r,
      created: formatDay(r.created_at),
      status: t(`partnerPortal.status.${r.status}`, { defaultValue: r.status }),
      plan: planName(r.plan),
      monthly: String(r.monthly_amount ?? 0).replace(".", ","),
      sales: String(r.sales_total).replace(".", ","),
      paid: String(r.paid_total).replace(".", ","),
    }));
    downloadCsv(`lojas-${range.from}-a-${range.to}.csv`, toCsv(data, columns));
  };

  return (
    <div className="space-y-4">
      <DateRangeFilter value={range} onChange={setRange} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder={t("partnerPortal.search")} value={query} onChange={(e) => setQuery(e.target.value)} className="sm:max-w-sm" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("partnerPortal.statusAll")}</SelectItem>
            {(["trialing", "active", "lifetime", "cancelled", "expired"] as const).map((s) => (
              <SelectItem key={s} value={s}>
                {t(`partnerPortal.status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv} disabled={!visible.length} className="sm:ml-auto">
          <Download className="mr-2 h-4 w-4" /> {t("partnerPortal.exportCsv")}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{t("partnerPortal.loadError")}</p>}
      {!rows && !error && <p className="py-10 text-center text-sm text-muted-foreground">{t("partnerPortal.loading")}</p>}
      {rows && (
        <div className="overflow-x-auto rounded-2xl border bg-background">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="p-2 text-left">{t("partnerPortal.colStore")}</th>
                <th className="p-2 text-left">{t("partnerPortal.colCoupon")}</th>
                <th className="p-2 text-left">{t("partnerPortal.colCreated")}</th>
                <th className="p-2 text-left">{t("partnerPortal.colStatus")}</th>
                <th className="p-2 text-left">{t("partnerPortal.colPlan")}</th>
                <th className="p-2 text-right">{t("partnerPortal.colSales")}</th>
                <th className="p-2 text-right">{t("partnerPortal.colProducts")}</th>
                <th className="p-2 text-right">{t("partnerPortal.colSellers")}</th>
                <th className="p-2 text-left">{t("partnerPortal.colUsage")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const level = usageLevel(r.last_sale_at);
                const trialDays = r.status === "trialing" ? daysUntil(r.trial_ends_at) : null;
                return (
                  <tr key={r.id} className="border-t hover:bg-muted/30">
                    <td className="p-2">
                      <Link to={`/lojas/${r.id}`} className="font-medium hover:underline">
                        {r.name}
                      </Link>
                      {r.address && <span className="block max-w-[220px] truncate text-xs text-muted-foreground">{r.address}</span>}
                    </td>
                    <td className="p-2">
                      <span className="font-mono text-xs">{r.coupon_code}</span>
                      <span className="block text-xs text-muted-foreground">{r.ambassador_name}</span>
                    </td>
                    <td className="p-2">{formatDay(r.created_at)}</td>
                    <td className="p-2">
                      <StatusBadge status={r.status} />
                      {trialDays !== null && trialDays >= 0 && (
                        <span className="block text-xs text-muted-foreground">{t("partnerPortal.trialDays", { days: trialDays })}</span>
                      )}
                    </td>
                    <td className="p-2">
                      {planName(r.plan)}
                      {r.monthly_amount ? <span className="block text-xs text-muted-foreground">{brl(r.monthly_amount)}</span> : null}
                    </td>
                    <td className="p-2 text-right tabular-nums">{brl(r.sales_total)}</td>
                    <td className="p-2 text-right tabular-nums">{r.products_total}</td>
                    <td className="p-2 text-right tabular-nums">{r.sellers_count}</td>
                    <td className={`p-2 text-xs font-medium ${USAGE_STYLE[level]}`}>{t(`partnerPortal.usage.${level}`)}</td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted-foreground">
                    {t("partnerPortal.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

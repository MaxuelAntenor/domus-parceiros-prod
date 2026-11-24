// painel inicial do portal de parceiros (resumo do período).
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeFilter, StatCard, StatusBadge, useDateRange } from "@/components/partners/PortalBits";
import {
  brl,
  daysUntil,
  fetchPortalStores,
  fetchPortalSummary,
  formatMonth,
  usageLevel,
  type PortalStoreRow,
  type PortalSummary,
} from "@/lib/partnerPortal";

export default function PartnerDashboard() {
  const { t } = useTranslation();
  const [range, setRange] = useDateRange("30d");
  const [summary, setSummary] = useState<PortalSummary | null>(null);
  const [stores, setStores] = useState<PortalStoreRow[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setError(false);
    Promise.all([fetchPortalSummary(range.from, range.to), fetchPortalStores(range.from, range.to)])
      .then(([s, list]) => {
        if (!active) return;
        setSummary(s);
        setStores(list);
      })
      .catch((e) => {
        console.error("Painel do portal:", e);
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [range.from, range.to]);

  // Lojas que pedem atenção: teste acabando, paradas ou sem a 1ª venda.
  const attention = useMemo(() => {
    const items: Array<{ store: PortalStoreRow; text: string }> = [];
    for (const store of stores) {
      if (store.status === "trialing") {
        const days = daysUntil(store.trial_ends_at);
        if (days !== null && days >= 0 && days <= 3) {
          items.push({ store, text: t("partnerPortal.attentionTrial", { days }) });
          continue;
        }
      }
      if (store.status === "active" || store.status === "trialing") {
        const level = usageLevel(store.last_sale_at);
        if (level === "stopped") items.push({ store, text: t("partnerPortal.attentionStopped") });
        else if (level === "never") items.push({ store, text: t("partnerPortal.attentionNever") });
      }
    }
    return items.slice(0, 12);
  }, [stores, t]);

  const chart = (summary?.new_stores_by_month || []).map((m) => ({
    month: formatMonth(m.month),
    [t("partnerPortal.chartNew")]: m.new,
    [t("partnerPortal.chartConverted")]: m.converted,
  }));

  return (
    <div className="space-y-4">
      <DateRangeFilter value={range} onChange={setRange} />
      {error && <p className="text-sm text-destructive">{t("partnerPortal.loadError")}</p>}
      {!summary && !error && <p className="py-10 text-center text-sm text-muted-foreground">{t("partnerPortal.loading")}</p>}
      {summary && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label={t("partnerPortal.storesTotal")} value={summary.stores_total} hint={t("partnerPortal.storesNewHint", { count: summary.stores_new })} />
            <StatCard label={t("partnerPortal.storesTrialing")} value={summary.stores_trialing} />
            <StatCard label={t("partnerPortal.storesActive")} value={summary.stores_active} />
            <StatCard label={t("partnerPortal.storesCancelled")} value={summary.stores_cancelled} />
            <StatCard label={t("partnerPortal.conversions")} value={summary.conversions} />
            <StatCard
              label={t("partnerPortal.conversionRate")}
              value={summary.conversion_rate === null ? "-" : `${String(summary.conversion_rate).replace(".", ",")}%`}
            />
            <StatCard label={t("partnerPortal.mrr")} value={brl(summary.mrr)} />
            <StatCard label={t("partnerPortal.domusRevenue")} value={brl(summary.domus_revenue)} />
            <StatCard label={t("partnerPortal.commissionFirst")} value={brl(summary.commission_first)} />
            <StatCard
              label={t("partnerPortal.commissionRecurring")}
              value={summary.commission_recurring === null ? t("partnerPortal.toDefine") : brl(summary.commission_recurring)}
            />
            <StatCard
              label={t("partnerPortal.storeSales")}
              value={brl(summary.store_sales_total)}
              hint={t("partnerPortal.storeSalesCount", { count: summary.store_sales_count })}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("partnerPortal.estimateNote")}</p>

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="rounded-3xl lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">{t("partnerPortal.chartTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis allowDecimals={false} fontSize={11} width={28} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={t("partnerPortal.chartNew")} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={t("partnerPortal.chartConverted")} fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="rounded-3xl lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">{t("partnerPortal.attentionTitle")}</CardTitle>
                <CardDescription>{t("partnerPortal.attentionDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {attention.length === 0 && <p className="text-sm text-muted-foreground">{t("partnerPortal.attentionEmpty")}</p>}
                {attention.map(({ store, text }) => (
                  <Link key={store.id} to={`/lojas/${store.id}`} className="flex items-center justify-between gap-2 rounded-xl border p-2 hover:bg-muted/50">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{store.name}</span>
                      <span className="block text-xs text-muted-foreground">{text}</span>
                    </span>
                    <StatusBadge status={store.status} />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// detalhe de uma loja no portal de parceiros.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeFilter, StatCard, StatusBadge, useDateRange } from "@/components/partners/PortalBits";
import { brl, fetchPortalStoreDetail, formatDay, formatMonth, type PortalStoreDetail } from "@/lib/partnerPortal";

export default function PartnerStoreDetail() {
  const { t } = useTranslation();
  const { storeId = "" } = useParams();
  const [range, setRange] = useDateRange("30d");
  const [detail, setDetail] = useState<PortalStoreDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setError(false);
    fetchPortalStoreDetail(storeId, range.from, range.to)
      .then((d) => active && setDetail(d))
      .catch((e) => {
        console.error("Detalhe da loja no portal:", e);
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [storeId, range.from, range.to]);

  const back = (
    <Link to="/lojas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> {t("partnerPortal.back")}
    </Link>
  );

  if (error) {
    return (
      <div className="space-y-3">
        {back}
        <p className="text-sm text-destructive">{t("partnerPortal.loadError")}</p>
      </div>
    );
  }
  if (!detail) return <p className="py-10 text-center text-sm text-muted-foreground">{t("partnerPortal.loading")}</p>;

  const { store, sales, products, team, payments, usage, checklist, cancellations } = detail;
  const avgTicket = sales.count ? sales.total / sales.count : 0;
  const sellers = team.filter((m) => m.role === "seller");
  const chart = sales.by_day.map((d) => ({ day: formatDay(d.day).slice(0, 5), total: Number(d.total) }));
  const planName = store.plan ? t(`partnerPortal.plans.${store.plan}`, { defaultValue: store.plan }) : "-";
  const yesNo = (value: boolean) => (value ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-muted-foreground" />);

  return (
    <div className="space-y-4">
      {back}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{store.name}</h1>
          <p className="text-sm text-muted-foreground">
            {t("partnerPortal.storeSince", { date: formatDay(store.created_at) })} ·{" "}
            {t("partnerPortal.couponInfo", { code: store.coupon_code, ambassador: store.ambassador_name })}
            {store.address ? ` · ${store.address}` : ""}
          </p>
        </div>
        <StatusBadge status={store.status} />
      </div>

      <DateRangeFilter value={range} onChange={setRange} />

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-base">{t("partnerPortal.salesTitle")}</CardTitle>
          <CardDescription>{t("partnerPortal.salesHint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label={t("partnerPortal.salesTitle")} value={brl(sales.total)} />
            <StatCard label={t("partnerPortal.salesCount")} value={sales.count} />
            <StatCard label={t("partnerPortal.avgTicket")} value={brl(avgTicket)} />
            <StatCard label={t("partnerPortal.allTime")} value={brl(sales.all_time_total)} />
          </div>
          {chart.length > 0 && (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" fontSize={11} />
                  <YAxis fontSize={11} width={56} tickFormatter={(v) => brl(v).replace(",00", "")} />
                  <Tooltip formatter={(v: number) => brl(v)} />
                  <Area type="monotone" dataKey="total" name={t("partnerPortal.chartSales")} stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">{t("partnerPortal.productsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <StatCard label={t("partnerPortal.productsTotal")} value={products.total} />
            <StatCard label={t("partnerPortal.productsInPeriod")} value={products.in_period} />
            <StatCard label={t("partnerPortal.productsWithPhoto")} value={products.with_photo} />
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">{t("partnerPortal.planTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t("partnerPortal.planCurrent")}</p>
              <p className="font-medium">{planName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("partnerPortal.monthly")}</p>
              <p className="font-medium">{store.monthly_amount ? brl(store.monthly_amount) : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("partnerPortal.trialEnds")}</p>
              <p className="font-medium">{formatDay(store.trial_ends_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("partnerPortal.lastPayment")}</p>
              <p className="font-medium">{formatDay(store.last_payment_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-base">{t("partnerPortal.teamTitle")}</CardTitle>
          <CardDescription>{t("partnerPortal.sellersCount", { count: sellers.length })}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="p-2 text-left">{t("partnerPortal.colName")}</th>
                <th className="p-2 text-left">{t("partnerPortal.colRole")}</th>
                <th className="p-2 text-left">{t("partnerPortal.colJoined")}</th>
                <th className="p-2 text-left">{t("partnerPortal.colActive")}</th>
                <th className="p-2 text-right">{t("partnerPortal.colTeamSales")}</th>
              </tr>
            </thead>
            <tbody>
              {team.map((m, i) => (
                <tr key={`${m.name}-${i}`} className="border-t">
                  <td className="p-2">{m.name}</td>
                  <td className="p-2">{t(`partnerPortal.roleNames.${m.role}`, { defaultValue: m.role })}</td>
                  <td className="p-2">{formatDay(m.joined_at)}</td>
                  <td className="p-2">{yesNo(m.active)}</td>
                  <td className="p-2 text-right tabular-nums">
                    {brl(m.sales_total)} <span className="text-xs text-muted-foreground">({m.sales_count})</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">{t("partnerPortal.paymentsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("partnerPortal.noPayments")}</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="p-2 text-left">{t("partnerPortal.colMonth")}</th>
                    <th className="p-2 text-right">{t("partnerPortal.colAmount")}</th>
                    <th className="p-2 text-right">{t("partnerPortal.colCommission")}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.month} className="border-t">
                      <td className="p-2">
                        {formatMonth(p.month)}
                        {p.seq === 1 && <span className="ml-2 text-xs text-primary">{t("partnerPortal.firstMonth")}</span>}
                      </td>
                      <td className="p-2 text-right tabular-nums">{brl(p.amount)}</td>
                      <td className="p-2 text-right tabular-nums">{p.commission === null ? t("partnerPortal.toDefine") : brl(p.commission)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="mt-2 text-xs text-muted-foreground">{t("partnerPortal.estimateNote")}</p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">{t("partnerPortal.usageTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span>{t("partnerPortal.usageNfce")}</span>
                <b>{usage.nfce_in_period}</b>
              </p>
              <p className="flex justify-between">
                <span>{t("partnerPortal.usageCatalog")}</span>
                <b>{usage.catalog_enabled ? t("partnerPortal.on") : t("partnerPortal.off")}</b>
              </p>
              <p className="flex justify-between">
                <span>{t("partnerPortal.usageInstallments")}</span>
                <b>{usage.installments_total}</b>
              </p>
              <p className="flex justify-between">
                <span>{t("partnerPortal.usageConditional")}</span>
                <b>{usage.conditional_total}</b>
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">{t("partnerPortal.checklistTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              {(["has_products", "first_sale", "nfce", "catalog", "team"] as const).map((key) => (
                <p key={key} className="flex items-center gap-2">
                  {yesNo(checklist[key])} {t(`partnerPortal.check.${key}`)}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {cancellations.length > 0 && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">{t("partnerPortal.cancellationsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {cancellations.map((c, i) => (
              <p key={i}>
                <b>{formatDay(c.created_at)}</b> · {t(`partnerPortal.reasons.${c.reason}`)}
                {c.details ? <span className="text-muted-foreground"> · {c.details}</span> : null}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

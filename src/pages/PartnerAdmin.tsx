// administração do portal (só a Domus): parceiros, embaixadoras,
// cupons e ligação das lojas aos cupons.
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Link2, Pencil, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  adminAutoLink,
  adminLinkStore,
  adminSearchStores,
  fetchAdminList,
  formatDay,
  normalizeCouponCode,
  saveAdminAmbassador,
  saveAdminCoupon,
  saveAdminPartner,
  type AdminAmbassador,
  type AdminCoupon,
  type AdminList,
  type AdminPartner,
  type AdminStoreSearch,
} from "@/lib/partnerPortal";

type Editing =
  | { kind: "partner"; data: Partial<AdminPartner> }
  | { kind: "ambassador"; data: Partial<AdminAmbassador> }
  | { kind: "coupon"; data: Partial<AdminCoupon> }
  | null;

const NONE = "__none__";
const errorText = (e: unknown) => (e as { message?: string })?.message || "";

export default function PartnerAdmin() {
  const { t } = useTranslation();
  const [list, setList] = useState<AdminList | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [saving, setSaving] = useState(false);
  const [linkChoice, setLinkChoice] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<AdminStoreSearch[]>([]);

  const load = useCallback(() => {
    fetchAdminList()
      .then(setList)
      .catch((e) => toast.error(errorText(e) || t("partnerPortal.loadError")));
  }, [t]);

  useEffect(load, [load]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setFound([]);
      return;
    }
    const timer = window.setTimeout(() => {
      adminSearchStores(q).then(setFound).catch(() => setFound([]));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  if (!list) return <p className="py-10 text-center text-sm text-muted-foreground">{t("partnerPortal.loading")}</p>;

  const set = (patch: Record<string, unknown>) =>
    setEditing((cur) => (cur ? ({ ...cur, data: { ...cur.data, ...patch } } as Editing) : cur));

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.kind === "partner") await saveAdminPartner(editing.data);
      if (editing.kind === "ambassador") await saveAdminAmbassador(editing.data);
      if (editing.kind === "coupon") {
        const res = await saveAdminCoupon(editing.data);
        toast.success(t("partnerPortal.couponLinked", { count: res.linked }));
      } else {
        toast.success(t("partnerPortal.saved"));
      }
      setEditing(null);
      load();
    } catch (e) {
      toast.error(errorText(e) || t("partnerPortal.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const autoLink = async () => {
    try {
      const count = await adminAutoLink();
      toast.success(t("partnerPortal.autoLinked", { count }));
      load();
    } catch (e) {
      toast.error(errorText(e) || t("partnerPortal.saveError"));
    }
  };

  const link = async (storeId: string, couponId: string | null) => {
    try {
      await adminLinkStore(storeId, couponId);
      toast.success(t("partnerPortal.linked"));
      load();
      if (query.trim().length >= 2) adminSearchStores(query.trim()).then(setFound).catch(() => undefined);
    } catch (e) {
      toast.error(errorText(e) || t("partnerPortal.saveError"));
    }
  };

  const CouponSelect = ({ storeId }: { storeId: string }) => (
    <div className="flex gap-2">
      <Select value={linkChoice[storeId] || ""} onValueChange={(v) => setLinkChoice((c) => ({ ...c, [storeId]: v }))}>
        <SelectTrigger className="h-8 w-44">
          <SelectValue placeholder={t("partnerPortal.chooseCoupon")} />
        </SelectTrigger>
        <SelectContent>
          {list.coupons.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.code} · {c.ambassador_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" disabled={!linkChoice[storeId]} onClick={() => void link(storeId, linkChoice[storeId])}>
        <Link2 className="mr-1 h-4 w-4" /> {t("partnerPortal.link")}
      </Button>
    </div>
  );

  const field = (key: string, label: string, opts: { type?: string; hint?: string } = {}) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type={opts.type || "text"}
        value={String((editing?.data as Record<string, unknown>)?.[key] ?? "")}
        onChange={(e) => set({ [key]: e.target.value })}
      />
      {opts.hint && <p className="text-xs text-muted-foreground">{opts.hint}</p>}
    </div>
  );

  const editButton = (onClick: () => void) => (
    <Button variant="ghost" size="sm" onClick={onClick}>
      <Pencil className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("partnerPortal.adminTitle")}</h1>
      <Tabs defaultValue="links" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start rounded-2xl">
          <TabsTrigger value="links">{t("partnerPortal.tabLinks")}</TabsTrigger>
          <TabsTrigger value="partners">{t("partnerPortal.tabPartners")}</TabsTrigger>
          <TabsTrigger value="ambassadors">{t("partnerPortal.tabAmbassadors")}</TabsTrigger>
          <TabsTrigger value="coupons">{t("partnerPortal.tabCoupons")}</TabsTrigger>
        </TabsList>

        <TabsContent value="partners">
          <Card className="rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t("partnerPortal.tabPartners")}</CardTitle>
              <Button size="sm" onClick={() => setEditing({ kind: "partner", data: { active: true } })}>
                <Plus className="mr-1 h-4 w-4" /> {t("partnerPortal.new")}
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <tbody>
                  {list.partners.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2 font-medium">{p.name}</td>
                      <td className="p-2">{p.email || "-"}</td>
                      <td className="p-2">{p.phone || "-"}</td>
                      <td className="p-2">{p.active ? t("partnerPortal.yes") : t("partnerPortal.no")}</td>
                      <td className="p-2 text-right">{editButton(() => setEditing({ kind: "partner", data: p }))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ambassadors">
          <Card className="rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t("partnerPortal.tabAmbassadors")}</CardTitle>
              <Button size="sm" onClick={() => setEditing({ kind: "ambassador", data: { active: true } })}>
                <Plus className="mr-1 h-4 w-4" /> {t("partnerPortal.new")}
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="p-2 text-left">{t("partnerPortal.name")}</th>
                    <th className="p-2 text-left">{t("partnerPortal.email")}</th>
                    <th className="p-2 text-left">{t("partnerPortal.partner")}</th>
                    <th className="p-2 text-left">%</th>
                    <th className="p-2 text-right">{t("partnerPortal.storesCount")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.ambassadors.map((a) => (
                    <tr key={a.id} className={`border-t ${a.active ? "" : "opacity-50"}`}>
                      <td className="p-2 font-medium">{a.name}</td>
                      <td className="p-2">{a.email || "-"}</td>
                      <td className="p-2">{a.partner_name || "-"}</td>
                      <td className="p-2">{a.recurring_percent ?? t("partnerPortal.toDefine")}</td>
                      <td className="p-2 text-right">{a.stores}</td>
                      <td className="p-2 text-right">{editButton(() => setEditing({ kind: "ambassador", data: a }))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coupons">
          <Card className="rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t("partnerPortal.tabCoupons")}</CardTitle>
              <Button
                size="sm"
                disabled={list.ambassadors.length === 0}
                onClick={() => setEditing({ kind: "coupon", data: { active: true } })}
                title={list.ambassadors.length === 0 ? t("partnerPortal.needAmbassador") : undefined}
              >
                <Plus className="mr-1 h-4 w-4" /> {t("partnerPortal.new")}
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <tbody>
                  {list.coupons.map((c) => (
                    <tr key={c.id} className={`border-t ${c.active ? "" : "opacity-50"}`}>
                      <td className="p-2 font-mono font-medium">{c.code}</td>
                      <td className="p-2">{c.ambassador_name}</td>
                      <td className="p-2">{c.expires_at ? formatDay(c.expires_at) : "-"}</td>
                      <td className="p-2 text-right">
                        {c.stores} {t("partnerPortal.storesCount").toLowerCase()}
                      </td>
                      <td className="p-2 text-right">{editButton(() => setEditing({ kind: "coupon", data: c }))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card className="rounded-3xl">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">{t("partnerPortal.unlinkedTitle")}</CardTitle>
                <CardDescription>{t("partnerPortal.unlinkedDesc")}</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => void autoLink()}>
                <RefreshCw className="mr-1 h-4 w-4" /> {t("partnerPortal.autoLink")}
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {list.unlinked.length === 0 ? (
                <p className="text-sm text-muted-foreground">-</p>
              ) : (
                <table className="w-full min-w-[620px] text-sm">
                  <tbody>
                    {list.unlinked.map((s) => (
                      <tr key={s.id} className="border-t">
                        <td className="p-2 font-medium">
                          {s.name}
                          <span className="block text-xs text-muted-foreground">{formatDay(s.created_at)}</span>
                        </td>
                        <td className="p-2">
                          <span className="text-xs text-muted-foreground">{t("partnerPortal.typed")}:</span> <span className="font-mono">{s.cupom}</span>
                        </td>
                        <td className="p-2">
                          <CouponSelect storeId={s.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">{t("partnerPortal.searchStoreTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder={t("partnerPortal.searchStore")} value={query} onChange={(e) => setQuery(e.target.value)} />
              {found.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-sm">
                    <tbody>
                      {found.map((s) => (
                        <tr key={s.id} className="border-t">
                          <td className="p-2 font-medium">
                            {s.name}
                            {s.cupom && <span className="block font-mono text-xs text-muted-foreground">{s.cupom}</span>}
                          </td>
                          <td className="p-2 text-xs">
                            {t("partnerPortal.currentCoupon")}: <b>{s.coupon_code || t("partnerPortal.none")}</b>
                          </td>
                          <td className="p-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <CouponSelect storeId={s.id} />
                              {s.coupon_code && (
                                <Button size="sm" variant="ghost" onClick={() => void link(s.id, null)}>
                                  {t("partnerPortal.unlink")}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing?.data && "id" in editing.data && editing.data.id ? t("partnerPortal.edit") : t("partnerPortal.new")} ·{" "}
              {editing?.kind === "partner"
                ? t("partnerPortal.partner")
                : editing?.kind === "ambassador"
                  ? t("partnerPortal.ambassador")
                  : t("partnerPortal.code")}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              {editing.kind === "partner" && (
                <>
                  {field("name", t("partnerPortal.name"))}
                  {field("email", t("partnerPortal.email"), { type: "email", hint: t("partnerPortal.emailHint") })}
                  {field("phone", t("partnerPortal.phone"))}
                  {field("document", t("partnerPortal.document"))}
                  {field("notes", t("partnerPortal.notes"))}
                </>
              )}
              {editing.kind === "ambassador" && (
                <>
                  {field("name", t("partnerPortal.name"))}
                  {field("email", t("partnerPortal.email"), { type: "email", hint: t("partnerPortal.emailHint") })}
                  {field("phone", t("partnerPortal.phone"))}
                  <div className="space-y-1">
                    <Label>{t("partnerPortal.partner")}</Label>
                    <Select value={(editing.data as AdminAmbassador).partner_id || NONE} onValueChange={(v) => set({ partner_id: v === NONE ? null : v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>{t("partnerPortal.noPartner")}</SelectItem>
                        {list.partners.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {field("recurring_percent", t("partnerPortal.recurringPercent"), { type: "number", hint: t("partnerPortal.recurringHint") })}
                </>
              )}
              {editing.kind === "coupon" && (
                <>
                  <div className="space-y-1">
                    <Label>{t("partnerPortal.code")}</Label>
                    <Input
                      value={String((editing.data as AdminCoupon).code || "")}
                      onChange={(e) => set({ code: normalizeCouponCode(e.target.value) })}
                      className="font-mono uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{t("partnerPortal.ambassador")}</Label>
                    <Select value={(editing.data as AdminCoupon).ambassador_id || ""} onValueChange={(v) => set({ ambassador_id: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {list.ambassadors.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {field("expires_at", t("partnerPortal.expiresAt"), { type: "date" })}
                </>
              )}
              <label className="flex items-center justify-between rounded-xl border p-3 text-sm">
                {t("partnerPortal.active")}
                <Switch checked={editing.data.active !== false} onCheckedChange={(v) => set({ active: v })} />
              </label>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditing(null)}>
                  {t("partnerPortal.cancel")}
                </Button>
                <Button className="flex-1" onClick={() => void save()} disabled={saving}>
                  {t("partnerPortal.save")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

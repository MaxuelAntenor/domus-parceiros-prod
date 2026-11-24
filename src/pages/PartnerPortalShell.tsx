// Casca do portal de parceiros: login por link no e-mail, quem é a
// pessoa (admin, parceiro ou embaixadora), menu e rotas.
import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Session } from "@supabase/supabase-js";
import { Handshake, LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchPortalMe, requestPortalLogin, type PortalMe } from "@/lib/partnerPortal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PartnerDashboard from "./PartnerDashboard";
import PartnerStores from "./PartnerStores";
import PartnerStoreDetail from "./PartnerStoreDetail";
import PartnerCancellations from "./PartnerCancellations";
import PartnerAdmin from "./PartnerAdmin";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const send = async () => {
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setMessage({ ok: false, text: t("partnerPortal.invalidEmail") });
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      await requestPortalLogin(clean, `${window.location.origin}/`);
      setMessage({ ok: true, text: t("partnerPortal.linkSent") });
    } catch {
      setMessage({ ok: false, text: t("partnerPortal.loginError") });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md rounded-3xl">
        <CardHeader>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Handshake className="h-4 w-4" /> Domus BI
          </p>
          <CardTitle>{t("partnerPortal.loginTitle")}</CardTitle>
          <CardDescription>{t("partnerPortal.loginDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="partner-email">{t("partnerPortal.emailLabel")}</Label>
            <Input
              id="partner-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void send()}
            />
          </div>
          <Button className="w-full" onClick={() => void send()} disabled={sending}>
            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {sending ? t("partnerPortal.sending") : t("partnerPortal.sendLink")}
          </Button>
          {message && <p className={`text-sm ${message.ok ? "text-emerald-600" : "text-destructive"}`}>{message.text}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PartnerPortalShell() {
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [me, setMe] = useState<PortalMe | null>(null);
  const [meError, setMeError] = useState(false);

  useEffect(() => {
    document.title = `${t("partnerPortal.title")} | Domus BI`;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, [t]);

  useEffect(() => {
    if (!session) {
      setMe(null);
      return;
    }
    setMeError(false);
    fetchPortalMe()
      .then(setMe)
      .catch((error) => {
        console.error("Portal de parceiros:", error);
        setMeError(true);
      });
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const logout = async () => {
    await supabase.auth.signOut();
    setMe(null);
  };

  if (session === undefined || (session && !me && !meError)) {
    return <div className="py-24 text-center text-sm text-muted-foreground">{t("partnerPortal.loading")}</div>;
  }
  if (!session) return <LoginScreen />;

  if (meError || !me?.role) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader>
            <CardTitle>{t("partnerPortal.noAccessTitle")}</CardTitle>
            <CardDescription>
              {meError ? t("partnerPortal.loadError") : t("partnerPortal.noAccessDesc", { email: me?.email || session.user.email })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => void logout()}>
              <LogOut className="mr-2 h-4 w-4" /> {t("partnerPortal.logout")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-1.5 text-sm transition ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`;

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <Handshake className="h-4 w-4" /> {t("partnerPortal.title")}
            </p>
            <p className="truncate text-sm">
              <b>{me.name || me.email}</b> · {t(`partnerPortal.roles.${me.role}`)}
              {me.coupons.length > 0 && (
                <span className="text-muted-foreground"> · {t("partnerPortal.yourCoupons", { codes: me.coupons.join(", ") })}</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={navClass}>
              {t("partnerPortal.navDashboard")}
            </NavLink>
            <NavLink to="/lojas" className={navClass}>
              {t("partnerPortal.navStores")}
            </NavLink>
            <NavLink to="/cancelamentos" className={navClass}>
              {t("partnerPortal.navCancellations")}
            </NavLink>
            {me.role === "admin" && (
              <NavLink to="/admin" className={navClass}>
                {t("partnerPortal.navAdmin")}
              </NavLink>
            )}
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              <LogOut className="mr-1 h-4 w-4" /> {t("partnerPortal.logout")}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">
        <Routes>
          <Route path="/" element={<PartnerDashboard />} />
          <Route path="/lojas" element={<PartnerStores />} />
          <Route path="/lojas/:storeId" element={<PartnerStoreDetail />} />
          <Route path="/cancelamentos" element={<PartnerCancellations isAdmin={me.role === "admin"} />} />
          {me.role === "admin" && <Route path="/admin" element={<PartnerAdmin />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

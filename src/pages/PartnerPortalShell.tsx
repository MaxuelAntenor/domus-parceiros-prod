// Casca do portal de parceiros: login por link no e-mail, quem é a
// pessoa (admin, parceiro ou embaixadora), menu e rotas.
import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Session } from "@supabase/supabase-js";
import { Handshake, KeyRound, LogOut, Loader2 } from "lucide-react";
import { openedFromRecoveryLink, supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { MIN_PASSWORD, fetchPortalMe, sendPasswordReset, signInPortal, updatePassword, type PortalMe } from "@/lib/partnerPortal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setMessage({ ok: false, text: t("partnerPortal.invalidEmail") });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "login") {
        await signInPortal(clean, password);
      } else {
        await sendPasswordReset(clean);
        setMessage({ ok: true, text: t("partnerPortal.resetSent") });
      }
    } catch (error) {
      const text = String((error as { message?: string })?.message || "").toLowerCase();
      setMessage({
        ok: false,
        text: mode === "login" && text.includes("invalid") ? t("partnerPortal.loginInvalid") : t("partnerPortal.loginError"),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md rounded-3xl">
        <CardHeader>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Handshake className="h-4 w-4" /> Domus BI
          </p>
          <CardTitle>{mode === "login" ? t("partnerPortal.loginTitle") : t("partnerPortal.forgotTitle")}</CardTitle>
          <CardDescription>{mode === "login" ? t("partnerPortal.loginDesc") : t("partnerPortal.forgotDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="partner-email">{t("partnerPortal.emailLabel")}</Label>
              <Input id="partner-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {mode === "login" && (
              <div className="space-y-1">
                <Label htmlFor="partner-password">{t("partnerPortal.passwordLabel")}</Label>
                <Input
                  id="partner-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={busy || (mode === "login" && !password)}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? t("partnerPortal.signIn") : t("partnerPortal.sendReset")}
            </Button>
            {message && <p className={`text-sm ${message.ok ? "text-emerald-600" : "text-destructive"}`}>{message.text}</p>}
            <button
              type="button"
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
              onClick={() => {
                setMode(mode === "login" ? "forgot" : "login");
                setMessage(null);
              }}
            >
              {mode === "login" ? t("partnerPortal.forgotPassword") : t("partnerPortal.backToLogin")}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/** Senha nova: depois do link de "Esqueci minha senha" ou pelo botão Trocar senha. */
function SetPasswordForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (password.length < MIN_PASSWORD) {
      setError(t("partnerPortal.passwordShort", { count: MIN_PASSWORD }));
      return;
    }
    if (password !== confirm) {
      setError(t("partnerPortal.passwordMismatch"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await updatePassword(password);
      toast.success(t("partnerPortal.passwordSaved"));
      onDone();
    } catch {
      setError(t("partnerPortal.saveError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="new-password">{t("partnerPortal.newPassword")}</Label>
        <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="confirm-password">{t("partnerPortal.confirmPassword")}</Label>
        <Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("partnerPortal.savePassword")}
      </Button>
    </form>
  );
}

export default function PartnerPortalShell() {
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [me, setMe] = useState<PortalMe | null>(null);
  const [meError, setMeError] = useState(false);
  // veio do link de "Esqueci minha senha": pede a senha nova antes de tudo
  const [recovery, setRecovery] = useState(openedFromRecoveryLink);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    document.title = `${t("partnerPortal.title")} | Domus BI`;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setSession(next);
    });
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

  if (recovery) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader>
            <CardTitle>{t("partnerPortal.newPasswordTitle")}</CardTitle>
            <CardDescription>{t("partnerPortal.newPasswordDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SetPasswordForm onDone={() => setRecovery(false)} />
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <Button variant="ghost" size="sm" onClick={() => setChangingPassword(true)}>
              <KeyRound className="mr-1 h-4 w-4" /> {t("partnerPortal.changePassword")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              <LogOut className="mr-1 h-4 w-4" /> {t("partnerPortal.logout")}
            </Button>
          </div>
        </div>
      </header>
      <Dialog open={changingPassword} onOpenChange={setChangingPassword}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("partnerPortal.changePassword")}</DialogTitle>
          </DialogHeader>
          <SetPasswordForm onDone={() => setChangingPassword(false)} />
        </DialogContent>
      </Dialog>
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

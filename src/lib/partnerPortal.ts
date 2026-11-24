// portal de parceiros e embaixadoras. Chamadas às RPCs
// (partner_portal_*, partner_admin_*), tipos e contas da tela.
import { supabase } from "@/lib/supabase";

export type PortalRole = "admin" | "partner" | "ambassador" | null;

export type PortalMe = {
  email: string | null;
  role: PortalRole;
  name: string | null;
  coupons: string[];
  recurring_percent: number | null;
};

export type StoreStatus = "trialing" | "active" | "lifetime" | "cancelled" | "expired" | "deleted" | "unknown";

export type PortalSummary = {
  period: { from: string; to: string };
  stores_total: number;
  stores_trialing: number;
  stores_active: number;
  stores_cancelled: number;
  stores_new: number;
  conversions: number;
  conversion_rate: number | null;
  mrr: number;
  domus_revenue: number;
  commission_first: number;
  commission_recurring: number | null;
  store_sales_total: number;
  store_sales_count: number;
  new_stores_by_month: Array<{ month: string; new: number; converted: number }>;
};

export type PortalStoreRow = {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
  status: StoreStatus;
  plan: string | null;
  trial_ends_at: string | null;
  monthly_amount: number | null;
  coupon_code: string;
  ambassador_name: string;
  partner_name: string | null;
  months_paid: number;
  paid_total: number;
  first_paid_month: string | null;
  last_sale_at: string | null;
  sales_total: number;
  products_total: number;
  sellers_count: number;
};

export type PortalStoreDetail = {
  store: {
    id: string;
    name: string;
    address: string | null;
    created_at: string;
    status: StoreStatus;
    plan: string | null;
    trial_ends_at: string | null;
    subscription_starts_at: string | null;
    monthly_amount: number | null;
    last_payment_at: string | null;
    coupon_code: string;
    ambassador_name: string;
    partner_name: string | null;
    linked_at: string;
  };
  period: { from: string; to: string };
  sales: { total: number; count: number; all_time_total: number; by_day: Array<{ day: string; total: number; count: number }> };
  products: { total: number; in_period: number; with_photo: number };
  team: Array<{ name: string; role: string; active: boolean; joined_at: string | null; sales_total: number; sales_count: number }>;
  payments: Array<{ month: string; amount: number; seq: number; commission: number | null }>;
  usage: { nfce_in_period: number; catalog_enabled: boolean; installments_total: number; conditional_total: number };
  checklist: { has_products: boolean; first_sale: boolean; nfce: boolean; catalog: boolean; team: boolean };
  cancellations: Array<{ reason: CancellationReason; details: string | null; created_at: string }>;
};

export const CANCELLATION_REASONS = [
  "price",
  "missing_feature",
  "hard_to_use",
  "closed_store",
  "other_system",
  "support",
  "just_testing",
  "other",
] as const;
export type CancellationReason = (typeof CANCELLATION_REASONS)[number];

export type PortalCancellation = {
  id: string;
  name: string;
  plan: string | null;
  status: StoreStatus;
  created_at: string;
  ended_at: string | null;
  days_active: number;
  coupon_code: string;
  ambassador_name: string;
  months_paid: number;
  paid_total: number;
  reason: { reason: CancellationReason; details: string | null } | null;
};

export type AdminPartner = { id: string; name: string; email: string | null; phone: string | null; document: string | null; notes: string | null; active: boolean };
export type AdminAmbassador = {
  id: string;
  partner_id: string | null;
  partner_name: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  recurring_percent: number | null;
  active: boolean;
  stores: number;
};
export type AdminCoupon = { id: string; ambassador_id: string; ambassador_name: string; code: string; active: boolean; expires_at: string | null; stores: number };
export type AdminUnlinked = { id: string; name: string; cupom: string; created_at: string };
export type AdminList = { partners: AdminPartner[]; ambassadors: AdminAmbassador[]; coupons: AdminCoupon[]; unlinked: AdminUnlinked[] };
export type AdminStoreSearch = { id: string; name: string; cupom: string | null; created_at: string; coupon_code: string | null };

const call = async <T>(fn: string, args: Record<string, unknown> = {}): Promise<T> => {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return data as T;
};

export const fetchPortalMe = () => call<PortalMe>("partner_portal_me");
export const fetchPortalSummary = (from: string, to: string) => call<PortalSummary>("partner_portal_summary", { p_from: from, p_to: to });
export const fetchPortalStores = async (from: string, to: string) =>
  (await call<PortalStoreRow[] | null>("partner_portal_stores", { p_from: from, p_to: to })) || [];
export const fetchPortalStoreDetail = (storeId: string, from: string, to: string) =>
  call<PortalStoreDetail>("partner_portal_store_detail", { p_store_id: storeId, p_from: from, p_to: to });
export const fetchPortalCancellations = (from: string, to: string) =>
  call<{ items: PortalCancellation[]; by_reason: Record<string, number> }>("partner_portal_cancellations", { p_from: from, p_to: to });

export const fetchAdminList = () => call<AdminList>("partner_admin_list");
export const saveAdminPartner = (data: Partial<AdminPartner>) => call<string>("partner_admin_save_partner", { p_data: data });
export const saveAdminAmbassador = (data: Partial<AdminAmbassador>) => call<string>("partner_admin_save_ambassador", { p_data: data });
export const saveAdminCoupon = (data: Partial<AdminCoupon>) =>
  call<{ id: string; code: string; linked: number }>("partner_admin_save_coupon", { p_data: data });
export const adminAutoLink = () => call<number>("partner_admin_auto_link");
export const adminLinkStore = (storeId: string, couponId: string | null) =>
  call<void>("partner_admin_link_store", { p_store_id: storeId, p_coupon_id: couponId });
export const adminSearchStores = async (query: string) =>
  (await call<AdminStoreSearch[] | null>("partner_admin_search_stores", { p_query: query })) || [];

export const saveCancellationReason = (storeId: string, reason: CancellationReason, details: string) =>
  call<void>("save_cancellation_reason", { p_store_id: storeId, p_reason: reason, p_details: details || null });
export const fetchCancellationReasonPending = (storeId: string) =>
  call<boolean>("get_cancellation_reason_pending", { p_store_id: storeId });

// ---------------------------------------------------------------- acesso

/** Entra com e-mail e senha (mesma conta do Supabase da Domus). */
export const signInPortal = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw error;
};

/** "Esqueci minha senha": manda o link para criar uma senha nova. */
export const sendPasswordReset = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/`,
  });
  if (error) throw error;
};

export const updatePassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
};

/**
 * Administração: cria o acesso de um parceiro/embaixadora (edge function
 * partner-portal-create-access). Devolve a senha provisória, ou exists
 * quando o e-mail já tem conta (a senha não é trocada).
 */
export const createPortalAccess = async (email: string) => {
  const { data, error } = await supabase.functions.invoke("partner-portal-create-access", { body: { email } });
  if (error) {
    let message = "";
    try {
      message = (await (error as { context?: Response }).context?.json())?.error || "";
    } catch {
      message = "";
    }
    throw new Error(message || error.message);
  }
  return data as { created?: boolean; password?: string; exists?: boolean };
};

export const MIN_PASSWORD = 8;

/** "MARIA 10" -> "MARIA10" (igual ao normalize_coupon_code do banco). */
export const normalizeCouponCode = (value: string) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

export const validateCoupon = (code: string) => call<boolean>("validate_partner_coupon", { p_code: code });

// ---------------------------------------------------------------- datas

const pad = (n: number) => String(n).padStart(2, "0");
export const isoDay = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export type RangePreset = "today" | "7d" | "30d" | "thisMonth" | "lastMonth" | "12m";
export const RANGE_PRESETS: RangePreset[] = ["today", "7d", "30d", "thisMonth", "lastMonth", "12m"];

export const presetRange = (preset: RangePreset, now: Date = new Date()): { from: string; to: string } => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const minus = (days: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
  switch (preset) {
    case "today":
      return { from: isoDay(today), to: isoDay(today) };
    case "7d":
      return { from: isoDay(minus(6)), to: isoDay(today) };
    case "thisMonth":
      return { from: isoDay(new Date(today.getFullYear(), today.getMonth(), 1)), to: isoDay(today) };
    case "lastMonth":
      return {
        from: isoDay(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        to: isoDay(new Date(today.getFullYear(), today.getMonth(), 0)),
      };
    case "12m":
      return { from: isoDay(new Date(today.getFullYear() - 1, today.getMonth(), today.getDate() + 1)), to: isoDay(today) };
    case "30d":
    default:
      return { from: isoDay(minus(29)), to: isoDay(today) };
  }
};

export const brl = (value: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

export const formatDay = (value: string | null | undefined) => {
  if (!value) return "-";
  const iso = String(value).slice(0, 10);
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : "-";
};

export const formatMonth = (value: string | null | undefined) => {
  if (!value) return "-";
  const [y, m] = String(value).slice(0, 7).split("-");
  return y && m ? `${m}/${y}` : "-";
};

/** Dias até uma data (negativo = já passou). */
export const daysUntil = (value: string | null | undefined, now: Date = new Date()) => {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
};

/** Termômetro de uso pela última venda. */
export const usageLevel = (lastSaleAt: string | null | undefined, now: Date = new Date()): "active" | "low" | "stopped" | "never" => {
  if (!lastSaleAt) return "never";
  const days = (now.getTime() - new Date(lastSaleAt).getTime()) / 86_400_000;
  if (days <= 3) return "active";
  if (days <= 14) return "low";
  return "stopped";
};

/** CSV com ; (abre direto no Excel em português). */
export const toCsv = (rows: Array<Record<string, unknown>>, columns: Array<{ key: string; label: string }>) => {
  const cell = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [columns.map((c) => cell(c.label)).join(";"), ...rows.map((row) => columns.map((c) => cell(row[c.key])).join(";"))].join("\r\n");
};

export const downloadCsv = (fileName: string, content: string) => {
  const blob = new Blob([`﻿${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
};

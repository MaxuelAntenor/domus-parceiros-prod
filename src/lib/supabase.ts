import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;

// Lido antes do cliente do Supabase limpar o endereço: veio do link de
// "Esqueci minha senha"?
export const openedFromRecoveryLink = typeof window !== "undefined" && /type=recovery/.test(window.location.hash);

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl || "https://invalid.supabase.co", supabaseAnonKey || "invalid", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

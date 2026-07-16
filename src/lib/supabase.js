import { createClient } from "@supabase/supabase-js";

// Chave publicável (segura para o front-end — protegida por RLS no banco).
// Pode ser sobrescrita por variáveis de ambiente na Vercel.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rklhlorhfgpueffsqfod.supabase.co";
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_BAkREDMOBuQjwfGDWEtAkQ_bx_xAoud";

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

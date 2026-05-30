import { createClient } from "@supabase/supabase-js";

declare global {
  interface Window {
    __APP_CONFIG__?: {
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      VITE_SUPABASE_PUBLISHABLE_KEY?: string;
    };
  }
}

const runtimeConfig = typeof window !== "undefined" ? window.__APP_CONFIG__ : undefined;

const SUPABASE_URL =
  runtimeConfig?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;

const SUPABASE_ANON_KEY =
  runtimeConfig?.VITE_SUPABASE_ANON_KEY ||
  runtimeConfig?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isSupabaseConfigured) {
  console.error(
    "Supabase runtime config is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

const safeUrl = SUPABASE_URL || "https://placeholder.supabase.co";
const safeKey = SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

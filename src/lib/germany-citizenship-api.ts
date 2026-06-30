// Vatandaşlık Testi (Almanya) — soru havuzu okuma (germany_citizenship_questions).
// Supabase RLS public read (anon+authenticated). Skorlama/oturum YOK; tüm test mantığı istemcide.

import { supabase } from "@/integrations/supabase/client";

export interface CitizenshipQuestion {
  id: number;
  soru_almanca: string;
  soru_turkce: string;
  secenekler: Record<string, string>;
  dogru_cevap: string;
  eyalet: string;
  image_url: string | null;
}

// supabase/types.ts bu tabloyu henüz içermiyor (regen sonrası gelir) → as any (relocation-api deseni).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const TABLE = "germany_citizenship_questions";

/** Genel (eyalet bağımsız) soru havuzu. */
export async function listGeneralQuestions(): Promise<CitizenshipQuestion[]> {
  const { data, error } = await db
    .from(TABLE)
    .select("*")
    .eq("eyalet", "Genel")
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CitizenshipQuestion[];
}

/** Bir eyalete özel sorular. */
export async function listStateQuestions(eyalet: string): Promise<CitizenshipQuestion[]> {
  const { data, error } = await db
    .from(TABLE)
    .select("*")
    .eq("eyalet", eyalet)
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CitizenshipQuestion[];
}

/** Mevcut eyalet adları (Genel hariç). */
export async function listStates(): Promise<string[]> {
  const { data, error } = await db.from(TABLE).select("eyalet").neq("eyalet", "Genel");
  if (error) throw error;
  const set = new Set<string>((data ?? []).map((r: { eyalet: string }) => r.eyalet));
  return [...set].sort((a, b) => a.localeCompare(b, "de"));
}

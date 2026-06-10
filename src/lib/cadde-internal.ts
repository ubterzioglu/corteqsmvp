// Cadde API katmanının paylaşılan iç yardımcıları.
// Bu modül barrel'dan (cadde.ts) DIŞA AÇILMAZ; yalnız cadde-api / cadde-admin-api kullanır.

import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

// Generated types (B1) güncel olmadığı için cadde_* tabloları typed client ile uyuşmayabilir.
// Tek izole cast burada tutulur; B1 çözülünce kaldırılacak.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

export const FALLBACK_PROFILE_NAME = "CorteQS Üyesi";
export const CADDE_PAGE_SIZE = 20;

const TOAST_THROTTLE_MS = 10_000;
let lastErrorToastAt = 0;

/**
 * cadde_api_error telemetrisi: hata asla sessizce yutulmaz.
 * console.error her zaman; kullanıcıya throttle'lı tek bir Sonner toast'u gösterilir
 * (aynı sayfadaki 6 paralel query'nin toast yağmuru yapmaması için).
 */
export function reportCaddeApiError(context: string, error: unknown): void {
  console.error(`[cadde_api_error] ${context}`, error);
  const now = Date.now();
  if (now - lastErrorToastAt >= TOAST_THROTTLE_MS) {
    lastErrorToastAt = now;
    toast.error("Cadde verileri yüklenirken sorun oluştu", {
      description: "Bazı içerikler geçici olarak görüntülenemiyor. Lütfen sayfayı yenileyin.",
    });
  }
}

export async function resolveCountryIdByName(countryName: string | null | undefined): Promise<string | null> {
  const trimmed = countryName?.trim() ?? "";
  if (!trimmed) return null;
  const { data } = await db.from("cadde_countries").select("id").eq("name", trimmed).maybeSingle();
  return data?.id ?? null;
}

export async function resolveCityIdByName(cityName: string | null | undefined, countryId: string | null): Promise<string | null> {
  const trimmed = cityName?.trim() ?? "";
  if (!trimmed) return null;
  let query = db.from("cadde_cities").select("id").eq("name", trimmed);
  if (countryId) query = query.eq("country_id", countryId);
  const { data } = await query.maybeSingle();
  return data?.id ?? null;
}

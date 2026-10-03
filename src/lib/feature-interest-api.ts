// M10 · Kilitli ücretli yüzey ilgisi — `feature_interest` istemcisi.
//
// Ücretli taraf (öne çıkarma · bilet) YAPILMIYOR (Stripe ayrı plan); bu modül
// yalnız KİLİTLİ kartın ilgi kaydını taşır. Plan: "ücretli tarafın ne zaman
// yapılacağına bu tablo karar verecek."
//
// ⚠️ types.ts regen BORCU: feature_interest üretilmiş tiplerde YOK — `as never`
// bilinçli. RPC hataları DÜZ NESNE (m75).
import { supabase } from "@/integrations/supabase/client";

/**
 * Beyaz liste — migration `register_feature_interest` ile BİREBİR (ayna testi
 * iki yönü de kilitler). M20 `pro.inbox`'ı EKLERKEN burayı da genişletir.
 * ⚠️ ajan ihtiyatı: anahtar adları planın Türkçe yüzey adlarından türetildi.
 */
export const FEATURE_INTEREST_KEYS = ["event.featured", "event.ticketing"] as const;
export type FeatureInterestKey = (typeof FEATURE_INTEREST_KEYS)[number];

export const FEATURE_INTEREST_ERROR_MESSAGES: Record<string, string> = {
  feature_interest_auth_required: "İlgi kaydı için giriş yapmalısın.",
  feature_interest_unknown_key: "Bilinmeyen özellik anahtarı.",
};

/** Girişli kullanıcının ilgi kayıtları (RLS: kendi satırları). */
export async function fetchMyFeatureInterests(): Promise<string[]> {
  const { data, error } = await supabase
    .from("feature_interest" as never)
    .select("feature_key")
    .limit(50);
  if (error) return []; // ikincil yüzey: kart "kayıtsız" görünür, sayfa çökmez
  return ((data ?? []) as Array<{ feature_key: string }>).map((row) => row.feature_key);
}

/** İlgi kaydı (idempotent — sunucu aynı ilgiyi ikinci kez saymaz). */
export async function registerFeatureInterest(featureKey: FeatureInterestKey): Promise<boolean> {
  const { data, error } = await supabase.rpc("register_feature_interest" as never, {
    p_feature_key: featureKey,
  } as never);

  if (error) {
    const message =
      FEATURE_INTEREST_ERROR_MESSAGES[error.message ?? ""] ??
      "İlgi kaydı alınamadı. Lütfen tekrar dene.";
    throw new Error(message);
  }
  return Boolean((data as { registered?: boolean } | null)?.registered);
}

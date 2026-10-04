// M19 · Tavsiye İste modülü kuralları — TEK KAYNAK (desen: events-rules.ts / cadde-rules.ts).
//
// İKİ iş:
//   1. SABİT AYNALARI: M17/M18 migration'larındaki doğrulama sabitleri (başlık/gövde
//      uzunluğu, diaspora kümesi) — YALNIZ UI metinleri/istemci ön-kontrol için.
//      Yetki/karar SQL'dedir (create_recommendation_request_v1 · answer_recommendation_v1);
//      buradaki sabit değişirse `recommendations-rules.test.ts` migration metniyle
//      birebir karşılaştırır ve düşer (ayna sözleşme).
//   2. HATA HARİTASI: tavsiye RPC'lerinin (M17 create/answer + M18 match) raise
//      kodları → kullanıcı Türkçesi. ⚠️ RPC hataları supabase-js'te DÜZ NESNEDİR
//      (`instanceof Error` ile daraltma YASAK — m75/cadde dersi); çözümleyici
//      message/details/hint metninden kodu alt diziyle tarar.
//
// Kodlar İKİ migration'dan gelir: M17 (20261003140000) + M18 (20261003150000).
// Yeni `recommendation_` kodu ekleyen migration bu haritayı da günceller
// (çift yönlü ayna testi kilitler — events-first-approval.test deseni).

/** M17 `create_recommendation_request_v1`: `length(v_title) > 160` aynası. */
export const RECOMMENDATION_TITLE_MAX = 160;
/** M17 create + answer: `length(v_body) > 4000` aynası. */
export const RECOMMENDATION_BODY_MAX = 4000;
/** M17 diaspora CHECK + create doğrulaması: `('tr','in','cn','ph')` aynası (cadde ile aynı). */
export const RECOMMENDATION_DIASPORA_KEYS = ["tr", "in", "cn", "ph"] as const;
/** M18 `match_recommendation_professionals` varsayılan limit aynası. */
export const RECOMMENDATION_MATCH_DEFAULT_LIMIT = 25;

/** Tavsiye RPC hata kodları → Türkçe (M17 + M18 kodlarının tamamı). */
export const RECOMMENDATION_RPC_ERROR_MESSAGES: Record<string, string> = {
  // M17 — create_recommendation_request_v1 + answer_recommendation_v1
  recommendation_auth_required: "Bu işlem için giriş yapmalısın.",
  recommendation_banned:
    "Hesabın bu işlem için kısıtlanmış. Destek ekibiyle iletişime geçebilirsin.",
  recommendation_invalid_diaspora: "Geçersiz diaspora anahtarı.",
  recommendation_invalid_title: `Başlık zorunlu ve en fazla ${RECOMMENDATION_TITLE_MAX} karakter olmalı.`,
  recommendation_invalid_body: `Açıklama zorunlu ve en fazla ${RECOMMENDATION_BODY_MAX} karakter olmalı.`,
  recommendation_request_not_found: "Tavsiye talebi bulunamadı.",
  recommendation_request_closed: "Bu talep kapatılmış; yeni yanıt kabul etmiyor.",
  // İnceleme W3 (mig 20261004220000): sahip kendi talebini yanıtlayamaz —
  // kendi yanıtı open→answered çevirip talebi varsayılan listeden düşürüyordu.
  recommendation_self_answer: "Kendi talebine yanıt yazamazsın.",
  // İnceleme F11 (mig 20261004240000): ikinci yanıt ön kontrolde TEK kodla
  // reddedilir — ham 23505 genel "tekrar dene" mesajına düşüp retry'a davet
  // ediyordu (unique constraint ikinci savunma hattı olarak duruyor).
  recommendation_already_answered: "Bu talebe yanıtını zaten gönderdin.",
};

const RECOMMENDATION_GENERIC_ERROR = "İşlem tamamlanamadı. Lütfen tekrar dene.";

/**
 * RPC hata nesnesinden kullanıcı Türkçesi üretir (`resolveEventRpcErrorMessage`
 * deseni): PostgREST hata `message`'ı raise metnini taşır; bilinen kodları alt
 * diziyle tarar, bilinmeyende fallback'e düşer (ham kodu kullanıcıya GÖSTERME).
 *
 * ⚠️ Supabase RPC hataları **düz nesnedir, `Error` örneği DEĞİLDİR** — tip
 * daraltması (instanceof) bu haritayı ölü bırakır, kullanıcı `[object Object]` görür.
 */
export function resolveRecommendationRpcErrorMessage(
  error: unknown,
  fallback = RECOMMENDATION_GENERIC_ERROR,
): string {
  const candidates: string[] = [];
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    for (const key of ["message", "details", "hint"]) {
      const value = record[key];
      if (typeof value === "string") candidates.push(value);
    }
  }
  if (typeof error === "string") candidates.push(error);

  for (const text of candidates) {
    for (const [code, message] of Object.entries(RECOMMENDATION_RPC_ERROR_MESSAGES)) {
      if (text.includes(code)) return message;
    }
  }
  return fallback;
}

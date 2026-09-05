// Profil telefon alanı — Profil Workshop WS1 madde 1 (T19, 3 Eylül 2026).
//
// Telefon `user_profile_attributes` içinde `phone` anahtarıyla, HER ZAMAN private
// saklanır (afs_attributes.storage_strategy = private_storage; public sayfa RPC'si
// bu stratejiyi baştan eler). Bu modül yalnız biçim doğrular/normalize eder;
// ülke bilgisi telefon alan kodundan ASLA türetilmez (WS1 madde 10 — +90 numaralı
// üye Berlin'de yaşıyor olabilir).

export const PHONE_ATTRIBUTE_KEY = "phone";

export const PHONE_FORMAT_HINT = "Ülke kodu ile yaz, örn. +49 170 1234567";

export const PHONE_INVALID_MESSAGE =
  "Telefon numarası ülke koduyla başlamalı ve 7–15 rakam içermeli (örn. +49 170 1234567).";

/** E.164: "+" + ülke kodu (1-9 ile başlar) + toplam 7–15 rakam. */
const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

/**
 * Kullanıcının yazdığı telefonu E.164 biçimine indirger.
 * Boşluk, tire, nokta ve parantez atılır; "00" uluslararası öneki "+" olur.
 * Geçersizse `null` döner — çağıran satır içi hata gösterir, kaydetmez.
 */
export function normalizePhoneE164(raw: string): string | null {
  const compact = raw.replace(/[\s\-.()]/g, "");
  if (!compact) return null;
  const withPlus = compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
  return E164_PATTERN.test(withPlus) ? withPlus : null;
}

/** Ekranda okunur biçim: +49 170 1234567 → "+49 170 1234567" korunur, boşsa "-". */
export function formatPhoneForDisplay(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed || "-";
}

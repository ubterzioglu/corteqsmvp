/**
 * Türkçe-locale string yardımcıları.
 *
 * JS'in varsayılan case dönüşümleri Türkçe'de yanlıştır:
 *   "İstanbul".toLowerCase() === "i̇stanbul"  (i + birleşen nokta — "istanbul" ile EŞLEŞMEZ)
 *   "ısparta".toUpperCase()  === "ISPARTA" yerine "ISPARTA" ✓ ama "i" → "I" (İ olmalı)
 * Kullanıcıya görünen Türkçe metinlerde DAİMA bu yardımcıları kullan;
 * teknik değerlerde (para/ülke kodu, dosya uzantısı, hex, referans kodu)
 * bare toUpperCase/toLowerCase doğrudur.
 */

export const trUpper = (input: string): string => input.toLocaleUpperCase("tr-TR");

export const trLower = (input: string): string => input.toLocaleLowerCase("tr-TR");

/** Türkçe duyarlı, aksan-toleranslı arama anahtarı üretir (ü→u, ç→c, ı→i, İ→i …). */
export const trFold = (input: string): string =>
  input.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

/**
 * URL/DB anahtarı için Türkçe-doğru slug: "İstanbul Kış Okulu" → "istanbul-kis-okulu".
 * `trFold` ile katlar; [a-z0-9] dışı her dizi tek "-", baştaki/sondaki "-" kırpılır,
 * `maxLength` verildiyse EN SON kesilir (7 eski kopyanın sırası — kesim sonda "-" bırakabilir).
 * ⚠️ Slug'lar saklanır: çıktıyı değiştirmek yalnız YENİ kayıtları etkiler, ama
 * kayıtlı slug'ı yeniden geçiren formlar için fonksiyon idempotent kalmalıdır.
 */
export function trSlugify(input: string, maxLength?: number): string {
  const slug = trFold(input)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return maxLength === undefined ? slug : slug.slice(0, maxLength);
}

/** Arama/filtre eşleşmesi: hem "İstanbul" hem "istanbul" hem "ISTANBUL" birbirini bulur. */
export const trIncludes = (haystack: string | null | undefined, needle: string): boolean => {
  const query = trFold(needle.trim());
  if (!query) return true;
  return trFold(haystack ?? "").includes(query);
};

/** Türkçe alfabe sırasına göre karşılaştırma (ç, ğ, ı, ö, ş, ü doğru sıralanır). */
export const trCompare = (left: string, right: string): number =>
  left.localeCompare(right, "tr", { sensitivity: "base" });

export function normalizeTurkishText(input: string): string {
  const withoutControlChars = input
    .normalize("NFC")
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);
      return !(code <= 31 || code === 127);
    })
    .join("");

  return withoutControlChars.trim();
}

export function normalizeOptionalTurkishText(input: string | null | undefined): string | null {
  if (input == null) return null;
  const normalized = normalizeTurkishText(input);
  return normalized === "" ? null : normalized;
}

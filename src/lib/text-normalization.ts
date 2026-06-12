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
  input
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i");

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

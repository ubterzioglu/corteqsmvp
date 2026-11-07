import { trFold } from "@/lib/text-normalization";

/**
 * NFD'nin ayrıştıramadığı (birleşen işarete bölünmeyen) harfler — trFold bunları olduğu gibi
 * bırakır. Diaspora şehir adlarında geçenler: Straße, København, Łódź, Malmø …
 */
const NON_DECOMPOSABLE: Record<string, string> = {
  ß: "ss",
  ø: "o",
  ł: "l",
  đ: "d",
  æ: "ae",
  œ: "oe",
};

/**
 * Ülke/şehir arama anahtarı: Türkçe-duyarlı katlama + aksan silme.
 *
 * ⚠️ Eski sürüm `toLowerCase()` ile başlıyordu: "İ" → "i" + birleşen nokta (U+0307) olur ve
 * sonraki `replace(/İ/g, "i")` hiç tetiklenmezdi — "istanbul" araması "İstanbul"u BULMUYORDU
 * (2026-11-07, `country-city-search.test.ts`). `trFold` tr-TR küçültür, NFD ile aksanları siler.
 */
export function normalizeSearchText(text: string): string {
  return trFold(text).replace(/[ßøłđæœ]/g, (ch) => NON_DECOMPOSABLE[ch]);
}

export function filterByQuery(items: string[], query: string): string[] {
  if (!query.trim()) return items;
  const normalized = normalizeSearchText(query);
  return items.filter((item) => normalizeSearchText(item).includes(normalized));
}

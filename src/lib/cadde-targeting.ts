// Cadde 3.0 ilgi alanı hedefleme yardımcıları (spec §12).
// Katalog truth source'u DB'deki cadde_interest_catalog'dur; buradaki sabitler
// yalnız sınır kuralları (1-3 etiket) ve UI seçim mantığı içindir.

export const CADDE_MAX_POST_INTERESTS = 3;

export type { CaddeInterest } from "./cadde-types";

/** Etiket listesini normalize eder: trim + boşları at + tekilleştir (sıra korunur). */
export function normalizeInterestKeys(keys: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of keys) {
    const key = raw.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(key);
  }
  return result;
}

/** Composer sınırı: en fazla 3 etiket (spec §12.2 P0). Hata mesajı kullanıcıya gösterilebilir. */
export function validatePostInterests(keys: readonly string[]): string[] {
  const normalized = normalizeInterestKeys(keys);
  if (normalized.length > CADDE_MAX_POST_INTERESTS) {
    throw new Error(`En fazla ${CADDE_MAX_POST_INTERESTS} etiket seçebilirsin.`);
  }
  return normalized;
}

/**
 * UI toggle yardımcısı: seçiliyse çıkarır, değilse (limit doluysa eklemeden) ekler.
 * Yeni dizi döner — mevcut seçim mutate edilmez.
 */
export function toggleInterestSelection(
  current: readonly string[],
  key: string,
  max = CADDE_MAX_POST_INTERESTS,
): string[] {
  if (current.includes(key)) {
    return current.filter((item) => item !== key);
  }
  if (current.length >= max) {
    return [...current];
  }
  return [...current, key];
}

/** Postun ihtiyaç kategorisi görüntüleyenin ilgi alanlarından biriyle eşleşiyor mu (band A girdisi). */
export function needCategoryMatches(
  needCategory: string | null,
  viewerInterests: ReadonlySet<string> | readonly string[],
): boolean {
  if (!needCategory) return false;
  const set = viewerInterests instanceof Set ? viewerInterests : new Set(viewerInterests);
  return set.has(needCategory);
}

/** Post etiketleri ∩ görüntüleyen ilgi alanları sayısı (skor girdisi; SQL interest_overlap aynası). */
export function interestOverlapCount(
  postInterests: readonly string[],
  viewerInterests: ReadonlySet<string> | readonly string[],
): number {
  const set = viewerInterests instanceof Set ? viewerInterests : new Set(viewerInterests);
  let count = 0;
  for (const key of new Set(postInterests)) {
    if (set.has(key)) count += 1;
  }
  return count;
}

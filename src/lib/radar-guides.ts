// Radar "Rehberler" sekmesinin filtre mantığı (revizyon 710709c1).
//
// Neden bileşenden AYRI: bir `.tsx` dosyasından bileşen dışı sembol export etmek
// `react-refresh/only-export-components` uyarısı üretir (lint taban çizgisi 0 problem).
// Ayrıca Radix Select jsdom'da pointer API'si ister; filtre davranışı bileşen
// etkileşimi üzerinden değil doğrudan burada test edilir — davranışın kendisi budur.

import type { BlogCategory, BlogPostRow } from "@/lib/blog";
import { trCompare } from "@/lib/text-normalization";

export type GuideCategoryFilter = BlogCategory | "all";

/** Ülke filtresinin "tümü" değeri — boş string Radix Select'te geçersizdir. */
export const ALL_GUIDE_COUNTRIES = "all";

export interface GuideCountryOption {
  value: string;
  label: string;
}

/**
 * Yayındaki yazılardan ülke seçeneklerini türetir.
 *
 * Sabit bir ülke listesi TUTULMAZ: rehberi olmayan bir ülkeyi seçtirmek kullanıcıyı
 * boş ekrana götürür. Sıralama Türkçe'ye göre yapılır (İ/ı doğru yerde).
 */
export function collectGuideCountries(posts: BlogPostRow[]): GuideCountryOption[] {
  const seen = new Map<string, string>();
  for (const post of posts) {
    const value = post.country || "diger";
    if (!seen.has(value)) seen.set(value, post.country_label || "Diğer");
  }
  return Array.from(seen, ([value, label]) => ({ value, label })).sort((left, right) =>
    trCompare(left.label, right.label),
  );
}

/** Kategori + ülke filtresini uygular. */
export function filterGuidePosts(
  posts: BlogPostRow[],
  options: { category?: GuideCategoryFilter; country?: string } = {},
): BlogPostRow[] {
  const category = options.category ?? "all";
  const country = options.country ?? ALL_GUIDE_COUNTRIES;
  return posts.filter((post) => {
    if (category !== "all" && post.category !== category) return false;
    if (country !== ALL_GUIDE_COUNTRIES && (post.country || "diger") !== country) return false;
    return true;
  });
}

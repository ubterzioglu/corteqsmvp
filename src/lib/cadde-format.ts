// Cadde URL filtre durumu ve feed yerleşim yardımcıları.

import type { CaddeContentMode, CaddeFeedListItem, CaddeFilterState, CaddePost, CaddeSponsoredPlacement } from "./cadde-types";

/** Virgülle ayrılmış URL parametresini normalize edilmiş ad listesine çevirir. */
const parseListParam = (value: string | null): string[] => {
  if (!value) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of value.split(",")) {
    const item = raw.trim();
    if (!item || seen.has(item)) continue;
    seen.add(item);
    result.push(item);
  }
  return result;
};

/**
 * URL → filtre durumu. Production default'u REAL akıştır (Cadde 3.0 / R-01);
 * demo yalnız açıkça `?mode=demo` istendiğinde açılır.
 * Faz 3: country/city parametreleri virgülle ayrılmış ÇOKLU değer taşır;
 * eski tekil `?country=Almanya` URL'leri tek elemanlı liste olarak okunur (geriye uyumlu).
 */
export function parseCaddeFilters(searchParams: URLSearchParams): CaddeFilterState {
  const mode: CaddeContentMode = searchParams.get("mode") === "demo" ? "demo" : "real";
  return {
    mode,
    countries: parseListParam(searchParams.get("country")),
    cities: parseListParam(searchParams.get("city")),
    bridge: searchParams.get("bridge") === "1",
  };
}

/** Filtre durumu → URL. Default (real) mod parametre üretmez; demo açıkça yazılır. */
export function serializeCaddeFilters(filters: CaddeFilterState): URLSearchParams {
  const next = new URLSearchParams();
  if (filters.mode === "demo") next.set("mode", "demo");
  if (filters.countries.length) next.set("country", filters.countries.join(","));
  if (filters.cities.length) next.set("city", filters.cities.join(","));
  if (filters.bridge) next.set("bridge", "1");
  return next;
}

/** Başlık rozeti için kısa filtre özeti ("Berlin +2", "Almanya", "Global Akış"). */
export function summarizeCaddeFilters(filters: CaddeFilterState): string {
  const primary = filters.cities[0] ?? filters.countries[0];
  if (!primary) return "Global Akış";
  const extra = filters.cities.length + filters.countries.length - 1;
  return extra > 0 ? `${primary} +${extra}` : primary;
}

/**
 * Sponsor kartını organik akışa 3. posttan sonra enjekte eder.
 * Sponsor yalnız real modda ve yeterli organik içerik varken gösterilir.
 */
export function injectSponsoredPlacement(
  posts: CaddePost[],
  sponsor: CaddeSponsoredPlacement | null,
  mode: CaddeContentMode,
): CaddeFeedListItem[] {
  if (mode !== "real" || !sponsor || posts.length < 4) {
    return posts.map((post) => ({ kind: "post" as const, post }));
  }

  const leading = posts.slice(0, 3).map((post) => ({ kind: "post" as const, post }));
  const trailing = posts.slice(3).map((post) => ({ kind: "post" as const, post }));
  return [...leading, { kind: "sponsor" as const, sponsor }, ...trailing];
}

// Cadde URL filtre durumu ve feed yerleşim yardımcıları.

import type { CaddeContentMode, CaddeFeedListItem, CaddeFilterState, CaddePost, CaddeSponsoredPlacement } from "./cadde-types";

const normalizeFilter = (value: string | null): string => value?.trim() ?? "";

/**
 * URL → filtre durumu. Production default'u REAL akıştır (Cadde 3.0 / R-01);
 * demo yalnız açıkça `?mode=demo` istendiğinde açılır.
 */
export function parseCaddeFilters(searchParams: URLSearchParams): CaddeFilterState {
  const mode: CaddeContentMode = searchParams.get("mode") === "demo" ? "demo" : "real";
  return {
    mode,
    country: normalizeFilter(searchParams.get("country")),
    city: normalizeFilter(searchParams.get("city")),
    bridge: searchParams.get("bridge") === "1",
  };
}

/** Filtre durumu → URL. Default (real) mod parametre üretmez; demo açıkça yazılır. */
export function serializeCaddeFilters(filters: CaddeFilterState): URLSearchParams {
  const next = new URLSearchParams();
  if (filters.mode === "demo") next.set("mode", "demo");
  if (filters.country) next.set("country", filters.country);
  if (filters.city) next.set("city", filters.city);
  if (filters.bridge) next.set("bridge", "1");
  return next;
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

// Cadde URL filtre durumu ve feed yerleşim yardımcıları.

import type { CaddeContentMode, CaddeFeedListItem, CaddeFilterState, CaddeInterest, CaddePost, CaddePromotionCard, CaddeSponsoredPlacement } from "./cadde-types";

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

/**
 * Cadde ilgi alanı seçimini profil `interests` attribute'una (user_profile_attributes)
 * aynalamak için katalog sırasında, Türkçe etiketlerle virgüllü metin üretir.
 * Profil Tamamlanma kartı ve public profil bu attribute'u okur; boş seçim boş metin
 * döner ve attribute temizlenir.
 */
export function buildCaddeInterestsMirrorText(catalog: CaddeInterest[], selectedKeys: string[]): string {
  const selected = new Set(selectedKeys);
  return catalog
    .filter((interest) => selected.has(interest.key))
    .map((interest) => interest.labelTr)
    .join(", ");
}

/** Başlık rozeti için kısa filtre özeti ("Berlin +2", "Almanya", "Global Akış"). */
export function summarizeCaddeFilters(filters: CaddeFilterState): string {
  const primary = filters.cities[0] ?? filters.countries[0];
  if (!primary) return "Global Akış";
  const extra = filters.cities.length + filters.countries.length - 1;
  return extra > 0 ? `${primary} +${extra}` : primary;
}

/**
 * Tanıtım kampanya kartlarını organik akışa serpiştirir (spec §11.4 / §15):
 * her `interval` organik postta bir kampanya kartı; aynı kampanya feed başına en fazla
 * `maxPerCampaign` kez görünür ve iki sponsor kartı asla art arda gelmez.
 * Sponsor kartları organik skora karışmaz — enjeksiyon tamamen istemci tarafıdır.
 */
export function interleavePromotions(
  items: CaddeFeedListItem[],
  promotions: CaddePromotionCard[],
  mode: CaddeContentMode,
  interval = 4,
  maxPerCampaign = 2,
): CaddeFeedListItem[] {
  if (mode !== "real" || promotions.length === 0 || items.length < interval) {
    return items;
  }

  const usage = new Map<string, number>();
  const result: CaddeFeedListItem[] = [];
  let organicSinceSponsor = 0;
  let promotionIndex = 0;

  const nextPromotion = (): CaddePromotionCard | null => {
    for (let attempt = 0; attempt < promotions.length; attempt += 1) {
      const candidate = promotions[promotionIndex % promotions.length];
      promotionIndex += 1;
      if ((usage.get(candidate.campaignId) ?? 0) < maxPerCampaign) {
        usage.set(candidate.campaignId, (usage.get(candidate.campaignId) ?? 0) + 1);
        return candidate;
      }
    }
    return null;
  };

  for (const item of items) {
    result.push(item);
    if (item.kind === "post") {
      organicSinceSponsor += 1;
    } else {
      organicSinceSponsor = 0;
    }

    if (organicSinceSponsor >= interval) {
      const promotion = nextPromotion();
      if (promotion) {
        result.push({ kind: "promotion", promotion });
        organicSinceSponsor = 0;
      }
    }
  }

  return result;
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

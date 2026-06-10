// Cadde 3.0 feed sıralama katmanı — SQL list_cadde_feed_v1'in TS AYNASI.
// GERÇEK sıralama DB'dedir (supabase/migrations/20260610186000_cadde300_007_feed_rpc.sql);
// buradaki fonksiyonlar UI guard'ları, demo modu ve truth-table testleri içindir.
// Birini değiştiren diğerini de günceller (senkron sözleşmesi, devir notu §6.3 ile aynı sınıf).

import type { CaddeFeedCursor } from "./cadde-types";

export type { CaddeFeedCursor } from "./cadde-types";

/** CKS §11.1 bandları: A=1 ... F=6 (küçük öncelikli). */
export type CaddeBand = 1 | 2 | 3 | 4 | 5 | 6;

export const CADDE_BAND_LABELS: Record<CaddeBand, string> = {
  1: "A — Aynı şehir + ihtiyaç eşleşmesi",
  2: "B — Aynı şehir",
  3: "C — Aynı ülke",
  4: "D — Yüksek etkileşimli global",
  5: "E — Orta etkileşimli global",
  6: "F — Global",
};

/** CKS §11.2 skor ağırlıkları — SQL ile birebir. */
export const CADDE_RANK_WEIGHTS = {
  sameCity: 100,
  sameCountry: 60,
  bridgeFilterMatch: 50,
  needMatch: 40,
  perInterest: 8,
  interestCap: 32,
  highEngagementBand: 35,
  midEngagementBand: 20,
  pinned: 120,
  freshness6h: 25,
  freshness24h: 15,
  freshness7d: 5,
} as const;

export type CaddeRankInput = {
  sameCity: boolean;
  sameCountry: boolean;
  /** Postun need_category'si görüntüleyenin ilgi alanlarından biriyle eşleşiyor mu. */
  needMatch: boolean;
  /** Post etiketleri ∩ görüntüleyen ilgi alanları sayısı. */
  interestOverlap: number;
  engagementScore: number;
  /** Son 7 günün ortalama engagement skoru (0 ise band D/E devre dışı). */
  avgEngagement: number;
  /** Köprü filtresi açıkken post da Köprü ise true. */
  bridgeFilterMatch: boolean;
  pinned: boolean;
  /** coalesce(published_at, created_at)'ten bu yana geçen saat. */
  ageHours: number;
};

/** SQL band case'inin birebir aynası. */
export function computeCaddeBand(input: CaddeRankInput): CaddeBand {
  if (input.sameCity && input.needMatch) return 1;
  if (input.sameCity) return 2;
  if (input.sameCountry) return 3;
  if (input.avgEngagement > 0 && input.engagementScore >= 2 * input.avgEngagement) return 4;
  if (input.avgEngagement > 0 && input.engagementScore >= 1.5 * input.avgEngagement) return 5;
  return 6;
}

function freshnessScore(ageHours: number): number {
  if (ageHours <= 6) return CADDE_RANK_WEIGHTS.freshness6h;
  if (ageHours <= 24) return CADDE_RANK_WEIGHTS.freshness24h;
  if (ageHours <= 24 * 7) return CADDE_RANK_WEIGHTS.freshness7d;
  return 0;
}

/** SQL skor ifadesinin birebir aynası. Geo skoru tekil: aynı şehir 100 VEYA aynı ülke 60. */
export function computeCaddeScore(input: CaddeRankInput): number {
  const geo = input.sameCity
    ? CADDE_RANK_WEIGHTS.sameCity
    : input.sameCountry
      ? CADDE_RANK_WEIGHTS.sameCountry
      : 0;

  const isGlobal = !input.sameCity && !input.sameCountry;
  const engagementBonus = isGlobal && input.avgEngagement > 0
    ? input.engagementScore >= 2 * input.avgEngagement
      ? CADDE_RANK_WEIGHTS.highEngagementBand
      : input.engagementScore >= 1.5 * input.avgEngagement
        ? CADDE_RANK_WEIGHTS.midEngagementBand
        : 0
    : 0;

  return (
    geo +
    (input.bridgeFilterMatch ? CADDE_RANK_WEIGHTS.bridgeFilterMatch : 0) +
    (input.needMatch ? CADDE_RANK_WEIGHTS.needMatch : 0) +
    Math.min(input.interestOverlap * CADDE_RANK_WEIGHTS.perInterest, CADDE_RANK_WEIGHTS.interestCap) +
    engagementBonus +
    (input.pinned ? CADDE_RANK_WEIGHTS.pinned : 0) +
    freshnessScore(input.ageHours)
  );
}

/**
 * Deterministik random (CKS §11.3): SQL'deki hashtext(post_id || current_date || scope)
 * kavramının TS karşılığı (FNV-1a). Algoritmalar farklıdır — değerler SQL ile EŞLEŞMEZ;
 * yalnız "aynı gün + aynı scope → aynı sıra" garantisinin testi ve demo modu için kullanılır.
 */
export function deterministicCaddeRand(postId: string, dateKey: string, viewerScope: string): number {
  const input = `${postId}|${dateKey}|${viewerScope}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash | 0;
}

export type CaddeRankedItem = {
  id: string;
  band: number;
  score: number;
  rand: number;
};

/** SQL order by'ın aynası: band asc, score desc, rand asc, id asc. */
export function compareCaddeRank(a: CaddeRankedItem, b: CaddeRankedItem): number {
  if (a.band !== b.band) return a.band - b.band;
  if (a.score !== b.score) return b.score - a.score;
  if (a.rand !== b.rand) return a.rand - b.rand;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Keyset koşulunun aynası: cursor'dan SONRA gelen öğeler (pagination tekrar/kayıp testi için). */
export function isAfterCaddeCursor(item: CaddeRankedItem, cursor: CaddeFeedCursor): boolean {
  return compareCaddeRank(item, { ...cursor }) > 0;
}

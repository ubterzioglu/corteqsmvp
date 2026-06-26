// Relocation Tools — ortak skorlama katmanı (SQL↔TS AYNASI).
// GERÇEK skorlama DB'dedir (20260626121000_relocation_tools_scoring_rpcs.sql:
// rl_tool_weighted_score / rl_tool_clamp_neutral + araca özel relocation_score_<tool>_v1).
// Buradaki fonksiyonlar UI önizlemesi, açıklanabilirlik ve drift testleri içindir.
// Birini değiştiren diğerini de günceller (senkron sözleşmesi — relocation-ranking.ts ile aynı sınıf).
//
// Generic: araç başına değişen boyut kümesi `weights` (Record<string, number>) ile gelir.
// Her araç fazı kendi ağırlık bloğunu TOOL_WEIGHTS'e ekler; SQL relocation_tools.weights ile eşleşir.

export type DimensionScore = number | null | undefined;
export type DimensionWeights = Record<string, number>;
export type ScoreBreakdown = Record<string, number>;

/** Bucket eşiği: min ve anahtar (azalan min ile değerlendirilir). */
export interface ScoreBucket {
  key: string;
  min: number;
}

/** null/bilinmiyor → nötr 0.5; aralık dışı → kırp. SQL rl_tool_clamp_neutral aynası. */
export function clamp01OrNeutral(value: DimensionScore): number {
  if (value === null || value === undefined || Number.isNaN(value)) return 0.5;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** Ham boyut değerlerini weights anahtar kümesine göre 0..1 breakdown'a çevirir. */
export function computeScoreBreakdown(
  features: Record<string, DimensionScore>,
  weights: DimensionWeights,
): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {};
  for (const dim of Object.keys(weights)) {
    breakdown[dim] = clamp01OrNeutral(features[dim]);
  }
  return breakdown;
}

/**
 * Ağırlıklı skor (0..1): sum(breakdown[k] * weights[k]) / sum(weights).
 * Eksik anahtar nötr 0.5. 4 ondalık. SQL rl_tool_weighted_score birebir aynası.
 */
export function computeWeightedScore(
  breakdown: ScoreBreakdown,
  weights: DimensionWeights,
): number {
  let weightSum = 0;
  let scoreSum = 0;
  for (const dim of Object.keys(weights)) {
    const w = weights[dim];
    weightSum += w;
    scoreSum += clamp01OrNeutral(breakdown[dim]) * w;
  }
  if (weightSum === 0) return 0;
  return Math.round((scoreSum / weightSum) * 10_000) / 10_000;
}

/** 0..1 skoru 0..100'e ölçekler (DB total_score numeric(6,2) ile uyumlu). */
export function toScore100(value01: number): number {
  return Math.round(value01 * 100 * 100) / 100;
}

/**
 * total_score (0..100) → bucket anahtarı. Azalan min'e göre; score >= min olan ilk bucket.
 */
export function resolveBucket(score100: number, buckets: ScoreBucket[]): string | null {
  const sorted = [...buckets].sort((a, b) => b.min - a.min);
  for (const bucket of sorted) {
    if (score100 >= bucket.min) return bucket.key;
  }
  return null;
}

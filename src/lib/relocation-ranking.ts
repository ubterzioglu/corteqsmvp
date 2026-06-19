// Relocation lokasyon sıralama katmanı — SQL relocation_rank_locations_v1'in TS AYNASI.
// GERÇEK sıralama DB'dedir (supabase/migrations/20260619103000_relocation_recommendations.sql);
// buradaki fonksiyonlar UI guard'ları, önizleme ve truth-table testleri içindir.
// Birini değiştiren diğerini de günceller (senkron sözleşmesi — cadde-ranking.ts ile aynı sınıf).
//
// Ağırlıklar: docs/plans/relocation-engine/relocation-engine-e2e.md §5.
//   0.30 budget + 0.20 bureaucracy_ease + 0.15 healthcare + 0.15 gsm + 0.10 community + 0.10 flight

/** Skor bileşeni anahtarları — score_breakdown JSONB ile birebir. */
export type RelocationScoreKey =
  | "budget_fit"
  | "bureaucracy_ease"
  | "healthcare_access"
  | "gsm_coverage"
  | "community_fit"
  | "flight_access";

/** SQL ile birebir ağırlıklar (toplam = 1.0). */
export const RELOCATION_RANK_WEIGHTS: Record<RelocationScoreKey, number> = {
  budget_fit: 0.30,
  bureaucracy_ease: 0.20,
  healthcare_access: 0.15,
  gsm_coverage: 0.15,
  community_fit: 0.10,
  flight_access: 0.10,
} as const;

/** Bir lokasyonun skorlama girdileri (relocation_locations satırından türetilir). */
export interface RelocationLocationFeatures {
  /** Aylık konut bütçesi uyumu 0..1 (budget yoksa 0.5 nötr). */
  budgetFit: number;
  /** Bürokrasi kolaylığı 0..1 = 1 - bureaucracy_complexity. */
  bureaucracyEase: number;
  /** 0..1 */
  healthcareAccess: number;
  /** 0..1 */
  gsmCoverage: number;
  /** 0..1 — Türk topluluğu yoğunluğu (community_density). */
  communityFit: number;
  /** 0..1 */
  flightAccess: number;
}

/** null/bilinmiyor → nötr 0.5; aralık dışı → kırp. */
function clamp01OrNeutral(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) return 0.5;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** Skor bileşenlerini (0..1) hesaplar — score_breakdown'ın kaynağı. */
export function computeScoreBreakdown(
  features: RelocationLocationFeatures,
): Record<RelocationScoreKey, number> {
  return {
    budget_fit: clamp01OrNeutral(features.budgetFit),
    bureaucracy_ease: clamp01OrNeutral(features.bureaucracyEase),
    healthcare_access: clamp01OrNeutral(features.healthcareAccess),
    gsm_coverage: clamp01OrNeutral(features.gsmCoverage),
    community_fit: clamp01OrNeutral(features.communityFit),
    flight_access: clamp01OrNeutral(features.flightAccess),
  };
}

/** Ağırlıklı kural skoru (0..1). SQL toplamının birebir aynası. */
export function computeRuleScore(
  breakdown: Record<RelocationScoreKey, number>,
): number {
  let score = 0;
  for (const key of Object.keys(RELOCATION_RANK_WEIGHTS) as RelocationScoreKey[]) {
    score += breakdown[key] * RELOCATION_RANK_WEIGHTS[key];
  }
  // 4 ondalık — DB numeric(6,4) ile eşleşir.
  return Math.round(score * 10_000) / 10_000;
}

/**
 * Faz 3 hibrit harman noktası: final = (1 - alpha) * rule + alpha * ml.
 * Dataset/model yokken alpha = 0 → final = rule (cold-start: knowledge-based bootstrap).
 * mlScore null ise rule skoru aynen döner. Model promote edildiğinde alpha > 0 verilir.
 */
export function blendFinalScore(
  ruleScore: number,
  mlScore: number | null,
  alpha = 0,
): number {
  if (mlScore === null || alpha <= 0) return ruleScore;
  const a = Math.min(1, Math.max(0, alpha));
  const blended = (1 - a) * ruleScore + a * mlScore;
  return Math.round(blended * 10_000) / 10_000;
}

/** Sert filtre sonucu (false ise lokasyon listeden düşer). */
export interface RelocationHardFilterInput {
  /** Hedef ülkeler boşsa true (filtre yok); doluysa lokasyon ülkesi içinde mi. */
  targetCountryMatch: boolean;
  /** Move window geçerli mi (start <= end veya ikisi de boş). */
  moveWindowValid: boolean;
  /** Lokasyon aktif + asgari veri tazeliği var mı. */
  dataFresh: boolean;
}

export function passesHardFilter(input: RelocationHardFilterInput): boolean {
  return input.targetCountryMatch && input.moveWindowValid && input.dataFresh;
}

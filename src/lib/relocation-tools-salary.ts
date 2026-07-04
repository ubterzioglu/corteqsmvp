// Relocation Tools — #2 Meslek/Maaş Karşılaştırma skorlama (SQL↔TS AYNASI).
// GERÇEK skorlama DB'dedir (20260626190000_relocation_tool_profession_salary.sql:
// relocation_score_profession_salary_v1). Buradaki fonksiyon UI önizlemesi + drift testi içindir;
// bir ülke satırının boyut kırılımını + salary_power_index'ini hesaplar. SQL ile BİREBİR
// (relocation-tools-salary.test.ts kilitler). docs/10tool/02-meslek-maas-karsilastirma-e2e.md §4.

import {
  type DimensionWeights,
  type ScoreBucket,
  clamp01OrNeutral,
  computeWeightedScore,
  resolveBucket,
  toScore100,
} from "@/lib/relocation-tools-ranking";

export type SalaryDimension =
  | "salary_level"
  | "cost_adjusted_income"
  | "demand_fit"
  | "tax_social_fit"
  | "credential_transferability";

/** SQL relocation_tools.weights aynası (toplam 1.0). */
export const SALARY_WEIGHTS: DimensionWeights = {
  salary_level: 0.25,
  cost_adjusted_income: 0.3,
  demand_fit: 0.2,
  tax_social_fit: 0.15,
  credential_transferability: 0.1,
};

/** SQL bands aynası (0..100). Bucket'lar kategori-stili ama eşik tabanlı. */
export const SALARY_BUCKETS: ScoreBucket[] = [
  { key: "high_value", min: 75 },
  { key: "balanced", min: 55 },
  { key: "expensive_but_high_salary", min: 40 },
  { key: "low_salary_or_high_barrier", min: 0 },
];

/** Bir ülke için maaş benchmark satırı (relocation_salary_benchmarks). */
export interface SalaryBenchmarkRow {
  salary_median: number;
  net_ratio: number; // brüt→net
  demand_index?: number | null;
  cost_index?: number | null; // ülke maliyeti (relocation_country_metrics)
}

/** regulated_profession cevabı → credential_transferability (SQL case aynası). */
export function credentialScore(regulated: string | undefined): number {
  if (regulated === "yes") return 0.3;
  if (regulated === "not_sure") return 0.5;
  return 0.85;
}

const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

/** YENİ (+8, 2026-07-01): demand_fit/tax_social_fit/credential_transferability ek sinyalleri. */
export interface SalaryExtraSignals {
  negotiation_experience?: number; // scale 1..5
  interview_readiness?: number; // scale 1..5
  visa_sponsor_need?: string; // 'yes' | 'no' | 'not_sure'
  benefits_priority?: string[];
}

function scale5(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return 0.5;
  return clamp01OrNeutral((value - 1) / 4);
}

function benefitsScore(benefits: string[] | undefined): number {
  const list = benefits ?? [];
  if (list.length === 0 || (list.length === 1 && list[0] === "none")) return 0.5;
  return Math.min(list.length / 3, 1.0);
}

/**
 * Bir ülke satırının 5 boyut kırılımı. globalMax = bu meslek için tüm ülkelerdeki
 * en yüksek salary_median (salary_level normalizasyonu). SQL rows0.breakdown aynası.
 */
export function computeSalaryBreakdown(
  row: SalaryBenchmarkRow,
  globalMax: number,
  regulated: string | undefined,
  extra: SalaryExtraSignals = {},
): Record<SalaryDimension, number> {
  const gmax = globalMax > 0 ? globalMax : 1;
  const cost = row.cost_index ?? 0.5;
  const negotiation = scale5(extra.negotiation_experience);
  const interviewReady = scale5(extra.interview_readiness);
  const benefits = benefitsScore(extra.benefits_priority);
  const visaSponsorMultiplier = extra.visa_sponsor_need === "yes" ? 0.9 : 1.0;

  return {
    salary_level: round4(clamp01OrNeutral(row.salary_median / gmax)),
    cost_adjusted_income: round4(
      clamp01OrNeutral((row.salary_median * row.net_ratio) / gmax / (0.4 + cost)),
    ),
    demand_fit: round4(
      clamp01OrNeutral(
        (row.demand_index ?? 0.5) * 0.8 + negotiation * 0.1 + interviewReady * 0.1,
      ),
    ),
    tax_social_fit: round4(clamp01OrNeutral(row.net_ratio * 0.75 + benefits * 0.25)),
    credential_transferability: round4(credentialScore(regulated) * visaSponsorMultiplier),
  };
}

/** Bir ülkenin salary_power_index'i (0..100). SQL scored.power_index aynası. */
export function computeSalaryPowerIndex(
  row: SalaryBenchmarkRow,
  globalMax: number,
  regulated: string | undefined,
  extra: SalaryExtraSignals = {},
): number {
  return toScore100(
    computeWeightedScore(
      computeSalaryBreakdown(row, globalMax, regulated, extra),
      SALARY_WEIGHTS,
    ),
  );
}

/** Power index → bucket (SQL rl_tool_resolve_bucket aynası). */
export function salaryBucket(powerIndex: number): string | null {
  return resolveBucket(powerIndex, SALARY_BUCKETS);
}

/** Boyut → Türkçe etiket. */
export const SALARY_LABELS: Record<SalaryDimension, string> = {
  salary_level: "Maaş Seviyesi",
  cost_adjusted_income: "Maliyet Ayarlı Gelir",
  demand_fit: "Talep",
  tax_social_fit: "Net/Vergi Etkisi",
  credential_transferability: "Denklik Kolaylığı",
};

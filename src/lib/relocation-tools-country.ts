// Relocation Tools — #1 Ülke Seçimi skorlama (SQL↔TS AYNASI).
// GERÇEK skorlama DB'dedir (20260626180000_relocation_tool_country_match.sql:
// relocation_score_country_match_v1, relocation_country_metrics satırlarını skorlar).
// Buradaki fonksiyon UI önizlemesi + drift testi içindir; bir ülkenin (metrics + prefs + deal-breakers)
// boyut kırılımını ve skorunu hesaplar. SQL ile BİREBİR (relocation-tools-country.test.ts kilitler).
// docs/10tool/01-ulke-secimi-e2e.md §4.

import {
  type DimensionWeights,
  type ScoreBucket,
  clamp01OrNeutral,
  computeWeightedScore,
  resolveBucket,
  toScore100,
} from "@/lib/relocation-tools-ranking";

export type CountryDimension =
  | "budget_fit"
  | "career_market_fit"
  | "visa_path_fit"
  | "language_fit"
  | "quality_of_life_fit"
  | "community_fit"
  | "climate_fit";

/** SQL relocation_tools.weights aynası (toplam 1.0). */
export const COUNTRY_WEIGHTS: DimensionWeights = {
  budget_fit: 0.2,
  career_market_fit: 0.2,
  visa_path_fit: 0.15,
  language_fit: 0.15,
  quality_of_life_fit: 0.15,
  community_fit: 0.1,
  climate_fit: 0.05,
};

/** SQL bands aynası (0..100). */
export const COUNTRY_BUCKETS: ScoreBucket[] = [
  { key: "excellent", min: 80 },
  { key: "strong", min: 65 },
  { key: "moderate", min: 50 },
  { key: "risky", min: 0 },
];

/** Deal-breaker cap değeri (0..1) — docs §4: ilgili boyut max 40/100. */
export const DEAL_BREAKER_CAP = 0.4;

/** relocation_country_metrics satırından alanlar (0..1; null = bilinmiyor). */
export interface CountryMetrics {
  cost_index?: number | null; // düşük = ucuz
  employment_index?: number | null;
  visa_complexity?: number | null; // yüksek = zor
  english_workability?: number | null;
  healthcare_index?: number | null;
  safety_index?: number | null;
  inclusion_index?: number | null;
  community_density?: number | null;
  climate_tags?: string[];
}

export interface CountryPreferences {
  monthly_budget?: string | number;
  community_importance?: number;
  healthcare_priority?: number;
  safety_priority?: number;
  inclusion_priority?: number;
  language_profile?: string;
  climate_preference?: string;
  visa_assets?: string[];
  deal_breakers?: string[];
}

function pref01(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return 0.5;
  return clamp01OrNeutral((value - 1) / 4);
}

const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

/** Bir ülkenin ham 7 boyut kırılımını (deal-breaker cap UYGULANMADAN) hesaplar. */
function rawBreakdown(
  m: CountryMetrics,
  prefs: CountryPreferences,
): Record<CountryDimension, number> {
  const hasBudget = prefs.monthly_budget !== undefined && prefs.monthly_budget !== "";
  const englishOnly = prefs.language_profile === "english_only";
  const visaAssets = prefs.visa_assets ?? [];
  const hasVisaAsset = visaAssets.some((a) => a !== "none");
  const community = pref01(prefs.community_importance);
  const health = pref01(prefs.healthcare_priority);
  const safety = pref01(prefs.safety_priority);
  const inclusion = pref01(prefs.inclusion_priority);
  const climate = prefs.climate_preference;
  const tags = m.climate_tags ?? [];

  return {
    budget_fit: hasBudget ? clamp01OrNeutral(1 - (m.cost_index ?? 0.5)) : 0.5,
    career_market_fit: clamp01OrNeutral(m.employment_index),
    visa_path_fit: clamp01OrNeutral(
      (1 - (m.visa_complexity ?? 0.5)) * (hasVisaAsset ? 1.0 : 0.85),
    ),
    language_fit: englishOnly
      ? clamp01OrNeutral(m.english_workability)
      : clamp01OrNeutral(0.5 + 0.5 * (m.english_workability ?? 0.5)),
    quality_of_life_fit: clamp01OrNeutral(
      (m.healthcare_index ?? 0.5) * (0.3 + 0.4 * health) +
        (m.safety_index ?? 0.5) * (0.3 + 0.4 * safety) * 0.5 +
        (m.inclusion_index ?? 0.5) * (0.2 + 0.4 * inclusion) * 0.5,
    ),
    community_fit: clamp01OrNeutral((m.community_density ?? 0.5) * (0.4 + 0.6 * community)),
    climate_fit:
      climate === undefined || climate === "no_preference"
        ? 0.6
        : tags.includes(climate)
          ? 1.0
          : 0.3,
  };
}

/** Deal-breaker cap'i uygulanmış boyut kırılımı. SQL capped CTE aynası. */
export function computeCountryBreakdown(
  m: CountryMetrics,
  prefs: CountryPreferences,
): Record<CountryDimension, number> {
  const raw = rawBreakdown(m, prefs);
  const db = prefs.deal_breakers ?? [];
  const cap = (v: number, on: boolean) => (on ? Math.min(v, DEAL_BREAKER_CAP) : v);

  return {
    budget_fit: round4(cap(raw.budget_fit, db.includes("high_cost"))),
    career_market_fit: round4(raw.career_market_fit),
    visa_path_fit: round4(cap(raw.visa_path_fit, db.includes("hard_visa"))),
    language_fit: round4(cap(raw.language_fit, db.includes("no_english"))),
    quality_of_life_fit: round4(
      cap(raw.quality_of_life_fit, db.includes("weak_healthcare") || db.includes("low_safety")),
    ),
    community_fit: round4(cap(raw.community_fit, db.includes("no_community"))),
    climate_fit: round4(raw.climate_fit),
  };
}

/** Bir ülkenin 0..100 skoru (ağırlıklı). SQL ranked.score aynası. */
export function computeCountryScore(m: CountryMetrics, prefs: CountryPreferences): number {
  return toScore100(computeWeightedScore(computeCountryBreakdown(m, prefs), COUNTRY_WEIGHTS));
}

/** Skoru bucket'a çevirir (SQL rl_tool_resolve_bucket aynası). */
export function countryBucket(score100: number): string | null {
  return resolveBucket(score100, COUNTRY_BUCKETS);
}

/** Boyut → Türkçe etiket. */
export const COUNTRY_LABELS: Record<CountryDimension, string> = {
  budget_fit: "Bütçe Uyumu",
  career_market_fit: "Kariyer & İş Piyasası",
  visa_path_fit: "Vize Yolu",
  language_fit: "Dil Uyumu",
  quality_of_life_fit: "Yaşam Kalitesi",
  community_fit: "Topluluk",
  climate_fit: "İklim",
};

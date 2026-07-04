// Relocation Tools — #4 Şehir Eşleştirme skorlama (SQL↔TS AYNASI).
// GERÇEK skorlama DB'dedir (20260626160000_relocation_tool_city_match.sql:
// relocation_score_city_match_v1, relocation_locations satırlarını skorlar).
// Buradaki fonksiyon UI önizlemesi + drift testi içindir; bir şehrin (features + prefs)
// boyut kırılımını ve skorunu hesaplar. SQL ile BİREBİR (relocation-tools-city.test.ts kilitler).
// docs/10tool/04-sehir-eslestirme-e2e.md §4.

import {
  type DimensionWeights,
  clamp01OrNeutral,
  computeWeightedScore,
  toScore100,
} from "@/lib/relocation-tools-ranking";

export type CityDimension =
  | "budget_housing_fit"
  | "job_hub_fit"
  | "lifestyle_fit"
  | "community_fit"
  | "safety_healthcare_fit"
  | "mobility_flight_fit";

/** SQL relocation_tools.weights aynası (toplam 1.0). */
export const CITY_WEIGHTS: DimensionWeights = {
  budget_housing_fit: 0.25,
  job_hub_fit: 0.2,
  lifestyle_fit: 0.15,
  community_fit: 0.15,
  safety_healthcare_fit: 0.15,
  mobility_flight_fit: 0.1,
};

/** relocation_locations satırından gerekli alanlar (0..1 normalize; null=bilinmiyor). */
export interface CityFeatures {
  cost_index?: number | null; // düşük = ucuz
  housing_availability?: number | null;
  bureaucracy_complexity?: number | null; // yüksek = zor
  gsm_coverage?: number | null;
  community_density?: number | null;
  safety_index?: number | null;
  healthcare_access?: number | null;
  flight_access?: number | null;
}

/** Kullanıcı tercih çarpanları (scale 1..5 → 0..1; eksik nötr 0.5). */
export interface CityPreferences {
  community_need?: number;
  safety_family?: number;
  airport_access?: number;
  industry_hub?: number;
  healthcare_priority?: number;
  /** YENİ (+4, 2026-07-01): eksikse nötr 0.5 (expat_community_size hariç, o string). */
  public_transport_importance?: number;
  green_space_preference?: number;
  expat_community_size?: string;
  healthcare_access_urgency?: number;
}

function pref01(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return 0.5;
  return clamp01OrNeutral((value - 1) / 4);
}

const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

/** Bir şehrin 6 boyut kırılımını hesaplar. SQL scored.breakdown aynası. */
export function computeCityBreakdown(
  features: CityFeatures,
  prefs: CityPreferences,
): Record<CityDimension, number> {
  const community = pref01(prefs.community_need);
  const safety = pref01(prefs.safety_family);
  const airport = pref01(prefs.airport_access);
  const industry = pref01(prefs.industry_hub);
  const health = pref01(prefs.healthcare_priority);
  const transportPref = pref01(prefs.public_transport_importance);
  const greenPref = pref01(prefs.green_space_preference);
  const expatPref = prefs.expat_community_size;
  const healthUrgency = pref01(prefs.healthcare_access_urgency);
  const expatMultiplier =
    expatPref === "large" ? 1.05 : expatPref === "no_preference" ? 0.95 : 1.0;

  return {
    budget_housing_fit: round4(
      clamp01OrNeutral(1 - (features.cost_index ?? 0.5)) * 0.6 +
        clamp01OrNeutral(features.housing_availability) * 0.4,
    ),
    job_hub_fit: round4(
      clamp01OrNeutral(1 - (features.bureaucracy_complexity ?? 0.5)) * (0.5 + 0.5 * industry),
    ),
    lifestyle_fit: round4(
      clamp01OrNeutral(features.gsm_coverage) * (1 - 0.2 * greenPref) + 0.2 * greenPref,
    ),
    community_fit: round4(
      clamp01OrNeutral(features.community_density) * (0.4 + 0.6 * community) * expatMultiplier,
    ),
    safety_healthcare_fit: round4(
      clamp01OrNeutral(features.safety_index) * (0.4 + 0.6 * safety) * 0.5 +
        clamp01OrNeutral(features.healthcare_access) *
          (0.4 + 0.6 * Math.max(health, healthUrgency)) *
          0.5,
    ),
    mobility_flight_fit: round4(
      clamp01OrNeutral(features.flight_access) * (0.4 + 0.6 * airport) * 0.8 +
        clamp01OrNeutral(features.gsm_coverage) * transportPref * 0.2,
    ),
  };
}

/** Bir şehrin 0..100 skoru (ağırlıklı). SQL ranked.score aynası. */
export function computeCityScore(features: CityFeatures, prefs: CityPreferences): number {
  return toScore100(computeWeightedScore(computeCityBreakdown(features, prefs), CITY_WEIGHTS));
}

/** Boyut → Türkçe etiket (sonuç breakdown kartı için). */
export const CITY_LABELS: Record<CityDimension, string> = {
  budget_housing_fit: "Bütçe & Konut",
  job_hub_fit: "İş Ekosistemi",
  lifestyle_fit: "Yaşam Tarzı",
  community_fit: "Topluluk",
  safety_healthcare_fit: "Güvenlik & Sağlık",
  mobility_flight_fit: "Ulaşım & Uçuş",
};

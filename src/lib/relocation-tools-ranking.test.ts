import { describe, expect, it } from "vitest";

import {
  type DimensionWeights,
  type ScoreBucket,
  clamp01OrNeutral,
  computeScoreBreakdown,
  computeWeightedScore,
  resolveBucket,
  toScore100,
} from "@/lib/relocation-tools-ranking";

// Örnek araç ağırlıkları (docs/10tool/01 country_match §4 — SQL relocation_tools.weights aynası).
const COUNTRY_WEIGHTS: DimensionWeights = {
  budget_fit: 0.2,
  career_market_fit: 0.2,
  visa_path_fit: 0.15,
  language_fit: 0.15,
  quality_of_life_fit: 0.15,
  community_fit: 0.1,
  climate_fit: 0.05,
};

const COUNTRY_BUCKETS: ScoreBucket[] = [
  { key: "excellent", min: 80 },
  { key: "strong", min: 65 },
  { key: "moderate", min: 50 },
  { key: "risky", min: 0 },
];

describe("clamp01OrNeutral (SQL rl_tool_clamp_neutral aynası)", () => {
  it("null/undefined/NaN → nötr 0.5", () => {
    expect(clamp01OrNeutral(null)).toBe(0.5);
    expect(clamp01OrNeutral(undefined)).toBe(0.5);
    expect(clamp01OrNeutral(NaN)).toBe(0.5);
  });
  it("aralık dışını kırpar, içini aynen döner", () => {
    expect(clamp01OrNeutral(-0.2)).toBe(0);
    expect(clamp01OrNeutral(1.5)).toBe(1);
    expect(clamp01OrNeutral(0.73)).toBe(0.73);
  });
});

describe("country_match ağırlık drift (SQL↔TS ayna kontratı)", () => {
  it("ağırlıkların toplamı tam 1.0 (docs/10tool/01 §4)", () => {
    const sum = Object.values(COUNTRY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });
});

describe("computeScoreBreakdown", () => {
  it("weights anahtar kümesini referans alır; eksik girdi nötr 0.5", () => {
    const breakdown = computeScoreBreakdown(
      { budget_fit: 0.9, career_market_fit: null, climate_fit: 1.5 },
      COUNTRY_WEIGHTS,
    );
    expect(breakdown.budget_fit).toBe(0.9);
    expect(breakdown.career_market_fit).toBe(0.5);
    expect(breakdown.climate_fit).toBe(1.0);
    expect(breakdown.language_fit).toBe(0.5); // hiç verilmedi
  });
});

describe("computeWeightedScore (SQL rl_tool_weighted_score aynası)", () => {
  it("tüm bileşenler 1.0 → 1.0", () => {
    const breakdown = Object.fromEntries(Object.keys(COUNTRY_WEIGHTS).map((k) => [k, 1]));
    expect(computeWeightedScore(breakdown, COUNTRY_WEIGHTS)).toBe(1);
  });
  it("ağırlık toplamı 1 değilse normalize eder", () => {
    expect(computeWeightedScore({ a: 1, b: 0 }, { a: 2, b: 1 })).toBeCloseTo(0.6667, 4);
  });
  it("eksik breakdown anahtarı nötr 0.5", () => {
    expect(computeWeightedScore({ a: 1 }, { a: 1, b: 1 })).toBeCloseTo(0.75, 4);
  });
  it("ağırlık toplamı 0 → 0", () => {
    expect(computeWeightedScore({ a: 1 }, {})).toBe(0);
  });
});

describe("toScore100 + resolveBucket (docs/10tool/01 bucket sınırları)", () => {
  it("0..1 skoru 0..100'e ölçekler", () => {
    expect(toScore100(0.842)).toBe(84.2);
    expect(toScore100(1)).toBe(100);
  });
  it("bucket eşiklerini birebir uygular", () => {
    expect(resolveBucket(84.2, COUNTRY_BUCKETS)).toBe("excellent");
    expect(resolveBucket(80, COUNTRY_BUCKETS)).toBe("excellent");
    expect(resolveBucket(72, COUNTRY_BUCKETS)).toBe("strong");
    expect(resolveBucket(55, COUNTRY_BUCKETS)).toBe("moderate");
    expect(resolveBucket(40, COUNTRY_BUCKETS)).toBe("risky");
  });
  it("bucket girişi sırasından bağımsız", () => {
    const shuffled: ScoreBucket[] = [
      { key: "risky", min: 0 },
      { key: "excellent", min: 80 },
      { key: "moderate", min: 50 },
      { key: "strong", min: 65 },
    ];
    expect(resolveBucket(90, shuffled)).toBe("excellent");
  });
});

import { describe, expect, it } from "vitest";

import {
  COUNTRY_WEIGHTS,
  DEAL_BREAKER_CAP,
  type CountryMetrics,
  type CountryPreferences,
  computeCountryBreakdown,
  computeCountryScore,
  countryBucket,
} from "@/lib/relocation-tools-country";

// docs/10tool/01 §4 — ağırlık + boyut türetme + deal-breaker cap aynası (SQL relocation_score_country_match_v1).

describe("COUNTRY_WEIGHTS (SQL↔TS ağırlık drift)", () => {
  it("ağırlıkların toplamı tam 1.0", () => {
    const sum = Object.values(COUNTRY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });
});

const strongCountry: CountryMetrics = {
  cost_index: 0.2,
  employment_index: 0.9,
  visa_complexity: 0.2,
  english_workability: 0.9,
  healthcare_index: 0.9,
  safety_index: 0.9,
  inclusion_index: 0.9,
  community_density: 0.8,
  climate_tags: ["mild"],
};

const fullPrefs: CountryPreferences = {
  monthly_budget: 2000,
  community_importance: 5,
  healthcare_priority: 5,
  safety_priority: 5,
  inclusion_priority: 5,
  language_profile: "english_only",
  climate_preference: "mild",
  visa_assets: ["eu_passport"],
};

describe("computeCountryBreakdown — güçlü ülke + maksimum öncelik", () => {
  it("yüksek skor, excellent/strong bucket", () => {
    const score = computeCountryScore(strongCountry, fullPrefs);
    expect(score).toBeGreaterThanOrEqual(80);
    expect(countryBucket(score)).toBe("excellent");
  });
});

describe("budget_fit — bütçe yoksa nötr 0.5", () => {
  it("monthly_budget verilmezse budget_fit 0.5", () => {
    const b = computeCountryBreakdown({ cost_index: 0 }, {});
    expect(b.budget_fit).toBe(0.5);
  });
  it("bütçe varsa ucuz ülke yüksek budget_fit (tax_burden_tolerance nötr 0.5)", () => {
    const b = computeCountryBreakdown({ cost_index: 0.2 }, { monthly_budget: 1500 });
    // (1 - 0.2) * 0.85 + 0.5 (nötr tax_burden_tolerance) * 0.15 = 0.755
    expect(b.budget_fit).toBeCloseTo(0.755, 4);
  });
  it("tax_burden_tolerance yüksekse budget_fit artar", () => {
    const b = computeCountryBreakdown(
      { cost_index: 0.2 },
      { monthly_budget: 1500, tax_burden_tolerance: 5 },
    );
    // (1 - 0.2) * 0.85 + 1.0 * 0.15 = 0.83
    expect(b.budget_fit).toBeCloseTo(0.83, 4);
  });
});

describe("deal-breaker cap — ilgili boyut 0.40'ta sınırlanır", () => {
  it("high_cost dealbreaker budget_fit'i cap'ler", () => {
    const without = computeCountryBreakdown(
      { cost_index: 0.1 },
      { monthly_budget: 1500 },
    );
    const withDb = computeCountryBreakdown(
      { cost_index: 0.1 },
      { monthly_budget: 1500, deal_breakers: ["high_cost"] },
    );
    expect(without.budget_fit).toBeGreaterThan(DEAL_BREAKER_CAP);
    expect(withDb.budget_fit).toBe(DEAL_BREAKER_CAP);
  });

  it("low_safety VEYA weak_healthcare quality_of_life_fit'i cap'ler", () => {
    const withDb = computeCountryBreakdown(strongCountry, {
      ...fullPrefs,
      deal_breakers: ["low_safety"],
    });
    expect(withDb.quality_of_life_fit).toBeLessThanOrEqual(DEAL_BREAKER_CAP);
  });
});

describe("language_fit — english_only ülkeye göre değişir", () => {
  it("english_only iken İngilizce-zayıf ülke düşük language_fit", () => {
    const weakEnglish = computeCountryBreakdown(
      { english_workability: 0.2 },
      { language_profile: "english_only" },
    );
    const openLang = computeCountryBreakdown(
      { english_workability: 0.2 },
      { language_profile: "open" },
    );
    // english_only: 0.2 ; open: 0.5 + 0.5*0.2 = 0.6
    expect(weakEnglish.language_fit).toBeCloseTo(0.2, 4);
    expect(openLang.language_fit).toBeCloseTo(0.6, 4);
  });
});

describe("climate_fit — etiket eşleşmesi", () => {
  it("tercih eşleşirse 1.0, eşleşmezse 0.3, fark etmezse 0.6", () => {
    expect(
      computeCountryBreakdown({ climate_tags: ["warm"] }, { climate_preference: "warm" })
        .climate_fit,
    ).toBe(1.0);
    expect(
      computeCountryBreakdown({ climate_tags: ["cold"] }, { climate_preference: "warm" })
        .climate_fit,
    ).toBe(0.3);
    expect(
      computeCountryBreakdown({ climate_tags: ["cold"] }, { climate_preference: "no_preference" })
        .climate_fit,
    ).toBe(0.6);
  });
});

describe("countryBucket — eşik sınırları", () => {
  it("80→excellent, 65→strong, 50→moderate, <50→risky", () => {
    expect(countryBucket(80)).toBe("excellent");
    expect(countryBucket(72)).toBe("strong");
    expect(countryBucket(55)).toBe("moderate");
    expect(countryBucket(40)).toBe("risky");
  });
});

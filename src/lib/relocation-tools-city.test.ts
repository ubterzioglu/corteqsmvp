import { describe, expect, it } from "vitest";

import {
  CITY_WEIGHTS,
  type CityFeatures,
  type CityPreferences,
  computeCityBreakdown,
  computeCityScore,
} from "@/lib/relocation-tools-city";

// docs/10tool/04 §4 — ağırlık + boyut türetme aynası (SQL relocation_score_city_match_v1).

describe("CITY_WEIGHTS (SQL↔TS ağırlık drift)", () => {
  it("ağırlıkların toplamı tam 1.0", () => {
    const sum = Object.values(CITY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });
});

const idealCity: CityFeatures = {
  cost_index: 0, // en ucuz
  housing_availability: 1,
  bureaucracy_complexity: 0, // en kolay
  gsm_coverage: 1,
  community_density: 1,
  safety_index: 1,
  healthcare_access: 1,
  flight_access: 1,
};

const maxPrefs: CityPreferences = {
  community_need: 5,
  safety_family: 5,
  airport_access: 5,
  industry_hub: 5,
  healthcare_priority: 5,
};

describe("computeCityBreakdown — ideal şehir + maksimum öncelik", () => {
  it("tüm boyutlar 1.0, skor 100", () => {
    const breakdown = computeCityBreakdown(idealCity, maxPrefs);
    for (const v of Object.values(breakdown)) {
      expect(v).toBeCloseTo(1.0, 4);
    }
    expect(computeCityScore(idealCity, maxPrefs)).toBe(100);
  });
});

describe("computeCityBreakdown — cost/bureaucracy ters çevrilir", () => {
  it("yüksek cost_index düşük budget_housing verir", () => {
    const cheap = computeCityBreakdown({ cost_index: 0, housing_availability: 1 }, {});
    const pricey = computeCityBreakdown({ cost_index: 1, housing_availability: 1 }, {});
    expect(cheap.budget_housing_fit).toBeGreaterThan(pricey.budget_housing_fit);
    // cheap: (1)*0.6 + 1*0.4 = 1.0 ; pricey: (0)*0.6 + 1*0.4 = 0.4
    expect(cheap.budget_housing_fit).toBeCloseTo(1.0, 4);
    expect(pricey.budget_housing_fit).toBeCloseTo(0.4, 4);
  });
});

describe("computeCityBreakdown — eksik veri (nötr 0.5)", () => {
  it("hiç feature/pref yoksa boyutlar nötr türetilir", () => {
    const breakdown = computeCityBreakdown({}, {});
    // budget = (1-0.5)*0.6 + 0.5*0.4 = 0.5
    expect(breakdown.budget_housing_fit).toBeCloseTo(0.5, 4);
    // lifestyle = gsm nötr 0.5
    expect(breakdown.lifestyle_fit).toBeCloseTo(0.5, 4);
    // community = 0.5 * (0.4 + 0.6*0.5) = 0.5 * 0.7 = 0.35
    expect(breakdown.community_fit).toBeCloseTo(0.35, 4);
  });
});

describe("computeCityBreakdown — tercih çarpanı", () => {
  it("yüksek community önceliği community_fit'i artırır", () => {
    const features: CityFeatures = { community_density: 1 };
    const low = computeCityBreakdown(features, { community_need: 1 });
    const high = computeCityBreakdown(features, { community_need: 5 });
    // low: 1 * (0.4 + 0.6*0) = 0.4 ; high: 1 * (0.4 + 0.6*1) = 1.0
    expect(low.community_fit).toBeCloseTo(0.4, 4);
    expect(high.community_fit).toBeCloseTo(1.0, 4);
  });
});

describe("computeCityScore — sıralama tutarlılığı", () => {
  it("daha iyi şehir daha yüksek skor alır", () => {
    const better = computeCityScore(idealCity, maxPrefs);
    const worse = computeCityScore(
      { cost_index: 1, housing_availability: 0, safety_index: 0, flight_access: 0 },
      maxPrefs,
    );
    expect(better).toBeGreaterThan(worse);
  });
});

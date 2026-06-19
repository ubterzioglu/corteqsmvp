import { describe, expect, it } from "vitest";

import {
  RELOCATION_RANK_WEIGHTS,
  blendFinalScore,
  computeRuleScore,
  computeScoreBreakdown,
  passesHardFilter,
  type RelocationLocationFeatures,
} from "@/lib/relocation-ranking";

describe("relocation-ranking ağırlıkları (SQL↔TS ayna kontratı)", () => {
  it("ağırlıkların toplamı tam olarak 1.0", () => {
    const sum = Object.values(RELOCATION_RANK_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it("ağırlıklar dokümandaki değerlerle birebir (relocation-engine-e2e.md §5)", () => {
    // Bu değerler SQL relocation_rank_locations_v1 ile birebir aynı OLMALI.
    // Değiştirirsen migration'daki ağırlıkları da güncelle (senkron sözleşmesi).
    expect(RELOCATION_RANK_WEIGHTS).toEqual({
      budget_fit: 0.3,
      bureaucracy_ease: 0.2,
      healthcare_access: 0.15,
      gsm_coverage: 0.15,
      community_fit: 0.1,
      flight_access: 0.1,
    });
  });
});

describe("computeScoreBreakdown", () => {
  it("null/bilinmiyor değerleri nötr 0.5'e çevirir", () => {
    const features = {
      budgetFit: null,
      bureaucracyEase: undefined,
      healthcareAccess: NaN,
      gsmCoverage: 0.9,
      communityFit: 1.5, // aralık dışı → kırp 1.0
      flightAccess: -0.2, // aralık dışı → kırp 0.0
    } as unknown as RelocationLocationFeatures;

    expect(computeScoreBreakdown(features)).toEqual({
      budget_fit: 0.5,
      bureaucracy_ease: 0.5,
      healthcare_access: 0.5,
      gsm_coverage: 0.9,
      community_fit: 1.0,
      flight_access: 0.0,
    });
  });
});

describe("computeRuleScore", () => {
  it("tüm bileşenler 1.0 ise skor 1.0", () => {
    const breakdown = {
      budget_fit: 1,
      bureaucracy_ease: 1,
      healthcare_access: 1,
      gsm_coverage: 1,
      community_fit: 1,
      flight_access: 1,
    };
    expect(computeRuleScore(breakdown)).toBe(1);
  });

  it("ağırlıklı toplam doğru (Berlin örneği)", () => {
    // budget 0.72, bürokrasi 0.35 (1-0.65), healthcare 0.85, gsm 0.90, community 0.91, flight 0.88
    const breakdown = {
      budget_fit: 0.72,
      bureaucracy_ease: 0.35,
      healthcare_access: 0.85,
      gsm_coverage: 0.9,
      community_fit: 0.91,
      flight_access: 0.88,
    };
    const expected =
      0.72 * 0.3 + 0.35 * 0.2 + 0.85 * 0.15 + 0.9 * 0.15 + 0.91 * 0.1 + 0.88 * 0.1;
    expect(computeRuleScore(breakdown)).toBeCloseTo(Math.round(expected * 10000) / 10000, 4);
  });
});

describe("blendFinalScore (Faz 3 hibrit harman)", () => {
  it("ml yokken veya alpha=0 iken rule skorunu aynen döner (cold-start)", () => {
    expect(blendFinalScore(0.8, null, 0.5)).toBe(0.8);
    expect(blendFinalScore(0.8, 0.2, 0)).toBe(0.8);
  });

  it("alpha ile rule ve ml'i harmanlar", () => {
    expect(blendFinalScore(0.8, 0.4, 0.5)).toBeCloseTo(0.6, 4);
  });

  it("alpha [0,1] aralığına kırpılır", () => {
    expect(blendFinalScore(0.8, 0.4, 5)).toBeCloseTo(0.4, 4); // alpha→1
  });
});

describe("passesHardFilter", () => {
  it("tüm koşullar sağlanırsa geçer", () => {
    expect(
      passesHardFilter({ targetCountryMatch: true, moveWindowValid: true, dataFresh: true }),
    ).toBe(true);
  });

  it("herhangi bir koşul başarısızsa düşer", () => {
    expect(
      passesHardFilter({ targetCountryMatch: false, moveWindowValid: true, dataFresh: true }),
    ).toBe(false);
    expect(
      passesHardFilter({ targetCountryMatch: true, moveWindowValid: false, dataFresh: true }),
    ).toBe(false);
    expect(
      passesHardFilter({ targetCountryMatch: true, moveWindowValid: true, dataFresh: false }),
    ).toBe(false);
  });
});

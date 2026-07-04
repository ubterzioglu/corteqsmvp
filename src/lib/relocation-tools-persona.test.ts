import { describe, expect, it } from "vitest";

import {
  type PersonaAnswers,
  computePersonaScores,
  resolvePersona,
} from "@/lib/relocation-tools-persona";

// docs/10tool/07 §4 — persona skor ağırlık aynası (SQL relocation_score_expat_lifestyle_persona_v1).

describe("computePersonaScores — eksik veri (nötr fallback)", () => {
  it("hiç cevap yoksa tüm scale 0.5 nötr alınır", () => {
    const scores = computePersonaScores({});
    // global = 0.5*0.3 + 0.5*0.2 + 0.5*0.2 + 0.5*0.15 + 0.5*0.1 = 0.475
    expect(scores.global_networker).toBeCloseTo(0.475, 4);
    // quiet = 0.5*0.25 + 0.5*0.2 + 0.5*0.15 + 0.5*0.1 + 0.5*0.15 + 0.5*0.1 = 0.475
    expect(scores.quiet_local).toBeCloseTo(0.475, 4);
    // community = 0.5*0.35 + 0.5*0.2 + 0.5*0.15 + 0.5*0.15 + 0.5*0.05 = 0.45
    expect(scores.community_anchor).toBeCloseTo(0.45, 4);
  });
});

describe("computePersonaScores — net persona sinyalleri", () => {
  it("yüksek sosyal + kariyer + şehir + network etkinliği → global_networker en yüksek", () => {
    const answers: PersonaAnswers = {
      weekend_style: "network_event",
      social_energy: 5,
      career_focus: 5,
      city_vs_nature: 5,
      planning_style: 3,
      local_language: 3,
      community_need: 1,
      comfort_zone: 3,
      family_rhythm: 1,
    };
    const scores = computePersonaScores(answers);
    const { topKey } = resolvePersona(scores);
    expect(["global_networker", "career_builder"]).toContain(topKey);
    // global = 1*0.3 + 1*0.2 + 1*0.2 + 0.5(nötr pace)*0.15 + 0.5(nötr hobbySocial)*0.1 + 0.15 = 0.975
    expect(scores.global_networker).toBeCloseTo(0.975, 4);
  });

  it("yüksek aile + düşük konfor/spontanlık → family_planner", () => {
    const answers: PersonaAnswers = {
      weekend_style: "family_market",
      family_rhythm: 5,
      comfort_zone: 1,
      planning_style: 1,
      social_energy: 1,
    };
    const scores = computePersonaScores(answers);
    // family = 1*0.35 + 1*0.15 + 1*0.15 + 1*0.1 + 0.5(nötr settle)*0.15 + 0.5(nötr finRisk)*0.1 + 0.15 = 1.025
    expect(scores.family_planner).toBeCloseTo(1.025, 4);
    expect(resolvePersona(scores).topKey).toBe("family_planner");
  });

  it("yüksek topluluk ihtiyacı + dil denemesi → community_anchor", () => {
    const scores = computePersonaScores({
      community_need: 5,
      local_language: 5,
      social_energy: 3,
    });
    // community = 1*0.35 + 1*0.2 + 0.5*0.15 + 0.5(nötr cultureCuriosity)*0.15 + 0.5(nötr settle)*0.05 = 0.725
    expect(scores.community_anchor).toBeCloseTo(0.725, 4);
    expect(resolvePersona(scores).topKey).toBe("community_anchor");
  });

  it("spontane + konfor dışı + doğa → adventure_seeker", () => {
    const scores = computePersonaScores({
      weekend_style: "hiking",
      planning_style: 5,
      comfort_zone: 5,
      city_vs_nature: 1,
      local_language: 5,
    });
    // adventure = 1*0.25 + 1*0.25 + 1*0.1 + 1*0.1 + 0.5(nötr travel)*0.1 + 0.5(nötr outdoor)*0.1
    //   + 0.5(nötr cuisine)*0.05 + 0.5(nötr cultureCuriosity)*0.05 + 0.15 = 1.0
    expect(scores.adventure_seeker).toBeCloseTo(1.0, 4);
    expect(resolvePersona(scores).topKey).toBe("adventure_seeker");
  });
});

describe("resolvePersona — hibrit (eşitlik)", () => {
  it("tüm nötr → ilk iki eşit, hibrit işaretlenir", () => {
    const result = resolvePersona(computePersonaScores({}));
    expect(result.isHybrid).toBe(true);
    expect(result.secondaryKey).not.toBeNull();
  });

  it("net kazanan varsa hibrit değil", () => {
    // Güçlü aile sinyali tek başına family_planner'ı ayrıştırır (global/career düşük kalır).
    const result = resolvePersona(
      computePersonaScores({
        weekend_style: "family_market",
        family_rhythm: 5,
        comfort_zone: 1,
        planning_style: 1,
        social_energy: 1,
        career_focus: 1,
        city_vs_nature: 1,
      }),
    );
    expect(result.topKey).toBe("family_planner");
    expect(result.isHybrid).toBe(false);
    expect(result.secondaryKey).toBeNull();
  });
});

describe("computePersonaScores — uç değerler kırpılır", () => {
  it("aralık dışı scale değerleri 0..1'e kırpılır (clamp_neutral)", () => {
    // social_energy = 9 → (9-1)/4 = 2 → kırp 1
    const scores = computePersonaScores({ social_energy: 9 });
    // global'de social katkısı 1*0.3; career/city/pace/hobbySocial nötr 0.5
    expect(scores.global_networker).toBeCloseTo(
      1 * 0.3 + 0.5 * 0.2 + 0.5 * 0.2 + 0.5 * 0.15 + 0.5 * 0.1,
      4,
    );
  });
});

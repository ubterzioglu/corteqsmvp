import { describe, expect, it } from "vitest";

import {
  DIASPORA_WEIGHTS,
  type CandidateVector,
  type RequesterVector,
  computeDiasporaBreakdown,
  computeDiasporaScore,
} from "@/lib/relocation-tools-diaspora";

// docs/10tool/05 §4 — uyum ağırlıkları + boyut türetme aynası (SQL relocation_score_diaspora_matchmaker_v1).

describe("DIASPORA_WEIGHTS (SQL↔TS ağırlık drift)", () => {
  it("ağırlıkların toplamı tam 1.0", () => {
    const sum = Object.values(DIASPORA_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });
});

const me: RequesterVector = {
  needs: ["job", "housing"],
  offers: ["language_practice"],
  languages: ["tr", "en"],
  targetCountry: "DE",
  profession: "software_engineer",
};

describe("need_offer_complementarity — tamamlayıcılık", () => {
  it("adayın teklifi benim ihtiyacımı karşılarsa yüksek", () => {
    const cand: CandidateVector = {
      needs: ["language_practice"],
      offers: ["job", "housing"],
      languages: ["tr"],
      targetCountryCodes: ["DE"],
      professionTags: ["software_engineer"],
      trustSignals: ["completed_profile"],
      maxMonthlyIntros: 3,
    };
    const b = computeDiasporaBreakdown(me, cand);
    // me.needs ∩ cand.offers = {job,housing}=2/2=1 *0.6 ; me.offers ∩ cand.needs = {language_practice}=1/1=1 *0.4 → 1.0
    expect(b.need_offer_complementarity).toBeCloseTo(1.0, 4);
  });

  it("hiç örtüşme yoksa 0", () => {
    const cand: CandidateVector = {
      needs: ["visa"],
      offers: ["cv_review"],
      languages: ["de"],
      targetCountryCodes: ["NL"],
      professionTags: ["teacher"],
      trustSignals: [],
      maxMonthlyIntros: 0,
    };
    expect(computeDiasporaBreakdown(me, cand).need_offer_complementarity).toBe(0);
  });
});

describe("geo / field / language boyutları", () => {
  const baseCand: CandidateVector = {
    needs: [],
    offers: [],
    languages: ["en"],
    targetCountryCodes: ["DE"],
    currentCountry: "DE",
    professionTags: ["software_engineer"],
    trustSignals: [],
    maxMonthlyIntros: 3,
  };

  it("aynı hedef ülke → geo 1.0", () => {
    expect(computeDiasporaBreakdown(me, baseCand).geo_proximity).toBe(1.0);
  });
  it("aynı meslek, konu ilgisi yoksa (nötr 0.5) → field 0.85", () => {
    // field = professionField(1.0)*0.7 + topicOverlap(nötr 0.5, ikisinde de topicInterests yok)*0.3 = 0.85
    expect(computeDiasporaBreakdown(me, baseCand).field_overlap).toBeCloseTo(0.85, 4);
  });
  it("ortak dil, response_time verilmezse → language_timezone_fit 0.9 (0.9 çarpanı); ortak yoksa 0.27", () => {
    // langMatch(1.0) * responseMatch(0.9, responseTimeExpectation verilmedi) = 0.9
    expect(computeDiasporaBreakdown(me, baseCand).language_timezone_fit).toBeCloseTo(0.9, 4);
    const noLang = { ...baseCand, languages: ["fr"] };
    // langMatch(0.3) * responseMatch(0.9) = 0.27
    expect(computeDiasporaBreakdown(me, noLang).language_timezone_fit).toBeCloseTo(0.27, 4);
  });
});

describe("trust + reciprocity", () => {
  it("3 trust sinyali + tecrübe yılı yoksa → 0.7; reciprocity max_intros ile artar", () => {
    const cand: CandidateVector = {
      needs: [], offers: [], languages: ["tr"], targetCountryCodes: [],
      professionTags: [], trustSignals: ["completed_profile", "catalog_claim", "phone_verified"],
      maxMonthlyIntros: 5,
    };
    const b = computeDiasporaBreakdown(me, cand);
    // trust = trustBase(1.0)*0.7 + experienceBonus(0, tecrübe yılı yok)*0.3 = 0.7
    expect(b.trust_profile_completeness).toBeCloseTo(0.7, 4);
    // reciprocity = 0.4 + min(5/5,0.6) = 1.0 (preferredGroupSize mismatch yok)
    expect(b.reciprocity_recent_activity).toBe(1.0);
  });

  it("tecrübe yılı verilirse trust_profile_completeness artar", () => {
    const cand: CandidateVector = {
      needs: [], offers: [], languages: ["tr"], targetCountryCodes: [],
      professionTags: [], trustSignals: ["completed_profile", "catalog_claim", "phone_verified"],
      maxMonthlyIntros: 5,
      experienceYearsInTarget: 5,
    };
    // trust = 1.0*0.7 + min(5/5,1)*0.3 = 1.0
    expect(computeDiasporaBreakdown(me, cand).trust_profile_completeness).toBeCloseTo(1.0, 4);
  });
});

describe("computeDiasporaScore — güçlü eşleşme yüksek skor", () => {
  it("tüm boyutlar güçlü → yüksek skor", () => {
    const cand: CandidateVector = {
      needs: ["language_practice"],
      offers: ["job", "housing"],
      languages: ["tr", "en"],
      targetCountryCodes: ["DE"],
      currentCountry: "DE",
      professionTags: ["software_engineer"],
      trustSignals: ["completed_profile", "catalog_claim", "phone_verified"],
      maxMonthlyIntros: 5,
    };
    expect(computeDiasporaScore(me, cand)).toBeGreaterThanOrEqual(90);
  });

  it("eksik/zayıf aday → düşük skor", () => {
    const weak: CandidateVector = {
      needs: ["visa"], offers: ["recruiting"], languages: ["fr"],
      targetCountryCodes: ["NL"], professionTags: ["teacher"], trustSignals: [], maxMonthlyIntros: 0,
    };
    expect(computeDiasporaScore(me, weak)).toBeLessThan(computeDiasporaScore(me, {
      needs: ["language_practice"], offers: ["job", "housing"], languages: ["tr"],
      targetCountryCodes: ["DE"], professionTags: ["software_engineer"],
      trustSignals: ["completed_profile"], maxMonthlyIntros: 3,
    }));
  });
});

import { describe, expect, it } from "vitest";

import {
  type ChallengeAnswers,
  computeChallengeScores,
  resolveChallenge,
} from "@/lib/relocation-tools-challenge";

// docs/10tool/09 §4 — kategori skor formülü aynası (SQL relocation_score_top_challenge_v1).
// category_score = user_stress*0.35 + progress_blocker*0.35 + urgency*risk*0.20 + dependency*0.10

describe("computeChallengeScores — net iş/gelir engeli", () => {
  it("job stress + blocked + yakın takvim + düşük güven + not_started → job_income en yüksek", () => {
    const answers: ChallengeAnswers = {
      stressors: ["job", "money"],
      blocked_progress: ["job"],
      urgency: "0-1m", // mult 1.0
      confidence: 1, // risk = (1-0)*0.85 + 0.5(nötr paralysis)*0.1 + 0.5(nötr action)*0.05 = 0.925
      income_state: "not_started", // dependency 1.0
    };
    const scores = computeChallengeScores(answers);
    // job_income = 0.35 + 0.35 + (1.0*0.925)*0.2 + 1.0*0.1 = 0.985
    expect(scores.job_income).toBeCloseTo(0.985, 4);
    expect(resolveChallenge(scores).primary).toBe("job_income");
  });
});

describe("computeChallengeScores — urgency çarpanları", () => {
  it("uzak takvim (6m+) urgency katkısını düşürür", () => {
    const near = computeChallengeScores({ urgency: "0-1m", confidence: 1 });
    const far = computeChallengeScores({ urgency: "6m+", confidence: 1 });
    // risk = 0.925 (yukarıdaki gibi); near: 1.0*0.925*0.2 = 0.185 ; far: 0.25*0.925*0.2 = 0.0463
    expect(near.language).toBeCloseTo(0.185, 4);
    expect(far.language).toBeCloseTo(0.0463, 4);
  });
});

describe("computeChallengeScores — eksik veri (güvenli fallback)", () => {
  it("hiç cevap yoksa urgency 0.5 + risk 0.5 → tüm kategoriler 0.05", () => {
    const scores = computeChallengeScores({});
    // 0 + 0 + (0.5*0.5)*0.2 + 0 = 0.05
    for (const v of Object.values(scores)) {
      expect(v).toBeCloseTo(0.05, 4);
    }
  });
});

describe("computeChallengeScores — visa/paperwork → visa_docs eşlemesi", () => {
  it("paperwork stress visa_docs'a sayılır", () => {
    const scores = computeChallengeScores({
      stressors: ["paperwork"],
      blocked_progress: ["visa"],
      documents_state: "confused",
      urgency: "3-6m",
      confidence: 3,
    });
    // visa_docs = 0.35 (paperwork→stress) + 0.35 (visa→blocked) + (0.5*0.5)*0.2 + 1.0*0.1 = 0.85
    expect(scores.visa_docs).toBeCloseTo(0.85, 4);
    expect(resolveChallenge(scores).primary).toBe("visa_docs");
  });
});

describe("computeChallengeScores — healthcare_family dependency", () => {
  it("'none' dışı sağlık/aile karmaşıklığı dependency 1.0 verir", () => {
    const withComplexity = computeChallengeScores({
      stressors: ["healthcare"],
      health_family_complexity: ["children"],
    });
    const onlyNone = computeChallengeScores({
      stressors: ["healthcare"],
      health_family_complexity: ["none"],
    });
    expect(withComplexity.healthcare_family).toBeGreaterThan(onlyNone.healthcare_family);
  });
});

describe("computeChallengeScores — YENİ housing/language/finance derinlik sinyalleri", () => {
  it("housing_state=not_started housing dependency'yi 1.0 yapar", () => {
    const scores = computeChallengeScores({ housing_state: "not_started" });
    expect(scores.housing).toBeGreaterThan(computeChallengeScores({}).housing);
  });
  it("language_state=stuck language dependency'yi 1.0 yapar", () => {
    const scores = computeChallengeScores({ language_state: "stuck" });
    expect(scores.language).toBeGreaterThan(computeChallengeScores({}).language);
  });
  it("finance_state=critical + budget_buffer=no finance dependency'yi maksimize eder", () => {
    const scores = computeChallengeScores({ finance_state: "critical", budget_buffer: "no" });
    const baseline = computeChallengeScores({});
    expect(scores.finance).toBeGreaterThan(baseline.finance);
  });
});

describe("resolveChallenge — ilk 3 + eşitlikte alfabetik", () => {
  it("tüm eşit (boş) ise alfabetik ilk = community_support, ilk 3 döner", () => {
    const result = resolveChallenge(computeChallengeScores({}));
    expect(result.top3).toHaveLength(3);
    // eşitlikte cat_key alfabetik: community_support < credential_recognition < finance...
    expect(result.primary).toBe("community_support");
    expect(result.top3[0].label).toBe("Topluluk & Destek");
  });
});

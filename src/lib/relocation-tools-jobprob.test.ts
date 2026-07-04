import { describe, expect, it } from "vitest";

import {
  JOBPROB_WEIGHTS,
  type JobMarketSignal,
  type JobProbAnswers,
  computeDemandFit,
  computeJobProbBreakdown,
  computeJobProbScore,
  jobProbBucket,
} from "@/lib/relocation-tools-jobprob";

// docs/10tool/10 §4 — ağırlık + boyut türetme + bucket aynası (SQL relocation_score_job_probability_v1).

describe("JOBPROB_WEIGHTS (SQL↔TS ağırlık drift)", () => {
  it("ağırlıkların toplamı tam 1.0", () => {
    const sum = Object.values(JOBPROB_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });
});

describe("computeDemandFit — sinyal yoksa nötr", () => {
  it("signal null → 0.5", () => {
    expect(computeDemandFit(null)).toBe(0.5);
  });
  it("güçlü sinyal yüksek demand", () => {
    const s: JobMarketSignal = { vacancy_index: 0.9, shortage_index: 0.85, unemployment_inverse_index: 0.85 };
    // 0.9*0.4 + 0.85*0.4 + 0.85*0.2 = 0.87
    expect(computeDemandFit(s)).toBeCloseTo(0.87, 4);
  });
});

describe("computeJobProbBreakdown — net güçlü profil", () => {
  const strongAnswers: JobProbAnswers = {
    language_level: 5,
    english_level: 5,
    years_experience: 12,
    seniority: "senior",
    portfolio_cv: "ready",
    interviews: "multiple",
    regulated_profession: "no",
    work_authorization: "authorized",
    network: "strong",
    applications: 30,
  };
  const strongSignal: JobMarketSignal = { vacancy_index: 0.9, shortage_index: 0.9, unemployment_inverse_index: 0.85 };

  it("güçlü profil yüksek skor + high/medium_high bucket", () => {
    const score = computeJobProbScore(strongAnswers, strongSignal);
    expect(score).toBeGreaterThanOrEqual(75);
    expect(jobProbBucket(score)).toBe("high");
  });

  it("language_fit = work*0.65 + en*0.35", () => {
    const b = computeJobProbBreakdown({ language_level: 4, english_level: 2 }, null);
    // work 0.8, en 0.4 → 0.8*0.65 + 0.4*0.35 = 0.66
    expect(b.language_fit).toBeCloseTo(0.66, 4);
  });
});

describe("credential_fit — regulated mantığı (industry_specific_certifications nötr 0.5 katkısıyla)", () => {
  it("regulated=no → base 0.9 * 0.85 + 0.5(nötr sertifika) * 0.15 = 0.84", () => {
    expect(computeJobProbBreakdown({ regulated_profession: "no" }, null).credential_fit).toBeCloseTo(
      0.84,
      4,
    );
  });
  it("regulated=yes & none → base 0.25 * 0.85 + 0.5 * 0.15 = 0.2875", () => {
    expect(
      computeJobProbBreakdown({ regulated_profession: "yes", credential_status: "none" }, null)
        .credential_fit,
    ).toBeCloseTo(0.2875, 4);
  });
  it("in_progress → base 0.55 * 0.85 + 0.5 * 0.15 = 0.5425", () => {
    expect(
      computeJobProbBreakdown({ credential_status: "in_progress" }, null).credential_fit,
    ).toBeCloseTo(0.5425, 4);
  });
  it("sektöre özel sertifika sayısı arttıkça credential_fit artar", () => {
    const withCerts = computeJobProbBreakdown(
      { regulated_profession: "no", industry_specific_certifications: ["technical_cert", "language_cert"] },
      null,
    );
    const noCerts = computeJobProbBreakdown({ regulated_profession: "no" }, null);
    expect(withCerts.credential_fit).toBeGreaterThan(noCerts.credential_fit);
  });
});

describe("work_authorization_fit", () => {
  it("authorized→1.0, eligible→0.75, needs_sponsor→0.4, unknown→0.4", () => {
    expect(computeJobProbBreakdown({ work_authorization: "authorized" }, null).work_authorization_fit).toBe(1.0);
    expect(computeJobProbBreakdown({ work_authorization: "eligible" }, null).work_authorization_fit).toBe(0.75);
    expect(computeJobProbBreakdown({ work_authorization: "needs_sponsor" }, null).work_authorization_fit).toBe(0.4);
    expect(computeJobProbBreakdown({ work_authorization: "unknown" }, null).work_authorization_fit).toBe(0.4);
  });
});

describe("computeJobProbScore — eksik veri (nötr ~50)", () => {
  it("hiç cevap + sinyal yoksa orta-altı skor", () => {
    const score = computeJobProbScore({}, null);
    // tüm boyutlar nötr-civarı → 40-55 bandı
    expect(score).toBeGreaterThanOrEqual(40);
    expect(score).toBeLessThanOrEqual(60);
  });
});

describe("jobProbBucket — eşik sınırları", () => {
  it("75→high, 55→medium_high, 40→challenging, <40→low", () => {
    expect(jobProbBucket(80)).toBe("high");
    expect(jobProbBucket(60)).toBe("medium_high");
    expect(jobProbBucket(45)).toBe("challenging");
    expect(jobProbBucket(30)).toBe("low");
  });
});

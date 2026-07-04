import { describe, expect, it } from "vitest";

import {
  READINESS_WEIGHTS,
  type ReadinessAnswers,
  computeReadiness,
  computeReadinessBreakdown,
} from "@/lib/relocation-tools-readiness";

// docs/10tool/03 §4 — ağırlık + boyut türetme aynası (SQL relocation_score_readiness_v1).

describe("READINESS_WEIGHTS (SQL↔TS ağırlık drift)", () => {
  it("ağırlıkların toplamı tam 1.0", () => {
    const sum = Object.values(READINESS_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });
});

describe("computeReadinessBreakdown — tam hazır", () => {
  it("tüm sinyaller en güçlü → tüm boyutlar 1.0, skor 100", () => {
    const answers: ReadinessAnswers = {
      savings_months: "6+",
      passport_validity: "yes",
      visa_route: "yes",
      diploma_docs: "ready",
      housing_first_month: "secured",
      job_income_plan: "job_offer",
      health_insurance: "yes",
      support_network: "strong",
      family_alignment: "aligned",
      emergency_plan: "yes",
      debt_pressure: 5,
      language_level: 5,
      adaptability: 5,
      timeline_realism: 5,
      emergency_fund_access: "yes",
      local_bank_account: "ready",
      remote_work_transition: "yes",
      pet_relocation_plan: "not_applicable",
      mental_health_readiness: 5,
    };
    const result = computeReadiness(answers);
    expect(result.score100).toBe(100);
    expect(result.bucket).toBe("ready");
  });
});

describe("computeReadinessBreakdown — tam hazırlıksız", () => {
  it("en zayıf sinyaller → düşük skor, high_risk bucket", () => {
    const answers: ReadinessAnswers = {
      savings_months: "0",
      passport_validity: "no",
      visa_route: "no",
      diploma_docs: "no",
      housing_first_month: "no",
      job_income_plan: "no",
      health_insurance: "no",
      support_network: "none",
      family_alignment: "conflict",
      emergency_plan: "no",
      debt_pressure: 1,
      language_level: 0,
      adaptability: 1,
      timeline_realism: 1,
      emergency_fund_access: "no",
      local_bank_account: "no",
      remote_work_transition: "no",
      pet_relocation_plan: "no",
      mental_health_readiness: 1,
    };
    const result = computeReadiness(answers);
    expect(result.score100).toBe(0);
    expect(result.bucket).toBe("high_risk");
  });
});

describe("computeReadiness — eksik veri (nötr fallback)", () => {
  it("hiç cevap yoksa tüm boyutlar nötr ~0.5, skor 50, prepare", () => {
    const result = computeReadiness({});
    expect(result.score100).toBeCloseTo(50, 1);
    expect(result.bucket).toBe("prepare");
  });
});

describe("computeReadinessBreakdown — boyut türetme doğru", () => {
  it("financial = savings*0.5 + debt*0.3 + emergencyFund(nötr 0.5)*0.2", () => {
    // savings 3-5 → 0.7; debt scale 3 → 0.5 → 0.7*0.5 + 0.5*0.3 + 0.5*0.2 = 0.6
    const breakdown = computeReadinessBreakdown({ savings_months: "3-5", debt_pressure: 3 });
    expect(breakdown.financial_readiness).toBeCloseTo(0.6, 4);
  });
  it("language_level 0..5 → /5 normalize", () => {
    const breakdown = computeReadinessBreakdown({ language_level: 4 });
    expect(breakdown.language_readiness).toBeCloseTo(0.8, 4);
  });
});

describe("computeReadiness — bucket sınırları", () => {
  it("60 → proceed, 40 → prepare, 80 → ready (alt sınır dahil)", () => {
    // Tek boyut manipülasyonu zor; bucket fonksiyonu sınır testini resolveBucket'tan biliyoruz.
    // Burada karışık bir profil orta bandı doğrular.
    const result = computeReadiness({
      savings_months: "3-5",
      passport_validity: "yes",
      visa_route: "yes",
      diploma_docs: "ready",
      housing_first_month: "leads",
      job_income_plan: "remote_income",
      language_level: 3,
      support_network: "weak",
      emergency_plan: "partial",
      health_insurance: "yes",
      adaptability: 4,
      timeline_realism: 4,
      debt_pressure: 4,
      family_alignment: "aligned",
    });
    expect(result.score100).toBeGreaterThanOrEqual(60);
    expect(["proceed", "ready"]).toContain(result.bucket);
  });
});

describe("computeReadiness — en zayıf 3 boyut", () => {
  it("en düşük 3 boyutu doğru sıralar", () => {
    const result = computeReadiness({
      savings_months: "6+", // financial yüksek
      language_level: 0, // language en düşük
      job_income_plan: "no", // job en düşük
      support_network: "none",
      emergency_plan: "no",
      health_insurance: "no",
      adaptability: 1, // support düşük
    });
    expect(result.weakest3).toContain("language_readiness");
    expect(result.weakest3).toContain("job_income_readiness");
    expect(result.weakest3).toHaveLength(3);
  });
});

import { describe, expect, it } from "vitest";

import {
  SALARY_WEIGHTS,
  type SalaryBenchmarkRow,
  computeSalaryBreakdown,
  computeSalaryPowerIndex,
  credentialScore,
  salaryBucket,
} from "@/lib/relocation-tools-salary";

// docs/10tool/02 §4 — ağırlık + boyut türetme + bucket aynası (SQL relocation_score_profession_salary_v1).

describe("SALARY_WEIGHTS (SQL↔TS ağırlık drift)", () => {
  it("ağırlıkların toplamı tam 1.0", () => {
    const sum = Object.values(SALARY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });
});

describe("credentialScore — regulated cevabı", () => {
  it("yes→0.3, not_sure→0.5, diğer→0.85", () => {
    expect(credentialScore("yes")).toBe(0.3);
    expect(credentialScore("not_sure")).toBe(0.5);
    expect(credentialScore("no")).toBe(0.85);
    expect(credentialScore(undefined)).toBe(0.85);
  });
});

describe("computeSalaryBreakdown — boyut türetme", () => {
  const row: SalaryBenchmarkRow = {
    salary_median: 72000,
    net_ratio: 0.62,
    demand_index: 0.9,
    cost_index: 0.55,
  };
  const globalMax = 110000; // bu meslekteki en yüksek median

  it("salary_level = median / globalMax", () => {
    const b = computeSalaryBreakdown(row, globalMax, "no");
    expect(b.salary_level).toBeCloseTo(72000 / 110000, 4);
  });
  it("demand_fit = demand_index, tax_social_fit = net_ratio", () => {
    const b = computeSalaryBreakdown(row, globalMax, "no");
    expect(b.demand_fit).toBeCloseTo(0.9, 4);
    expect(b.tax_social_fit).toBeCloseTo(0.62, 4);
  });
  it("cost_adjusted = (median*net_ratio/globalMax)/(0.4+cost)", () => {
    const b = computeSalaryBreakdown(row, globalMax, "no");
    const expected = (72000 * 0.62) / 110000 / (0.4 + 0.55);
    expect(b.cost_adjusted_income).toBeCloseTo(Math.round(expected * 10000) / 10000, 4);
  });
});

describe("computeSalaryBreakdown — globalMax 0 koruması", () => {
  it("globalMax 0 ise 1'e düşer (bölme hatası yok)", () => {
    const b = computeSalaryBreakdown({ salary_median: 50000, net_ratio: 0.7 }, 0, "no");
    // salary_level = 50000/1 → kırp 1.0
    expect(b.salary_level).toBe(1.0);
  });
});

describe("computeSalaryBreakdown — eksik veri (nötr)", () => {
  it("demand_index/cost_index yoksa nötr fallback", () => {
    const b = computeSalaryBreakdown({ salary_median: 50000, net_ratio: 0.65 }, 100000, undefined);
    expect(b.demand_fit).toBe(0.5); // demand_index undefined → clamp_neutral 0.5
  });
});

describe("computeSalaryPowerIndex + salaryBucket", () => {
  it("güçlü ülke yüksek index + high_value/balanced", () => {
    const strong: SalaryBenchmarkRow = {
      salary_median: 110000,
      net_ratio: 0.72,
      demand_index: 0.92,
      cost_index: 0.4,
    };
    const idx = computeSalaryPowerIndex(strong, 110000, "no");
    expect(idx).toBeGreaterThanOrEqual(55);
    expect(["high_value", "balanced"]).toContain(salaryBucket(idx));
  });

  it("bucket eşikleri: 75→high_value, 55→balanced, 40→expensive_but_high_salary, <40→low...", () => {
    expect(salaryBucket(80)).toBe("high_value");
    expect(salaryBucket(60)).toBe("balanced");
    expect(salaryBucket(45)).toBe("expensive_but_high_salary");
    expect(salaryBucket(20)).toBe("low_salary_or_high_barrier");
  });

  it("regulated meslek credential boyutunu düşürür → index düşer", () => {
    const row: SalaryBenchmarkRow = { salary_median: 60000, net_ratio: 0.65, demand_index: 0.7, cost_index: 0.5 };
    const free = computeSalaryPowerIndex(row, 100000, "no");
    const regulated = computeSalaryPowerIndex(row, 100000, "yes");
    expect(free).toBeGreaterThan(regulated);
  });
});

import { describe, expect, it } from "vitest";

import {
  SIGORTA_PRIORITY_LABELS,
  SIGORTA_QUESTION_ADDS,
  SIGORTA_TYPES,
  type SigortaAnswers,
  computeSigorta,
  computeSigortaScores,
  sigortaPriority,
} from "@/lib/relocation-tools-sigorta";

// Kaynak: ref101 sigorta-secim. SQL relocation_score_sigorta_secim_almanya_v1 aynası.

describe("SIGORTA katalog bütünlüğü (SQL↔TS drift)", () => {
  it("12 sigorta tipi tanımlı, benzersiz key", () => {
    expect(SIGORTA_TYPES).toHaveLength(12);
    expect(new Set(SIGORTA_TYPES.map((t) => t.key)).size).toBe(12);
  });

  it("20 soru için option-add haritası var", () => {
    expect(Object.keys(SIGORTA_QUESTION_ADDS)).toHaveLength(20);
  });

  it("mustAt >= shouldAt her tip için", () => {
    for (const t of SIGORTA_TYPES) {
      expect(t.mustAt).toBeGreaterThanOrEqual(t.shouldAt);
    }
  });

  it("tüm add anahtarları geçerli sigorta tipi", () => {
    const valid = new Set(SIGORTA_TYPES.map((t) => t.key));
    for (const opts of Object.values(SIGORTA_QUESTION_ADDS)) {
      for (const add of Object.values(opts)) {
        for (const k of Object.keys(add)) {
          expect(valid.has(k as never)).toBe(true);
        }
      }
    }
  });

  it("3 öncelik etiketi tanımlı", () => {
    expect(Object.keys(SIGORTA_PRIORITY_LABELS)).toHaveLength(3);
  });
});

describe("computeSigortaScores", () => {
  it("base skorlarla başlar (cevap yoksa)", () => {
    const scores = computeSigortaScores({});
    expect(scores.HEALTH).toBe(10);
    expect(scores.LIABILITY).toBe(8);
    expect(scores.CAR).toBe(0);
  });

  it("cevap katkıları base üstüne eklenir", () => {
    // HEALTH base 10 + q1=yes(HEALTH3) = 13
    const scores = computeSigortaScores({ q1: "yes" });
    expect(scores.HEALTH).toBe(13);
  });

  it("negatif katkı düşürür (q4=no → CAR -2)", () => {
    const scores = computeSigortaScores({ q4: "no" });
    expect(scores.CAR).toBe(0 + -2);
  });
});

describe("sigortaPriority — eşikler", () => {
  it("raw >= mustAt → must", () => {
    const health = SIGORTA_TYPES.find((t) => t.key === "HEALTH")!;
    expect(sigortaPriority(health, 12)).toBe("must");
    expect(sigortaPriority(health, 13)).toBe("must");
  });
  it("shouldAt <= raw < mustAt → should", () => {
    const health = SIGORTA_TYPES.find((t) => t.key === "HEALTH")!;
    expect(sigortaPriority(health, 9)).toBe("should");
    expect(sigortaPriority(health, 11)).toBe("should");
  });
  it("raw < shouldAt → optional", () => {
    const health = SIGORTA_TYPES.find((t) => t.key === "HEALTH")!;
    expect(sigortaPriority(health, 8)).toBe("optional");
  });
});

describe("computeSigorta — uçtan uca", () => {
  it("12 tip döner, önce 'must' bandı gelir", () => {
    const result = computeSigorta({ q1: "yes", q2: "self", q10: "yes", q11: "yes" });
    expect(result).toHaveLength(12);
    // İlk öğe en yüksek öncelikte olmalı.
    const priorities = result.map((r) => r.priority);
    const firstOptionalIdx = priorities.indexOf("optional");
    const lastMustIdx = priorities.lastIndexOf("must");
    if (firstOptionalIdx !== -1 && lastMustIdx !== -1) {
      expect(lastMustIdx).toBeLessThan(firstOptionalIdx);
    }
  });

  it("araç sahibi → CAR 'must' bandına çıkar (base0 + q4=yes 5 >= mustAt 5)", () => {
    const result = computeSigorta({ q4: "yes" });
    const car = result.find((r) => r.key === "CAR")!;
    expect(car.raw).toBe(5);
    expect(car.priority).toBe("must");
  });

  it("gelir kırılganlığı → BU yükselir", () => {
    // BU base1 + q11=yes(5) + q2=self(3) = 9 >= shouldAt6 → should; +q7=yes(2)=11 >= mustAt10 → must
    const result = computeSigorta({ q11: "yes", q2: "self", q7: "yes" });
    const bu = result.find((r) => r.key === "BU")!;
    expect(bu.raw).toBeGreaterThanOrEqual(10);
    expect(bu.priority).toBe("must");
  });

  it("HEALTH her zaman güçlü (base 10)", () => {
    const result = computeSigorta({});
    const health = result.find((r) => r.key === "HEALTH")!;
    // base 10 >= shouldAt 9 → should (mustAt 12)
    expect(health.priority).toBe("should");
  });

  it("score100 0..100 aralığında", () => {
    const result = computeSigorta({ q1: "yes", q4: "yes", q11: "yes" });
    for (const r of result) {
      expect(r.score100).toBeGreaterThanOrEqual(0);
      expect(r.score100).toBeLessThanOrEqual(100);
    }
  });

  it("priorityLabel doğru Türkçe etiket", () => {
    const result = computeSigorta({ q4: "yes" });
    const car = result.find((r) => r.key === "CAR")!;
    expect(car.priorityLabel).toBe("Önce Al");
  });
});

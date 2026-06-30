import { describe, expect, it } from "vitest";

import {
  BANKA_BANKS,
  BANKA_PROFILE_LABELS,
  BANKA_QUESTION_ADDS,
  type BankaAnswers,
  computeBanka,
  computeBankRawScore,
  computeBankaProfileScores,
} from "@/lib/relocation-tools-banka";

// Kaynak: ref101 banka-secim. SQL relocation_score_banka_secim_almanya_v1 aynası.

describe("BANKA katalog bütünlüğü (SQL↔TS drift)", () => {
  it("19 banka tanımlı, her birinin benzersiz id'si var", () => {
    expect(BANKA_BANKS).toHaveLength(19);
    const ids = new Set(BANKA_BANKS.map((b) => b.id));
    expect(ids.size).toBe(19);
  });

  it("20 soru için option-add haritası var", () => {
    expect(Object.keys(BANKA_QUESTION_ADDS)).toHaveLength(20);
  });

  it("8 profil etiketi tanımlı", () => {
    expect(Object.keys(BANKA_PROFILE_LABELS)).toHaveLength(8);
  });

  it("tüm banka weight anahtarları geçerli profil anahtarı", () => {
    const valid = new Set(Object.keys(BANKA_PROFILE_LABELS));
    for (const b of BANKA_BANKS) {
      for (const k of Object.keys(b.weights)) {
        expect(valid.has(k)).toBe(true);
      }
    }
  });

  it("tüm option-add anahtarları geçerli profil anahtarı", () => {
    const valid = new Set(Object.keys(BANKA_PROFILE_LABELS));
    for (const opts of Object.values(BANKA_QUESTION_ADDS)) {
      for (const add of Object.values(opts)) {
        for (const k of Object.keys(add)) {
          expect(valid.has(k)).toBe(true);
        }
      }
    }
  });
});

describe("computeBankaProfileScores", () => {
  it("option-add'leri profil sinyallerine toplar", () => {
    // q1=new → EXPAT3 DIGITAL2 DIRECT1; q5=fees → LOW_COST4
    const scores = computeBankaProfileScores({ q1: "new", q5: "fees" });
    expect(scores.EXPAT).toBe(3);
    expect(scores.DIGITAL).toBe(2);
    expect(scores.DIRECT).toBe(1);
    expect(scores.LOW_COST).toBe(4);
  });

  it("aynı profil farklı sorulardan birikir", () => {
    // q1=new DIGITAL2, q3=city DIGITAL2 → DIGITAL 4
    const scores = computeBankaProfileScores({ q1: "new", q3: "city" });
    expect(scores.DIGITAL).toBe(4);
  });

  it("bilinmeyen cevap yok sayılır", () => {
    const scores = computeBankaProfileScores({ q1: "bogus", q99: "x" } as BankaAnswers);
    expect(Object.keys(scores)).toHaveLength(0);
  });

  it("boş 'add' option (q11=no) sinyal eklemez", () => {
    const scores = computeBankaProfileScores({ q11: "no" });
    expect(Object.keys(scores)).toHaveLength(0);
  });
});

describe("computeBankRawScore", () => {
  it("Σ(profileScore * bankWeight)", () => {
    const n26 = BANKA_BANKS.find((b) => b.id === "n26")!;
    // DIGITAL 2 → 2*5=10; LOCAL 1 → 1*-3=-3 ; toplam 7
    const score = computeBankRawScore(n26, { DIGITAL: 2, LOCAL: 1 });
    expect(score).toBe(10 + -3);
  });
});

describe("computeBanka — uçtan uca", () => {
  it("tam dijital profil → dijital/fintech bankalar üstte", () => {
    const answers: BankaAnswers = {
      q1: "new", q2: "low", q3: "city", q4: "never", q5: "app",
      q6: "nope", q7: "often", q8: "none", q9: "no", q10: "debit",
      q15: "one", q16: "speed", q17: "low", q19: "open", q20: "free",
    };
    const result = computeBanka(answers);
    expect(result.ranked).toHaveLength(3);
    // En üstteki banka şubesiz/dijital tarafta olmalı (LOCAL/BRANCH negatif).
    const top = BANKA_BANKS.find((b) => b.id === result.ranked[0].key)!;
    expect((top.weights.DIGITAL ?? 0)).toBeGreaterThan(0);
    expect(result.ranked[0].score100).toBe(100);
  });

  it("şube/yerel profil → şubeli bankalar üstte", () => {
    const answers: BankaAnswers = {
      q1: "old", q2: "high", q3: "town", q4: "often", q5: "support",
      q6: "ok", q8: "often", q9: "near", q10: "giro", q16: "trust",
      q17: "high", q19: "hard", q20: "branch",
    };
    const result = computeBanka(answers);
    const top = BANKA_BANKS.find((b) => b.id === result.ranked[0].key)!;
    expect((top.weights.LOCAL ?? 0) + (top.weights.BRANCH ?? 0)).toBeGreaterThan(0);
  });

  it("yatırım profili → yatırım odaklı banka üstte (Trade Republic/Consorsbank/comdirect)", () => {
    const answers: BankaAnswers = {
      q11: "active", q12: "fees", q5: "fees", q6: "nope", q20: "free",
    };
    const result = computeBanka(answers);
    const investHeavy = ["traderepublic", "consorsbank", "comdirect", "ing", "dkb"];
    expect(investHeavy).toContain(result.ranked[0].key);
  });

  it("normalize skor 0..100 aralığında ve sıralı (azalan)", () => {
    const result = computeBanka({ q1: "new", q5: "app", q11: "active" });
    for (const item of result.ranked) {
      expect(item.score100).toBeGreaterThanOrEqual(0);
      expect(item.score100).toBeLessThanOrEqual(100);
    }
    expect(result.ranked[0].rawScore).toBeGreaterThanOrEqual(result.ranked[1].rawScore);
    expect(result.ranked[1].rawScore).toBeGreaterThanOrEqual(result.ranked[2].rawScore);
  });

  it("en güçlü 3 profil sinyalini döndürür", () => {
    const result = computeBanka({ q5: "fees", q1: "new", q11: "active" });
    // LOW_COST4 (q5), EXPAT3 (q1), INVEST4 (q11) → top3 bunları içermeli
    expect(result.topSignals.length).toBeLessThanOrEqual(3);
    expect(result.topSignals).toContain("LOW_COST");
    expect(result.topSignals).toContain("INVEST");
  });
});

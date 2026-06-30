import { describe, expect, it } from "vitest";

import type { CitizenshipQuestion } from "@/lib/germany-citizenship-api";
import {
  REAL_EXAM_GENERAL_COUNT,
  REAL_EXAM_PASS_THRESHOLD,
  REAL_EXAM_STATE_COUNT,
  REAL_EXAM_TOTAL,
  buildRealExam,
  isCorrect,
  scoreExam,
  shuffle,
} from "@/lib/germany-citizenship-exam";

function q(id: number, eyalet = "Genel"): CitizenshipQuestion {
  return {
    id,
    soru_almanca: `Q${id} de`,
    soru_turkce: `Q${id} tr`,
    secenekler: { a: "A", b: "B", c: "C", d: "D" },
    dogru_cevap: "a",
    eyalet,
    image_url: null,
  };
}

const general = Array.from({ length: 60 }, (_, i) => q(i + 1));
const state = Array.from({ length: 10 }, (_, i) => q(1000 + i, "Bayern"));

describe("BAMF sabitleri", () => {
  it("33 soru = 30 genel + 3 eyalet, baraj 17", () => {
    expect(REAL_EXAM_TOTAL).toBe(33);
    expect(REAL_EXAM_GENERAL_COUNT).toBe(30);
    expect(REAL_EXAM_STATE_COUNT).toBe(3);
    expect(REAL_EXAM_PASS_THRESHOLD).toBe(17);
  });
});

describe("shuffle — deterministik (seed)", () => {
  it("aynı seed → aynı sıra", () => {
    expect(shuffle(general, 42)).toEqual(shuffle(general, 42));
  });
  it("farklı seed → farklı sıra (çok yüksek olasılık)", () => {
    expect(shuffle(general, 1)).not.toEqual(shuffle(general, 999));
  });
  it("tüm öğeleri korur (permütasyon)", () => {
    const shuffled = shuffle(general, 7);
    expect(shuffled).toHaveLength(general.length);
    expect(new Set(shuffled.map((x) => x.id))).toEqual(new Set(general.map((x) => x.id)));
  });
});

describe("buildRealExam", () => {
  it("33 soru: 30 genel + 3 eyalet", () => {
    const exam = buildRealExam(general, state, 123);
    expect(exam).toHaveLength(33);
    const stateInExam = exam.filter((q) => q.eyalet === "Bayern");
    expect(stateInExam).toHaveLength(REAL_EXAM_STATE_COUNT);
    expect(exam.filter((q) => q.eyalet === "Genel")).toHaveLength(REAL_EXAM_GENERAL_COUNT);
  });
  it("benzersiz sorular", () => {
    const exam = buildRealExam(general, state, 5);
    expect(new Set(exam.map((q) => q.id)).size).toBe(exam.length);
  });
});

describe("isCorrect", () => {
  it("doğru cevap eşleşince true", () => {
    expect(isCorrect(q(1), "a")).toBe(true);
  });
  it("yanlış/eksik cevap false", () => {
    expect(isCorrect(q(1), "b")).toBe(false);
    expect(isCorrect(q(1), undefined)).toBe(false);
  });
});

describe("scoreExam", () => {
  const exam = [q(1), q(2), q(3), q(4)]; // hepsinin doğrusu 'a'

  it("doğru sayısını hesaplar", () => {
    const s = scoreExam(exam, { 1: "a", 2: "a", 3: "b", 4: "a" }, false);
    expect(s.correct).toBe(3);
    expect(s.total).toBe(4);
  });

  it("pratik modda %50 baraj", () => {
    expect(scoreExam(exam, { 1: "a", 2: "a" }, false).passed).toBe(true); // 2/4 = %50
    expect(scoreExam(exam, { 1: "a" }, false).passed).toBe(false); // 1/4
  });

  it("gerçek sınavda baraj 17/33 (mutlak)", () => {
    const exam33 = Array.from({ length: 33 }, (_, i) => q(i + 1));
    const ans17 = Object.fromEntries(Array.from({ length: 17 }, (_, i) => [i + 1, "a"]));
    const ans16 = Object.fromEntries(Array.from({ length: 16 }, (_, i) => [i + 1, "a"]));
    expect(scoreExam(exam33, ans17, true).passed).toBe(true);
    expect(scoreExam(exam33, ans16, true).passed).toBe(false);
  });
});

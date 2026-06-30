// Vatandaşlık Testi (Almanya) — sınav mantığı (saf, test edilebilir).
// BAMF Einbürgerungstest formatı: gerçek sınav = 33 soru (30 genel + 3 eyalet), 60 dk, baraj 17/33.

import type { CitizenshipQuestion } from "@/lib/germany-citizenship-api";

export type ExamMode = "all" | "real" | "state";

/** Gerçek sınav sabitleri (BAMF). */
export const REAL_EXAM_GENERAL_COUNT = 30;
export const REAL_EXAM_STATE_COUNT = 3;
export const REAL_EXAM_TOTAL = REAL_EXAM_GENERAL_COUNT + REAL_EXAM_STATE_COUNT; // 33
export const REAL_EXAM_PASS_THRESHOLD = 17;
export const REAL_EXAM_DURATION_SEC = 60 * 60; // 60 dk

/**
 * Deterministik olmayan karıştırma yerine, seed verilen Fisher-Yates.
 * (Test edilebilirlik için seed dışarıdan; UI'da Date tabanlı seed verir.)
 */
export function shuffle<T>(items: readonly T[], seed: number): T[] {
  const arr = items.slice();
  let s = seed >>> 0 || 1;
  const rand = () => {
    // xorshift32 — deterministik PRNG
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Gerçek sınav seti: 30 genel + 3 eyalet sorusu (karıştırılmış). */
export function buildRealExam(
  general: readonly CitizenshipQuestion[],
  state: readonly CitizenshipQuestion[],
  seed: number,
): CitizenshipQuestion[] {
  const g = shuffle(general, seed).slice(0, REAL_EXAM_GENERAL_COUNT);
  const s = shuffle(state, seed ^ 0x9e3779b9).slice(0, REAL_EXAM_STATE_COUNT);
  return shuffle([...g, ...s], seed ^ 0x5bd1e995);
}

/** Bir cevap doğru mu? */
export function isCorrect(question: CitizenshipQuestion, answer: string | undefined): boolean {
  return answer !== undefined && answer === question.dogru_cevap;
}

export interface ExamScore {
  correct: number;
  total: number;
  passed: boolean;
}

/** Verilen sorular + cevaplara göre skor. realExam=true ise baraj 17/33. */
export function scoreExam(
  questions: readonly CitizenshipQuestion[],
  answers: Record<number, string>,
  realExam: boolean,
): ExamScore {
  const correct = questions.reduce(
    (acc, q) => acc + (isCorrect(q, answers[q.id]) ? 1 : 0),
    0,
  );
  const total = questions.length;
  const passed = realExam
    ? correct >= REAL_EXAM_PASS_THRESHOLD
    : total > 0 && correct / total >= 0.5;
  return { correct, total, passed };
}

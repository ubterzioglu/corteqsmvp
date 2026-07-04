// Relocation Tools — #9 Öncelikli Taşınma Sorunu skorlama (SQL↔TS AYNASI).
// GERÇEK skorlama DB'dedir (20260626140000_relocation_tool_top_challenge.sql:
// relocation_score_top_challenge_v1). Buradaki fonksiyon UI önizlemesi + drift testi içindir.
// Katsayılar/eşleme SQL RPC ile BİREBİR (relocation-tools-challenge.test.ts kilitler).
// docs/10tool/09-oncelikli-tasinma-sorunu-e2e.md §4:
//   category_score = user_stress*0.35 + progress_blocker*0.35 + urgency*risk*0.20 + dependency*0.10

import { clamp01OrNeutral } from "@/lib/relocation-tools-ranking";

export type ChallengeCategory =
  | "visa_docs"
  | "job_income"
  | "language"
  | "housing"
  | "finance"
  | "community_support"
  | "credential_recognition"
  | "healthcare_family";

/** Kategori → stressors/blocked_progress içindeki eşleşen anahtarlar (SQL cat tablosu aynası). */
const CATEGORY_STRESS_KEYS: Record<ChallengeCategory, string[]> = {
  visa_docs: ["visa", "paperwork"],
  job_income: ["job"],
  language: ["language"],
  housing: ["housing"],
  finance: ["money"],
  community_support: ["loneliness"],
  credential_recognition: ["school"],
  healthcare_family: ["healthcare"],
};

export const CHALLENGE_CATEGORIES = Object.keys(CATEGORY_STRESS_KEYS) as ChallengeCategory[];

/** Kategori → Türkçe etiket (SQL v_labels aynası). */
export const CHALLENGE_LABELS: Record<ChallengeCategory, string> = {
  visa_docs: "Vize & Evrak",
  job_income: "İş & Gelir",
  language: "Dil",
  housing: "Konut",
  finance: "Finans",
  community_support: "Topluluk & Destek",
  credential_recognition: "Diploma Denkliği",
  healthcare_family: "Sağlık & Aile",
};

export interface ChallengeAnswers {
  stressors?: string[];
  blocked_progress?: string[];
  urgency?: string;
  confidence?: number;
  documents_state?: string;
  income_state?: string;
  support_state?: string;
  health_family_complexity?: string[];
  /** YENİ (+11, 2026-07-01): kategori derinlik + genel bağlam sinyalleri. */
  housing_state?: string;
  language_state?: string;
  finance_state?: string;
  budget_buffer?: string;
  action_readiness?: number;
  decision_paralysis?: number;
}

/** urgency → çarpan (SQL case aynası). */
function urgencyMultiplier(urgency: string | undefined): number {
  switch (urgency) {
    case "0-1m":
      return 1.0;
    case "1-3m":
      return 0.75;
    case "3-6m":
      return 0.5;
    case "6m+":
      return 0.25;
    default:
      return 0.5;
  }
}

/** scale 1..5 → 0..1; eksik → nötr 0.5. */
function scale01(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return 0.5;
  return clamp01OrNeutral((value - 1) / 4);
}

/** confidence scale 1..5 → risk (1 - güven), karar felci/eylem hazırlığı ile hafif ayarlanır. */
function riskFromConfidence(
  confidence: number | undefined,
  decisionParalysis: number | undefined,
  actionReadiness: number | undefined,
): number {
  const conf =
    confidence === undefined || Number.isNaN(confidence)
      ? 0.5
      : clamp01OrNeutral((confidence - 1) / 4);
  const paralysis = scale01(decisionParalysis);
  const actionReady = scale01(actionReadiness);
  return Math.min((1 - conf) * 0.85 + paralysis * 0.1 + (1 - actionReady) * 0.05, 1.0);
}

/** Kategoriye özel dependency_factor (0..1) — SQL case aynası. */
function dependencyFactor(category: ChallengeCategory, answers: ChallengeAnswers): number {
  switch (category) {
    case "visa_docs":
      return answers.documents_state === "confused"
        ? 1.0
        : answers.documents_state === "partial"
          ? 0.5
          : 0.0;
    case "job_income":
      return answers.income_state === "not_started"
        ? 1.0
        : answers.income_state === "searching"
          ? 0.6
          : 0.0;
    case "housing":
      return answers.housing_state === "not_started"
        ? 1.0
        : answers.housing_state === "searching"
          ? 0.6
          : 0.0;
    case "language":
      return answers.language_state === "stuck"
        ? 1.0
        : answers.language_state === "learning"
          ? 0.5
          : 0.0;
    case "finance": {
      const financeScore =
        answers.finance_state === "critical" ? 1.0 : answers.finance_state === "tight" ? 0.5 : 0.0;
      const bufferScore =
        answers.budget_buffer === "no" ? 1.0 : answers.budget_buffer === "partial" ? 0.5 : 0.0;
      return financeScore * 0.7 + bufferScore * 0.3;
    }
    case "community_support":
      return answers.support_state === "none"
        ? 1.0
        : answers.support_state === "weak"
          ? 0.5
          : 0.0;
    case "healthcare_family": {
      const list = answers.health_family_complexity ?? [];
      return list.length > 0 && !list.includes("none") ? 1.0 : 0.0;
    }
    default:
      return 0.0;
  }
}

/** 8 kategori skorunu hesaplar (0..~1; deterministic). SQL ile birebir. */
export function computeChallengeScores(
  answers: ChallengeAnswers,
): Record<ChallengeCategory, number> {
  const stress = answers.stressors ?? [];
  const blocked = answers.blocked_progress ?? [];
  const urgencyRisk =
    urgencyMultiplier(answers.urgency) *
    riskFromConfidence(answers.confidence, answers.decision_paralysis, answers.action_readiness);
  const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

  const scores = {} as Record<ChallengeCategory, number>;
  for (const cat of CHALLENGE_CATEGORIES) {
    const keys = CATEGORY_STRESS_KEYS[cat];
    const userStress = keys.some((k) => stress.includes(k)) ? 1.0 : 0.0;
    const progressBlocker = keys.some((k) => blocked.includes(k)) ? 1.0 : 0.0;
    const dependency = dependencyFactor(cat, answers);
    scores[cat] = round4(
      userStress * 0.35 + progressBlocker * 0.35 + urgencyRisk * 0.2 + dependency * 0.1,
    );
  }
  return scores;
}

export interface ChallengeResult {
  primary: ChallengeCategory;
  primaryScore: number;
  top3: Array<{ key: ChallengeCategory; label: string; score: number }>;
}

/** En yüksek kategori + ilk 3 (eşitlikte alfabetik — SQL order by score desc, cat_key aynası). */
export function resolveChallenge(scores: Record<ChallengeCategory, number>): ChallengeResult {
  const sorted = (Object.entries(scores) as Array<[ChallengeCategory, number]>).sort((a, b) =>
    b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0]),
  );
  return {
    primary: sorted[0][0],
    primaryScore: sorted[0][1],
    top3: sorted.slice(0, 3).map(([key, score]) => ({ key, label: CHALLENGE_LABELS[key], score })),
  };
}

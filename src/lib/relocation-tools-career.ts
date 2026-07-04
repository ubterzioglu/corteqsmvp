// Relocation Tools — #6 Yurtdışı Kariyer Yolu skorlama (SQL↔TS AYNASI).
// GERÇEK skorlama DB'dedir (20260626200000_relocation_tool_career_path.sql:
// relocation_score_career_path_v1). Buradaki fonksiyon UI önizlemesi + drift testi içindir.
// Patika katsayıları + hibrit eşiği SQL ile BİREBİR (relocation-tools-career.test.ts kilitler).
// docs/10tool/06-yurtdisi-kariyer-yolu-e2e.md §4. (Persona deseni — #7 ile aynı sınıf.)

import { clamp01OrNeutral } from "@/lib/relocation-tools-ranking";

export type CareerPath =
  | "international_professional"
  | "academic_research"
  | "vocational_practical"
  | "startup_entrepreneur"
  | "remote_global"
  | "public_ngo_community";

/** Hibrit eşiği: primary − secondary < 0.08 (docs: <8/100). */
export const CAREER_HYBRID_THRESHOLD = 0.08;

export interface CareerAnswers {
  study_willingness?: number;
  risk_appetite?: number;
  salary_vs_stability?: number;
  language_level?: number;
  entrepreneurship?: number;
  research_interest?: number;
  hands_on_interest?: number;
  people_helping?: number;
  core_skills?: string[];
  favorite_work?: string[];
  work_environment?: string;
  portfolio_signal?: string;
  /** YENİ (+5, 2026-07-01): eksikse nötr 0.5. */
  management_interest?: number;
  hands_on_certification_openness?: number;
  client_facing_comfort?: number;
  structured_vs_flexible?: number;
  mission_driven_motivation?: number;
}

/** scale 1..5 → 0..1; eksik → nötr 0.5. */
function scale5(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return 0.5;
  return clamp01OrNeutral((value - 1) / 4);
}

/** language_level 0..5 → /5; eksik → nötr 0.5. */
function lang5(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return 0.5;
  return clamp01OrNeutral(value / 5);
}

const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

/** 6 patika puanını hesaplar (deterministic). SQL ile birebir. */
export function computeCareerScores(answers: CareerAnswers): Record<CareerPath, number> {
  const study = scale5(answers.study_willingness);
  const risk = scale5(answers.risk_appetite);
  const salaryPref = scale5(answers.salary_vs_stability);
  const lang = lang5(answers.language_level);
  const entre = scale5(answers.entrepreneurship);
  const research = scale5(answers.research_interest);
  const hands = scale5(answers.hands_on_interest);
  const people = scale5(answers.people_helping);
  const management = scale5(answers.management_interest);
  const certOpenness = scale5(answers.hands_on_certification_openness);
  const clientFacing = scale5(answers.client_facing_comfort);
  const flexible = scale5(answers.structured_vs_flexible);
  const mission = scale5(answers.mission_driven_motivation);

  const skills = answers.core_skills ?? [];
  const fav = answers.favorite_work ?? [];
  const tech = skills.includes("technical") ? 1 : 0;
  const leadership = skills.includes("leadership") ? 1 : 0;
  const healthcare = skills.includes("healthcare") ? 1 : 0;
  const favResearch = fav.includes("research") ? 1 : 0;
  const favPeople = fav.includes("people") ? 1 : 0;
  const favBuilding = fav.includes("building") ? 1 : 0;

  const env = answers.work_environment;
  const envIs = (e: string) => (env === e ? 1 : 0);
  const portfolio =
    answers.portfolio_signal === "strong" ? 1.0 : answers.portfolio_signal === "partial" ? 0.5 : 0.0;

  return {
    international_professional: round4(
      tech * 0.2 +
        lang * 0.2 +
        leadership * 0.15 +
        management * 0.1 +
        envIs("corporate") * 0.2 +
        (1 - risk) * 0.1 +
        clientFacing * 0.05,
    ),
    academic_research: round4(
      research * 0.35 + study * 0.25 + favResearch * 0.15 + envIs("academic") * 0.15 + certOpenness * 0.1,
    ),
    vocational_practical: round4(
      hands * 0.35 + favBuilding * 0.15 + study * 0.15 + envIs("field_work") * 0.15 + certOpenness * 0.2,
    ),
    startup_entrepreneur: round4(
      risk * 0.25 +
        entre * 0.3 +
        salaryPref * 0.1 +
        clientFacing * 0.1 +
        envIs("startup") * 0.15 +
        flexible * 0.1,
    ),
    remote_global: round4(
      tech * 0.25 + portfolio * 0.25 + entre * 0.15 + flexible * 0.2 + envIs("freelance") * 0.15,
    ),
    public_ngo_community: round4(
      people * 0.25 +
        favPeople * 0.15 +
        healthcare * 0.1 +
        lang * 0.1 +
        mission * 0.25 +
        envIs("public") * 0.1 +
        clientFacing * 0.05,
    ),
  };
}

export interface CareerResult {
  topKey: CareerPath;
  topScore: number;
  isHybrid: boolean;
  secondaryKey: CareerPath | null;
}

/** En yüksek patika + hibrit (<0.08) kontrolü. SQL top/second mantığının aynası (eşitlikte alfabetik). */
export function resolveCareerPath(scores: Record<CareerPath, number>): CareerResult {
  const sorted = (Object.entries(scores) as Array<[CareerPath, number]>).sort((a, b) =>
    b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0]),
  );
  const [topKey, topScore] = sorted[0];
  const [secondKey, secondScore] = sorted[1];
  const isHybrid = topScore - secondScore < CAREER_HYBRID_THRESHOLD;
  return { topKey, topScore, isHybrid, secondaryKey: isHybrid ? secondKey : null };
}

/** Patika → Türkçe etiket (SQL v_labels aynası). */
export const CAREER_LABELS: Record<CareerPath, string> = {
  international_professional: "Uluslararası Profesyonel",
  academic_research: "Akademi & Araştırma",
  vocational_practical: "Mesleki & Pratik",
  startup_entrepreneur: "Girişimci",
  remote_global: "Uzaktan Global",
  public_ngo_community: "Kamu & STK & Topluluk",
};

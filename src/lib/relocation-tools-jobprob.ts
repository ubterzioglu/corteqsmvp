// Relocation Tools — #10 İş Bulma Olasılığı skorlama (SQL↔TS AYNASI).
// GERÇEK skorlama DB'dedir (20260626210000_relocation_tool_job_probability.sql:
// relocation_score_job_probability_v1). Buradaki fonksiyon UI önizlemesi + drift testi içindir.
// Ağırlıklar/boyut türetme/bucket SQL ile BİREBİR (relocation-tools-jobprob.test.ts kilitler).
// docs/10tool/10-is-bulma-olasiligi-e2e.md §4. Karar destek skoru — garanti değil.

import {
  type DimensionWeights,
  type ScoreBucket,
  clamp01OrNeutral,
  computeWeightedScore,
  resolveBucket,
  toScore100,
} from "@/lib/relocation-tools-ranking";

export type JobProbDimension =
  | "demand_fit"
  | "language_fit"
  | "experience_signal"
  | "credential_fit"
  | "work_authorization_fit"
  | "network_activity_fit";

/** SQL relocation_tools.weights aynası (toplam 1.0). */
export const JOBPROB_WEIGHTS: DimensionWeights = {
  demand_fit: 0.3,
  language_fit: 0.2,
  experience_signal: 0.15,
  credential_fit: 0.15,
  work_authorization_fit: 0.1,
  network_activity_fit: 0.1,
};

/** SQL bands aynası (0..100). */
export const JOBPROB_BUCKETS: ScoreBucket[] = [
  { key: "high", min: 75 },
  { key: "medium_high", min: 55 },
  { key: "challenging", min: 40 },
  { key: "low", min: 0 },
];

/** Ülke+meslek talep sinyali (relocation_job_market_signals). null = veri yok. */
export interface JobMarketSignal {
  vacancy_index?: number | null;
  shortage_index?: number | null;
  unemployment_inverse_index?: number | null;
}

export interface JobProbAnswers {
  language_level?: number;
  english_level?: number;
  years_experience?: number;
  seniority?: string;
  portfolio_cv?: string;
  interviews?: string;
  regulated_profession?: string;
  credential_status?: string;
  work_authorization?: string;
  network?: string;
  applications?: number;
  /** YENİ (+4, 2026-07-01). */
  linkedin_profile_quality?: number;
  industry_specific_certifications?: string[];
  salary_research_done?: string;
  local_recruiter_contact?: string;
}

function scale5(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return 0.5;
  return clamp01OrNeutral(value / 5);
}

const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

/** demand_fit: ülke+meslek sinyali (vacancy 0.4 + shortage 0.4 + düşük işsizlik 0.2). null → nötr 0.5. */
export function computeDemandFit(signal: JobMarketSignal | null): number {
  if (!signal) return 0.5;
  return round4(
    clamp01OrNeutral(
      (signal.vacancy_index ?? 0.5) * 0.4 +
        (signal.shortage_index ?? 0.5) * 0.4 +
        (signal.unemployment_inverse_index ?? 0.5) * 0.2,
    ),
  );
}

/** 6 boyut kırılımı. SQL v_breakdown aynası. */
export function computeJobProbBreakdown(
  answers: JobProbAnswers,
  signal: JobMarketSignal | null,
): Record<JobProbDimension, number> {
  const langWork = scale5(answers.language_level);
  const langEn = scale5(answers.english_level);
  const years = answers.years_experience ?? 0;
  const seniorityScore =
    answers.seniority === "junior"
      ? 0.3
      : answers.seniority === "mid"
        ? 0.55
        : answers.seniority === "senior"
          ? 0.8
          : answers.seniority === "lead"
            ? 0.9
            : answers.seniority === "manager"
              ? 0.95
              : 0.5;
  const portfolioScore =
    answers.portfolio_cv === "ready" ? 1.0 : answers.portfolio_cv === "partial" ? 0.5 : 0.3;
  const interviewScore =
    answers.interviews === "multiple" ? 1.0 : answers.interviews === "one" ? 0.6 : 0.2;
  const apps = answers.applications ?? 0;
  const salaryResearchScore =
    answers.salary_research_done === "thorough"
      ? 1.0
      : answers.salary_research_done === "basic"
        ? 0.5
        : 0.2;
  const linkedinQuality = scale5(answers.linkedin_profile_quality);
  const industryCerts = answers.industry_specific_certifications ?? [];
  const industryCertScore =
    industryCerts.length === 0 || (industryCerts.length === 1 && industryCerts[0] === "none")
      ? 0.5
      : Math.min(industryCerts.length / 2, 1.0);
  const recruiterScore =
    answers.local_recruiter_contact === "yes"
      ? 1.0
      : answers.local_recruiter_contact === "in_progress"
        ? 0.5
        : 0.0;

  const credentialBase =
    answers.regulated_profession === "no"
      ? 0.9
      : answers.credential_status === "recognized"
        ? 0.95
        : answers.credential_status === "not_needed"
          ? 0.9
          : answers.credential_status === "in_progress"
            ? 0.55
            : answers.regulated_profession === "yes" &&
                (answers.credential_status === "none" || answers.credential_status === undefined)
              ? 0.25
              : 0.5;
  const credential = credentialBase * 0.85 + industryCertScore * 0.15;

  const workAuth =
    answers.work_authorization === "authorized"
      ? 1.0
      : answers.work_authorization === "eligible"
        ? 0.75
        : answers.work_authorization === "needs_sponsor"
          ? 0.4
          : 0.4;

  return {
    demand_fit: computeDemandFit(signal),
    language_fit: round4(clamp01OrNeutral(langWork * 0.65 + langEn * 0.35)),
    experience_signal: round4(
      clamp01OrNeutral(
        Math.min(years / 10, 1) * 0.35 +
          seniorityScore * 0.25 +
          portfolioScore * 0.15 +
          interviewScore * 0.15 +
          salaryResearchScore * 0.1,
      ),
    ),
    credential_fit: round4(credential),
    work_authorization_fit: round4(workAuth),
    network_activity_fit: round4(
      clamp01OrNeutral(
        (answers.network === "strong" ? 1.0 : answers.network === "weak" ? 0.5 : 0.2) * 0.35 +
          Math.min(apps / 20, 1) * 0.2 +
          interviewScore * 0.15 +
          linkedinQuality * 0.15 +
          recruiterScore * 0.15,
      ),
    ),
  };
}

/** Olasılık skoru (0..100). SQL v_score100 aynası. */
export function computeJobProbScore(
  answers: JobProbAnswers,
  signal: JobMarketSignal | null,
): number {
  return toScore100(
    computeWeightedScore(computeJobProbBreakdown(answers, signal), JOBPROB_WEIGHTS),
  );
}

/** Skoru bucket'a çevirir. */
export function jobProbBucket(score100: number): string | null {
  return resolveBucket(score100, JOBPROB_BUCKETS);
}

/** Boyut → Türkçe etiket. */
export const JOBPROB_LABELS: Record<JobProbDimension, string> = {
  demand_fit: "Talep Uyumu",
  language_fit: "Dil",
  experience_signal: "Deneyim Sinyali",
  credential_fit: "Denklik",
  work_authorization_fit: "Çalışma İzni",
  network_activity_fit: "Network & Aktivite",
};

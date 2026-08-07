// Relocation Tools — #3 Taşınma Hazırlık Skoru skorlama (SQL↔TS AYNASI).
// GERÇEK skorlama DB'dedir (20260626150000_relocation_tool_readiness.sql:
// relocation_score_readiness_v1). Buradaki fonksiyon UI önizlemesi + drift testi içindir.
// Ağırlıklar/option-skorları/boyut türetme SQL ile BİREBİR (relocation-tools-readiness.test.ts kilitler).
// docs/10tool/03-tasinma-hazirlik-skoru-e2e.md §4.

import {
  type DimensionWeights,
  type ScoreBucket,
  clamp01OrNeutral,
  computeWeightedScore,
  resolveBucket,
  toScore100,
} from "@/lib/relocation-tools-ranking";

export type ReadinessDimension =
  | "financial_readiness"
  | "legal_document_readiness"
  | "language_readiness"
  | "housing_logistics"
  | "job_income_readiness"
  | "support_adaptability";

/** SQL relocation_tools.weights aynası (toplam 1.0). */
export const READINESS_WEIGHTS: DimensionWeights = {
  financial_readiness: 0.25,
  legal_document_readiness: 0.2,
  language_readiness: 0.15,
  housing_logistics: 0.15,
  job_income_readiness: 0.15,
  support_adaptability: 0.1,
};

/** SQL bands aynası (0..100). */
export const READINESS_BUCKETS: ScoreBucket[] = [
  { key: "ready", min: 80 },
  { key: "proceed", min: 60 },
  { key: "prepare", min: 40 },
  { key: "high_risk", min: 0 },
];

/** single soru option → score (seed options jsonb ile BİREBİR). Eksik → 0.5. */
const OPTION_SCORES: Record<string, Record<string, number>> = {
  savings_months: { "6+": 1.0, "3-5": 0.7, "1-2": 0.35, "0": 0.0 },
  passport_validity: { yes: 1.0, expiring: 0.5, no: 0.0 },
  visa_route: { yes: 1.0, researching: 0.5, no: 0.0 },
  diploma_docs: { ready: 1.0, partial: 0.5, no: 0.0 },
  housing_first_month: { secured: 1.0, leads: 0.5, no: 0.0 },
  job_income_plan: { job_offer: 1.0, remote_income: 0.85, savings_only: 0.4, no: 0.0 },
  health_insurance: { yes: 1.0, researching: 0.5, no: 0.0 },
  support_network: { strong: 1.0, weak: 0.5, none: 0.0 },
  family_alignment: { not_applicable: 1.0, aligned: 1.0, partial: 0.5, conflict: 0.0 },
  emergency_plan: { yes: 1.0, partial: 0.5, no: 0.0 },
  // YENİ (+5, 2026-07-01)
  emergency_fund_access: { yes: 1.0, partial: 0.5, no: 0.0 },
  local_bank_account: { ready: 1.0, researching: 0.5, no: 0.0 },
  remote_work_transition: { not_applicable: 1.0, yes: 1.0, negotiating: 0.5, no: 0.0 },
  pet_relocation_plan: { not_applicable: 1.0, ready: 1.0, researching: 0.5, no: 0.0 },
};

function optScore(questionKey: string, value: string | undefined): number {
  if (value === undefined) return 0.5;
  return OPTION_SCORES[questionKey]?.[value] ?? 0.5;
}

/** scale 1..5 → 0..1; eksik → nötr 0.5. */
function scale5(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return 0.5;
  return clamp01OrNeutral((value - 1) / 4);
}

/** language_level 0..5 → 0..1 (/5); eksik → nötr 0.5. */
function langScale(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return 0.5;
  return clamp01OrNeutral(value / 5);
}

export interface ReadinessAnswers {
  savings_months?: string;
  passport_validity?: string;
  visa_route?: string;
  diploma_docs?: string;
  housing_first_month?: string;
  job_income_plan?: string;
  health_insurance?: string;
  support_network?: string;
  family_alignment?: string;
  emergency_plan?: string;
  debt_pressure?: number;
  language_level?: number;
  adaptability?: number;
  timeline_realism?: number;
  /** YENİ (+5, 2026-07-01). */
  emergency_fund_access?: string;
  local_bank_account?: string;
  remote_work_transition?: string;
  pet_relocation_plan?: string;
  mental_health_readiness?: number;
}

const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

/** 6 boyut feature değerlerini (0..1) hesaplar. SQL v_breakdown aynası. */
export function computeReadinessBreakdown(
  answers: ReadinessAnswers,
): Record<ReadinessDimension, number> {
  const savings = optScore("savings_months", answers.savings_months);
  const passport = optScore("passport_validity", answers.passport_validity);
  const visa = optScore("visa_route", answers.visa_route);
  const diploma = optScore("diploma_docs", answers.diploma_docs);
  const housing = optScore("housing_first_month", answers.housing_first_month);
  const job = optScore("job_income_plan", answers.job_income_plan);
  const health = optScore("health_insurance", answers.health_insurance);
  const support = optScore("support_network", answers.support_network);
  const family = optScore("family_alignment", answers.family_alignment);
  const emergency = optScore("emergency_plan", answers.emergency_plan);
  const debt = scale5(answers.debt_pressure);
  const lang = langScale(answers.language_level);
  const adapt = scale5(answers.adaptability);
  const timeline = scale5(answers.timeline_realism);
  const emergencyFund = optScore("emergency_fund_access", answers.emergency_fund_access);
  const bank = optScore("local_bank_account", answers.local_bank_account);
  const remoteTransition = optScore("remote_work_transition", answers.remote_work_transition);
  const pet = optScore("pet_relocation_plan", answers.pet_relocation_plan);
  const mental = scale5(answers.mental_health_readiness);

  return {
    financial_readiness: round4(savings * 0.5 + debt * 0.3 + emergencyFund * 0.2),
    legal_document_readiness: round4(
      passport * 0.3 + visa * 0.3 + diploma * 0.25 + bank * 0.15,
    ),
    language_readiness: round4(lang),
    housing_logistics: round4(housing * 0.45 + timeline * 0.25 + family * 0.15 + pet * 0.15),
    job_income_readiness: round4(job * 0.75 + remoteTransition * 0.25),
    support_adaptability: round4(
      support * 0.3 + emergency * 0.15 + health * 0.15 + adapt * 0.2 + mental * 0.2,
    ),
  };
}

export interface ReadinessResult {
  score100: number;
  bucket: string | null;
  breakdown: Record<ReadinessDimension, number>;
  weakest3: ReadinessDimension[];
}

/** Tam hazırlık sonucu: ağırlıklı skor + bucket + en zayıf 3 boyut. */
export function computeReadiness(answers: ReadinessAnswers): ReadinessResult {
  const breakdown = computeReadinessBreakdown(answers);
  const score100 = toScore100(computeWeightedScore(breakdown, READINESS_WEIGHTS));
  const bucket = resolveBucket(score100, READINESS_BUCKETS);
  const weakest3 = (Object.entries(breakdown) as Array<[ReadinessDimension, number]>)
    .sort((a, b) => (a[1] !== b[1] ? a[1] - b[1] : a[0].localeCompare(b[0])))
    .slice(0, 3)
    .map(([key]) => key);
  return { score100, bucket, breakdown, weakest3 };
}

/** Boyut → Türkçe etiket (SQL v_labels aynası). */
export const READINESS_LABELS: Record<ReadinessDimension, string> = {
  financial_readiness: "Finansal Hazırlık",
  legal_document_readiness: "Evrak & Yasal",
  language_readiness: "Dil",
  housing_logistics: "Konaklama & Lojistik",
  job_income_readiness: "İş & Gelir",
  support_adaptability: "Destek & Uyum",
};

/**
 * Boyut → "bu puan neyi ölçüyor" açıklaması. SALT GÖRÜNTÜ metnidir, skorlamaya
 * girmez ve SQL aynası DEĞİLDİR — ama içeriği yukarıdaki
 * `computeReadinessBreakdown` formülünden birebir türetilmiştir. Formülü
 * değiştirirsen bu cümleyi de güncelle, yoksa kullanıcıya yanlış şey vaat eder.
 */
export const READINESS_DIMENSION_DESCRIPTIONS: Record<ReadinessDimension, string> = {
  financial_readiness:
    "Birikiminin kaç ayı karşıladığı, borç baskın ve acil duruma erişebildiğin nakit.",
  legal_document_readiness:
    "Pasaport geçerliliği, vize yolunun netliği, diploma/denklik evrakları ve yerel banka hesabı.",
  language_readiness: "Hedef ülkenin iş ve günlük yaşam dilindeki seviyen.",
  housing_logistics:
    "İlk ay konaklaman, takviminin gerçekçiliği, ailenin uyumu ve varsa evcil hayvan planın.",
  job_income_readiness:
    "İlk 3 ayın gelir kaynağı ve mevcut işini uzaktana taşıyabilme durumun.",
  support_adaptability:
    "Yerindeki destek ağın, acil durum planın, sağlık sigortan, uyum ve ruhsal dayanıklılığın.",
};

/**
 * Boyut zayıf çıktığında gösterilen somut ilk adım. DB'deki weakest3 `detail`
 * alanı şablon bir cümle döndürüyor ("Bu alanı bu hafta güçlendir: X") — bu
 * harita onun yerine geçer, eşleşme yoksa DB metnine düşülür.
 */
export const READINESS_DIMENSION_ACTIONS: Record<ReadinessDimension, string> = {
  financial_readiness:
    "En az 3 aylık yaşam gideri kadar ayrı bir tampon hesap aç ve taşınma tarihine kadar ona dokunma.",
  legal_document_readiness:
    "Pasaport bitiş tarihini ve vize yolunu bu hafta yaz; diploma denkliği/apostil süresi aylar alabilir, önce onu başlat.",
  language_readiness:
    "Hedefin günlük konuşma değil, iş görüşmesi eşiği olsun. Haftada 3 kez konuşma pratiği ekle.",
  housing_logistics:
    "İlk 30 gün için iptal edilebilir bir konaklama ayırt; kalıcı ev aramasını yerinde yap.",
  job_income_readiness:
    "Taşınmadan önce en az bir gelir kaynağını yazılı hale getir: iş teklifi, uzaktan sözleşme ya da müşteri taahhüdü.",
  support_adaptability:
    "Gittiğin şehirde önceden tanışacağın en az 2 kişi bul ve sağlık sigortanı taşınmadan önce başlat.",
};

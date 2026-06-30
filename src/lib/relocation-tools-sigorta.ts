// Relocation Tools — Sigorta Seçimi (Almanya) skorlama (SQL↔TS AYNASI).
// GERÇEK skorlama DB'dedir (20260630110000_relocation_tool_sigorta_secim_almanya.sql:
// relocation_score_sigorta_secim_almanya_v1). Buradaki fonksiyonlar UI önizlemesi + drift testi içindir.
// INSURANCE_TYPES (base/mustAt/shouldAt) + soru add'leri SQL ile BİREBİR (relocation-tools-sigorta.test.ts kilitler).
// Kaynak: ref101/app/(site)/sigorta-secim/data.ts.

export type SigortaTypeKey =
  | "HEALTH"
  | "LIABILITY"
  | "CAR"
  | "HOUSEHOLD"
  | "LEGAL"
  | "BU"
  | "LIFE"
  | "DENTAL"
  | "ACCIDENT"
  | "TRAVEL"
  | "BUILDING"
  | "PET_LIAB";

export type SigortaPriority = "must" | "should" | "optional";

export interface SigortaType {
  key: SigortaTypeKey;
  title: string;
  base: number;
  mustAt: number;
  shouldAt: number;
}

/** Sigorta tipleri — SQL v_types aynası (ref101 INSURANCE_TYPES). */
export const SIGORTA_TYPES: SigortaType[] = [
  { key: "HEALTH", title: "Sağlık Sigortası (Krankenversicherung)", base: 10, mustAt: 12, shouldAt: 9 },
  { key: "LIABILITY", title: "Özel Sorumluluk (Privathaftpflicht)", base: 8, mustAt: 11, shouldAt: 8 },
  { key: "CAR", title: "Araç Sigortası (Kfz-Haftpflicht + opsiyonel kasko)", base: 0, mustAt: 5, shouldAt: 3 },
  { key: "HOUSEHOLD", title: "Ev Eşyası (Hausrat)", base: 2, mustAt: 8, shouldAt: 5 },
  { key: "LEGAL", title: "Hukuk Koruma (Rechtsschutz)", base: 1, mustAt: 9, shouldAt: 5 },
  { key: "BU", title: "Çalışamazlık / Gelir Koruma (Berufsunfähigkeit)", base: 1, mustAt: 10, shouldAt: 6 },
  { key: "LIFE", title: "Risk Hayat (Risikolebensversicherung)", base: 0, mustAt: 8, shouldAt: 4 },
  { key: "DENTAL", title: "Diş Tamamlayıcı (Zahnzusatz)", base: 0, mustAt: 7, shouldAt: 4 },
  { key: "ACCIDENT", title: "Kaza Sigortası (Unfallversicherung)", base: 0, mustAt: 7, shouldAt: 4 },
  { key: "TRAVEL", title: "Seyahat Sağlık (Auslandsreise-KV)", base: 0, mustAt: 7, shouldAt: 3 },
  { key: "BUILDING", title: "Konut Bina (Wohngebäude) — ev sahibiysen", base: 0, mustAt: 7, shouldAt: 3 },
  { key: "PET_LIAB", title: "Evcil Hayvan Sorumluluk (Tierhalterhaftpflicht)", base: 0, mustAt: 7, shouldAt: 2 },
];

type TypeAdd = Partial<Record<SigortaTypeKey, number>>;

/** Soru option-add haritası (SQL questions.scoring->'add' aynası). question_key → option_value → tip katkıları. */
export const SIGORTA_QUESTION_ADDS: Record<string, Record<string, TypeAdd>> = {
  q1: { yes: { HEALTH: 3 }, no: { HEALTH: 1 } },
  q2: {
    employee: { HEALTH: 2, LIABILITY: 2, LEGAL: 1, BU: 2 },
    self: { HEALTH: 2, LIABILITY: 2, LEGAL: 2, BU: 3 },
    student: { HEALTH: 2, LIABILITY: 3 },
    other: { HEALTH: 2, LIABILITY: 2 },
  },
  q3: { yes: { HEALTH: 2, LIFE: 2, HOUSEHOLD: 1 }, no: { BU: 1 } },
  q4: { yes: { CAR: 5 }, no: { CAR: -2 } },
  q5: { yes: { HOUSEHOLD: 3 }, no: { HOUSEHOLD: 1 } },
  q6: { rent: { HOUSEHOLD: 2, LIABILITY: 1 }, own: { BUILDING: 5, LIABILITY: 1, HOUSEHOLD: 2 }, not_sure: { HOUSEHOLD: 1 } },
  q7: { yes: { LIFE: 3, BU: 2, HEALTH: 1 }, no: { LIABILITY: 1 } },
  q8: { yes: { LIABILITY: 2, ACCIDENT: 1 }, no: { ACCIDENT: 0 } },
  q9: { often: { TRAVEL: 4 }, sometimes: { TRAVEL: 2 }, rare: { TRAVEL: 0 } },
  q10: { yes: { LIABILITY: 4 }, no: { LIABILITY: 2 } },
  q11: { yes: { BU: 5 }, no: { BU: 1 } },
  q12: { yes: { LEGAL: 4 }, no: { LEGAL: 1 } },
  q13: { yes: { DENTAL: 4 }, no: { DENTAL: 0 } },
  q14: { yes: { ACCIDENT: 4 }, no: { ACCIDENT: 1 } },
  q15: { dog: { PET_LIAB: 5 }, cat: { PET_LIAB: 1 }, none: { PET_LIAB: 0 } },
  q16: { yes: { ACCIDENT: 2, BU: 2 }, no: { ACCIDENT: 0 } },
  q17: { yes: { LIFE: 3, BU: 2 }, no: { LIFE: 0, BU: 0 } },
  q18: { yes: { BUILDING: 3, HOUSEHOLD: 1 }, no: { BUILDING: 0 } },
  q19: { yes: { LIABILITY: 2, ACCIDENT: 2 }, no: { LIABILITY: 0 } },
  q20: { yes: { BUILDING: 3, HOUSEHOLD: 2 }, no: { BUILDING: 0 } },
};

/** Öncelik anahtarı → Türkçe etiket (SQL priority_label aynası). */
export const SIGORTA_PRIORITY_LABELS: Record<SigortaPriority, string> = {
  must: "Önce Al",
  should: "Güçlü Öneri",
  optional: "Opsiyonel",
};

export type SigortaAnswers = Record<string, string>;

/** Sigorta tipi skorlarını hesaplar: base + cevap katkıları. SQL 1-2. adım aynası. */
export function computeSigortaScores(answers: SigortaAnswers): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const t of SIGORTA_TYPES) {
    scores[t.key] = t.base;
  }
  for (const [questionKey, optionValue] of Object.entries(answers)) {
    const add = SIGORTA_QUESTION_ADDS[questionKey]?.[optionValue];
    if (!add) continue;
    for (const [k, v] of Object.entries(add)) {
      scores[k] = (scores[k] ?? 0) + (v ?? 0);
    }
  }
  return scores;
}

/** Bir sigorta tipinin öncelik bandı (must/should/optional). SQL banded aynası. */
export function sigortaPriority(type: SigortaType, raw: number): SigortaPriority {
  if (raw >= type.mustAt) return "must";
  if (raw >= type.shouldAt) return "should";
  return "optional";
}

export interface SigortaRankedItem {
  key: SigortaTypeKey;
  title: string;
  raw: number;
  score100: number;
  priority: SigortaPriority;
  priorityLabel: string;
}

/** Sigortaları öncelik + skora göre sıralı liste olarak döndürür. SQL ranked aynası. */
export function computeSigorta(answers: SigortaAnswers): SigortaRankedItem[] {
  const scores = computeSigortaScores(answers);
  const maxRaw = Math.max(...SIGORTA_TYPES.map((t) => scores[t.key] ?? 0), 1);
  const pOrder: Record<SigortaPriority, number> = { must: 1, should: 2, optional: 3 };

  return SIGORTA_TYPES.map((t) => {
    const raw = scores[t.key] ?? 0;
    const priority = sigortaPriority(t, raw);
    return {
      key: t.key,
      title: t.title,
      raw,
      score100: Math.round(Math.max(Math.min(raw / maxRaw, 1), 0) * 100),
      priority,
      priorityLabel: SIGORTA_PRIORITY_LABELS[priority],
    };
  }).sort((a, b) => {
    if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
    if (a.raw !== b.raw) return b.raw - a.raw;
    return a.title.localeCompare(b.title);
  });
}

// Relocation Tools — Banka Seçimi (Almanya) skorlama (SQL↔TS AYNASI).
// GERÇEK skorlama DB'dedir (20260630100000_relocation_tool_banka_secim_almanya.sql:
// relocation_score_banka_secim_almanya_v1). Buradaki fonksiyonlar UI önizlemesi + drift testi içindir.
// Soru option-add'leri ve banka weights'leri SQL ile BİREBİR (relocation-tools-banka.test.ts kilitler).
// Kaynak: ref101/app/(site)/banka-secim/data.ts.

export type BankaProfileKey =
  | "DIGITAL"
  | "DIRECT"
  | "LOCAL"
  | "EXPAT"
  | "INVEST"
  | "CRYPTO"
  | "LOW_COST"
  | "BRANCH";

/** Profil sinyali → Türkçe etiket (SQL v_profile_labels aynası). */
export const BANKA_PROFILE_LABELS: Record<BankaProfileKey, string> = {
  DIGITAL: "Dijital (app-first)",
  DIRECT: "Direkt/Online",
  LOCAL: "Yerel/Klasik",
  EXPAT: "Expat/Dil-dostu",
  INVEST: "Borsa/ETF odaklı",
  CRYPTO: "Kripto odaklı",
  LOW_COST: "Masraf hassasiyeti",
  BRANCH: "Şube ihtiyacı",
};

type ProfileAdd = Partial<Record<BankaProfileKey, number>>;

export interface BankaBank {
  id: string;
  name: string;
  type: string;
  weights: Partial<Record<BankaProfileKey, number>>;
}

/** Banka kataloğu — SQL v_banks aynası (ref101 BANKS). */
export const BANKA_BANKS: BankaBank[] = [
  { id: "n26", name: "N26", type: "Mobil banka", weights: { DIGITAL: 5, DIRECT: 2, EXPAT: 4, INVEST: 5, CRYPTO: 4, LOW_COST: 3, BRANCH: -4, LOCAL: -3 } },
  { id: "revolut", name: "Revolut", type: "Fintech (banka)", weights: { DIGITAL: 5, EXPAT: 4, CRYPTO: 4, INVEST: 2, LOW_COST: 2, DIRECT: 3, BRANCH: -5, LOCAL: -4 } },
  { id: "ing", name: "ING", type: "Direkt banka", weights: { DIRECT: 5, INVEST: 4, LOW_COST: 2, DIGITAL: 2, EXPAT: 1, BRANCH: -3, LOCAL: -2, CRYPTO: 0 } },
  { id: "dkb", name: "DKB", type: "Direkt banka", weights: { DIRECT: 4, INVEST: 4, LOW_COST: 3, DIGITAL: 2, EXPAT: 0, BRANCH: -3, LOCAL: -2, CRYPTO: 0 } },
  { id: "sparkasse", name: "Sparkasse", type: "Yerel banka (şubeli)", weights: { LOCAL: 5, BRANCH: 5, INVEST: 2, DIGITAL: 1, DIRECT: 1, LOW_COST: -2, EXPAT: 0, CRYPTO: 1 } },
  { id: "volksbank", name: "Volksbank / Raiffeisenbank", type: "Yerel banka (şubeli)", weights: { LOCAL: 5, BRANCH: 5, INVEST: 2, DIGITAL: 1, DIRECT: 1, LOW_COST: -2, EXPAT: 0, CRYPTO: 0 } },
  { id: "commerzbank", name: "Commerzbank", type: "Geleneksel banka", weights: { LOCAL: 3, BRANCH: 3, DIRECT: 2, INVEST: 3, DIGITAL: 1, LOW_COST: -2, EXPAT: 1, CRYPTO: 0 } },
  { id: "deutschebank", name: "Deutsche Bank", type: "Geleneksel banka", weights: { LOCAL: 3, BRANCH: 2, DIRECT: 1, INVEST: 3, DIGITAL: 1, LOW_COST: -2, EXPAT: 0, CRYPTO: 0 } },
  { id: "traderepublic", name: "Trade Republic", type: "Yatırım + banka (ECB lisanslı)", weights: { INVEST: 6, LOW_COST: 3, DIGITAL: 3, CRYPTO: 3, DIRECT: 3, EXPAT: 1, BRANCH: -6, LOCAL: -4 } },
  { id: "c24", name: "C24 Bank", type: "Direkt banka (app ağırlıklı)", weights: { DIGITAL: 4, DIRECT: 4, LOW_COST: 4, EXPAT: 0, INVEST: 0, CRYPTO: 0, BRANCH: -4, LOCAL: -3 } },
  { id: "comdirect", name: "comdirect", type: "Direkt banka (Commerzbank grubu)", weights: { DIRECT: 4, INVEST: 5, LOW_COST: 2, DIGITAL: 2, EXPAT: 0, CRYPTO: 0, BRANCH: -2, LOCAL: -1 } },
  { id: "consorsbank", name: "Consorsbank", type: "Direkt banka / broker (BNP Paribas)", weights: { DIRECT: 3, INVEST: 6, LOW_COST: 3, DIGITAL: 2, EXPAT: 0, CRYPTO: 0, BRANCH: -3, LOCAL: -2 } },
  { id: "targobank", name: "Targobank", type: "Geleneksel banka (şubeli)", weights: { LOCAL: 3, BRANCH: 4, DIRECT: 1, INVEST: 1, DIGITAL: 1, LOW_COST: -1, EXPAT: 0, CRYPTO: 0 } },
  { id: "postbank", name: "Postbank", type: "Geleneksel banka (şubeli)", weights: { LOCAL: 3, BRANCH: 4, DIRECT: 1, INVEST: 2, DIGITAL: 1, LOW_COST: -2, EXPAT: 0, CRYPTO: 0 } },
  { id: "hvb", name: "HypoVereinsbank (UniCredit)", type: "Geleneksel banka", weights: { LOCAL: 3, BRANCH: 3, DIRECT: 1, INVEST: 3, DIGITAL: 1, LOW_COST: -2, EXPAT: 0, CRYPTO: 0 } },
  { id: "santander", name: "Santander", type: "Banka (şubeli/karma)", weights: { LOCAL: 2, BRANCH: 2, DIRECT: 2, INVEST: 1, DIGITAL: 1, LOW_COST: 2, EXPAT: 0, CRYPTO: 0 } },
  { id: "bunq", name: "bunq", type: "Mobil banka (AB fintech)", weights: { DIGITAL: 5, EXPAT: 4, DIRECT: 2, LOW_COST: -2, INVEST: 0, CRYPTO: 0, BRANCH: -5, LOCAL: -4 } },
  { id: "tomorrow", name: "Tomorrow", type: "Mobil banka (sürdürülebilir odak)", weights: { DIGITAL: 4, DIRECT: 2, LOW_COST: 1, EXPAT: 2, INVEST: 0, CRYPTO: 0, BRANCH: -5, LOCAL: -4 } },
  { id: "wise", name: "Wise", type: "Fintech (çoklu para / transfer)", weights: { DIGITAL: 4, EXPAT: 5, LOW_COST: 4, DIRECT: 1, INVEST: 0, CRYPTO: 0, BRANCH: -6, LOCAL: -5 } },
];

/** Soru option-add haritası (SQL questions.scoring->'add' aynası). question_key → option_value → profil katkıları. */
export const BANKA_QUESTION_ADDS: Record<string, Record<string, ProfileAdd>> = {
  q1: { new: { EXPAT: 3, DIGITAL: 2, DIRECT: 1 }, mid: { DIRECT: 2, DIGITAL: 1 }, old: { LOCAL: 2 } },
  q2: { low: { EXPAT: 3, DIGITAL: 2 }, mid: { DIRECT: 2 }, high: { LOCAL: 2 } },
  q3: { city: { DIGITAL: 2 }, suburb: { DIRECT: 2 }, town: { LOCAL: 2, BRANCH: 2 } },
  q4: { never: { DIGITAL: 3, DIRECT: 1 }, rare: { DIRECT: 2 }, often: { BRANCH: 4, LOCAL: 3 } },
  q5: { fees: { LOW_COST: 4 }, app: { DIGITAL: 4 }, support: { BRANCH: 3, LOCAL: 1 } },
  q6: { nope: { LOW_COST: 4, DIGITAL: 1, DIRECT: 1 }, maybe: { DIRECT: 2 }, ok: { LOCAL: 2, BRANCH: 1 } },
  q7: { often: { LOW_COST: 2, DIGITAL: 2 }, sometimes: { DIRECT: 1 }, rare: { LOCAL: 1 } },
  q8: { none: { DIGITAL: 2 }, some: { DIRECT: 1 }, often: { BRANCH: 3, LOCAL: 2 } },
  q9: { no: { DIGITAL: 1 }, any: { DIRECT: 2 }, near: { LOCAL: 2, BRANCH: 2 } },
  q10: { debit: { DIGITAL: 1 }, both: { DIRECT: 2 }, giro: { LOCAL: 2 } },
  q11: { active: { INVEST: 4, LOW_COST: 2 }, sometimes: { INVEST: 2 }, no: {} },
  q12: { fees: { INVEST: 2, LOW_COST: 3 }, trust: { LOCAL: 2 }, easy: { DIGITAL: 2, INVEST: 1 } },
  q13: { active: { CRYPTO: 4, DIGITAL: 2 }, curious: { CRYPTO: 2 }, none: {} },
  q14: { inbank: { CRYPTO: 3, DIGITAL: 1 }, separate: { INVEST: 1 }, no: { LOCAL: 1 } },
  q15: { one: { DIGITAL: 3 }, any: { DIRECT: 1 }, separate: { LOCAL: 1 } },
  q16: { trust: { LOCAL: 3, BRANCH: 1 }, speed: { DIGITAL: 3 }, balance: { DIRECT: 3 } },
  q17: { high: { BRANCH: 3, LOCAL: 1 }, mid: { DIRECT: 2 }, low: { DIGITAL: 2 } },
  q18: { yes: { LOCAL: 2, DIRECT: 1 }, some: { DIRECT: 1 }, no: { DIGITAL: 1 } },
  q19: { open: { DIGITAL: 2 }, maybe: { DIRECT: 1 }, hard: { LOCAL: 2 } },
  q20: { free: { DIGITAL: 2, LOW_COST: 2 }, balanced: { DIRECT: 2 }, branch: { LOCAL: 2, BRANCH: 2 } },
};

export type BankaAnswers = Record<string, string>;

/** Cevaplardan profil sinyallerini toplar (SQL 1. adım aynası). */
export function computeBankaProfileScores(answers: BankaAnswers): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const [questionKey, optionValue] of Object.entries(answers)) {
    const add = BANKA_QUESTION_ADDS[questionKey]?.[optionValue];
    if (!add) continue;
    for (const [k, v] of Object.entries(add)) {
      scores[k] = (scores[k] ?? 0) + (v ?? 0);
    }
  }
  return scores;
}

/** Bir bankanın ham skoru = Σ(profileScore * bankWeight). SQL 2. adım aynası. */
export function computeBankRawScore(
  bank: BankaBank,
  profileScores: Record<string, number>,
): number {
  let total = 0;
  for (const [k, w] of Object.entries(bank.weights)) {
    total += (profileScores[k] ?? 0) * (w ?? 0);
  }
  return total;
}

export interface BankaRankedItem {
  key: string;
  title: string;
  type: string;
  rawScore: number;
  score100: number;
}

export interface BankaResult {
  ranked: BankaRankedItem[];
  topSignals: BankaProfileKey[];
}

/** Top-3 banka (0..100 normalize) + en güçlü 3 profil sinyali. SQL 3-4. adım aynası. */
export function computeBanka(answers: BankaAnswers): BankaResult {
  const profileScores = computeBankaProfileScores(answers);

  const scored = BANKA_BANKS.map((b) => ({
    bank: b,
    rawScore: computeBankRawScore(b, profileScores),
  }));
  const raws = scored.map((s) => s.rawScore);
  const min = Math.min(...raws);
  const max = Math.max(...raws);

  const ranked = scored
    .map(({ bank, rawScore }) => ({
      key: bank.id,
      title: bank.name,
      type: bank.type,
      rawScore,
      score100: max === min ? 100 : Math.round(((rawScore - min) / (max - min)) * 100),
    }))
    .sort((a, b) => (a.rawScore !== b.rawScore ? b.rawScore - a.rawScore : a.title.localeCompare(b.title)))
    .slice(0, 3);

  const topSignals = (Object.entries(profileScores) as Array<[BankaProfileKey, number]>)
    .filter(([, sc]) => sc > 0)
    .sort((a, b) => (a[1] !== b[1] ? b[1] - a[1] : a[0].localeCompare(b[0])))
    .slice(0, 3)
    .map(([k]) => k);

  return { ranked, topSignals };
}

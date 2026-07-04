// Relocation Tools — #5 Diaspora Eşleştirme uyumluluk skoru (SQL↔TS AYNASI).
// GERÇEK eşleştirme DB'dedir (20260626220000_relocation_tool_diaspora_matchmaker.sql:
// relocation_score_diaspora_matchmaker_v1, opt-in havuzdan güvenli kartlar).
// Buradaki fonksiyon UI önizlemesi + drift testi içindir; iki kullanıcı vektörünün uyum
// kırılımını + skorunu hesaplar. SQL ile BİREBİR (relocation-tools-diaspora.test.ts kilitler).
// docs/10tool/05-diaspora-ag-eslestirme-e2e.md §4.
//
// PRIVACY: skor mantığı burada; isim/iletişim bu katmanda YOK. Hard filter (consent/self/off)
// ve maskeleme RPC tarafında; UI yalnızca güvenli kart payload'ını gösterir.

import {
  type DimensionWeights,
  clamp01OrNeutral,
  computeWeightedScore,
  toScore100,
} from "@/lib/relocation-tools-ranking";

export type DiasporaDimension =
  | "need_offer_complementarity"
  | "geo_proximity"
  | "field_overlap"
  | "language_timezone_fit"
  | "trust_profile_completeness"
  | "reciprocity_recent_activity";

/** SQL relocation_tools.weights aynası (toplam 1.0). */
export const DIASPORA_WEIGHTS: DimensionWeights = {
  need_offer_complementarity: 0.35,
  geo_proximity: 0.2,
  field_overlap: 0.15,
  language_timezone_fit: 0.1,
  trust_profile_completeness: 0.1,
  reciprocity_recent_activity: 0.1,
};

/** Eşleştirme isteyen kullanıcının vektörü (session cevaplarından). */
export interface RequesterVector {
  needs: string[];
  offers: string[];
  languages: string[];
  targetCountry: string; // upper ISO ('' = yok)
  profession: string; // lower ('' = yok)
  /** YENİ (+4, 2026-07-01). */
  topicInterests?: string[];
  responseTimeExpectation?: string | null;
  preferredGroupSize?: string | null;
}

/** Aday üyenin vektörü (diaspora_match_preferences satırı). */
export interface CandidateVector {
  needs: string[];
  offers: string[];
  languages: string[];
  targetCountryCodes: string[];
  currentCountry?: string | null;
  professionTags: string[];
  trustSignals: string[];
  maxMonthlyIntros: number;
  /** YENİ (+4, 2026-07-01). */
  topicInterests?: string[];
  experienceYearsInTarget?: number | null;
  preferredGroupSize?: string | null;
  responseTimeExpectation?: string | null;
}

function intersectCount(a: string[], b: string[]): number {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x)).length;
}

const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

/** İki vektörün 6 boyut uyum kırılımı. SQL cand.breakdown aynası. */
export function computeDiasporaBreakdown(
  me: RequesterVector,
  cand: CandidateVector,
): Record<DiasporaDimension, number> {
  // need_offer_complementarity: benim ihtiyacım ↔ adayın teklifi (0.6) + benim teklifim ↔ adayın ihtiyacı (0.4).
  const needOffer =
    (intersectCount(me.needs, cand.offers) / Math.max(me.needs.length, 1)) * 0.6 +
    (intersectCount(me.offers, cand.needs) / Math.max(me.offers.length, 1)) * 0.4;

  const geo =
    me.targetCountry !== "" &&
    (cand.targetCountryCodes.includes(me.targetCountry) ||
      cand.currentCountry === me.targetCountry)
      ? 1.0
      : cand.targetCountryCodes.length === 0
        ? 0.5
        : 0.3;

  const professionField =
    me.profession !== "" && cand.professionTags.includes(me.profession)
      ? 1.0
      : cand.professionTags.length === 0
        ? 0.5
        : 0.4;
  const myTopics = me.topicInterests ?? [];
  const candTopics = cand.topicInterests ?? [];
  const topicOverlap =
    myTopics.length === 0 || candTopics.length === 0
      ? 0.5
      : Math.min(intersectCount(myTopics, candTopics) / Math.max(Math.min(myTopics.length, candTopics.length), 1), 1.0);
  const field = clamp01OrNeutral(professionField * 0.7 + topicOverlap * 0.3);

  const langMatch = intersectCount(me.languages, cand.languages) > 0 ? 1.0 : 0.3;
  const responseMatch =
    me.responseTimeExpectation != null && cand.responseTimeExpectation === me.responseTimeExpectation
      ? 1.0
      : 0.9;
  const langTz = langMatch * responseMatch;

  const trustBase = Math.min(cand.trustSignals.length / 3, 1);
  const experienceBonus = Math.min((cand.experienceYearsInTarget ?? 0) / 5, 1);
  const trust = clamp01OrNeutral(trustBase * 0.7 + experienceBonus * 0.3);

  const reciprocityBase = 0.4 + Math.min(cand.maxMonthlyIntros / 5, 0.6);
  const groupMismatch =
    me.preferredGroupSize != null &&
    me.preferredGroupSize !== "either" &&
    cand.preferredGroupSize != null &&
    cand.preferredGroupSize !== "either" &&
    cand.preferredGroupSize !== me.preferredGroupSize;
  const reciprocity = clamp01OrNeutral(reciprocityBase * (groupMismatch ? 0.85 : 1.0));

  return {
    need_offer_complementarity: round4(clamp01OrNeutral(needOffer)),
    geo_proximity: round4(geo),
    field_overlap: round4(field),
    language_timezone_fit: round4(langTz),
    trust_profile_completeness: round4(trust),
    reciprocity_recent_activity: round4(reciprocity),
  };
}

/** Aday uyum skoru (0..100). SQL scored.score aynası. */
export function computeDiasporaScore(me: RequesterVector, cand: CandidateVector): number {
  return toScore100(computeWeightedScore(computeDiasporaBreakdown(me, cand), DIASPORA_WEIGHTS));
}

/** Boyut → Türkçe etiket. */
export const DIASPORA_LABELS: Record<DiasporaDimension, string> = {
  need_offer_complementarity: "İhtiyaç-Teklif Uyumu",
  geo_proximity: "Konum Yakınlığı",
  field_overlap: "Alan Benzerliği",
  language_timezone_fit: "Dil & Zaman",
  trust_profile_completeness: "Güven & Profil",
  reciprocity_recent_activity: "Karşılıklılık & Aktiflik",
};

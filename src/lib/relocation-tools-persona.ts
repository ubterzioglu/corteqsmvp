// Relocation Tools — #7 Expat Persona skorlama (SQL↔TS AYNASI).
// GERÇEK skorlama DB'dedir (20260626130000_relocation_tool_expat_persona.sql:
// relocation_score_expat_lifestyle_persona_v1). Buradaki fonksiyon UI önizlemesi + drift testi içindir.
// Katsayılar SQL RPC ile BİREBİR aynıdır (relocation-tools-persona.test.ts kilitler).
// docs/10tool/07-expat-yasam-tarzi-persona-e2e.md §4.

import { clamp01OrNeutral } from "@/lib/relocation-tools-ranking";

export type PersonaKey =
  | "global_networker"
  | "quiet_local"
  | "adventure_seeker"
  | "family_planner"
  | "career_builder"
  | "community_anchor";

/** Persona araç cevapları (scale 1..5, single string). */
export interface PersonaAnswers {
  weekend_style?: string;
  social_energy?: number;
  planning_style?: number;
  local_language?: number;
  community_need?: number;
  comfort_zone?: number;
  career_focus?: number;
  family_rhythm?: number;
  city_vs_nature?: number;
}

/** scale 1..5 → 0..1; eksik → nötr 0.5 (SQL (v-1)/4 + clamp_neutral aynası). */
function scale01(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return 0.5;
  return clamp01OrNeutral((value - 1) / 4);
}

/** weekend_style → persona bonusu (SQL case bloklarının aynası). */
function weekendBonus(weekend: string | undefined, persona: PersonaKey): number {
  switch (persona) {
    case "global_networker":
      return weekend === "network_event" ? 0.15 : 0;
    case "quiet_local":
      return weekend === "quiet_cafe" ? 0.15 : 0;
    case "adventure_seeker":
      return weekend === "hiking" ? 0.15 : 0;
    case "family_planner":
      return weekend === "family_market" ? 0.15 : 0;
    case "career_builder":
      return weekend === "network_event" ? 0.15 : 0;
    case "community_anchor":
      return weekend === "family_market" ? 0.1 : 0;
  }
}

/** Persona puanlarını hesaplar (0..~1 aralığı; deterministic). SQL ile birebir. */
export function computePersonaScores(answers: PersonaAnswers): Record<PersonaKey, number> {
  const social = scale01(answers.social_energy);
  const plan = scale01(answers.planning_style);
  const lang = scale01(answers.local_language);
  const comm = scale01(answers.community_need);
  const comfort = scale01(answers.comfort_zone);
  const career = scale01(answers.career_focus);
  const family = scale01(answers.family_rhythm);
  const city = scale01(answers.city_vs_nature);
  const w = answers.weekend_style;

  const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

  return {
    global_networker: round4(
      social * 0.4 + career * 0.3 + city * 0.3 + weekendBonus(w, "global_networker"),
    ),
    quiet_local: round4(
      (1 - social) * 0.35 + (1 - city) * 0.3 + (1 - plan) * 0.2 + (1 - comfort) * 0.15 +
        weekendBonus(w, "quiet_local"),
    ),
    adventure_seeker: round4(
      plan * 0.35 + comfort * 0.35 + (1 - city) * 0.15 + lang * 0.15 +
        weekendBonus(w, "adventure_seeker"),
    ),
    family_planner: round4(
      family * 0.45 + (1 - comfort) * 0.2 + (1 - plan) * 0.2 + (1 - social) * 0.15 +
        weekendBonus(w, "family_planner"),
    ),
    career_builder: round4(
      career * 0.45 + city * 0.3 + social * 0.25 + weekendBonus(w, "career_builder"),
    ),
    community_anchor: round4(
      comm * 0.5 + lang * 0.25 + social * 0.25 + weekendBonus(w, "community_anchor"),
    ),
  };
}

export interface PersonaResult {
  topKey: PersonaKey;
  topScore: number;
  isHybrid: boolean;
  secondaryKey: PersonaKey | null;
}

/** En yüksek persona + hibrit (±0.001) kontrolü. SQL'deki top/second mantığının aynası. */
export function resolvePersona(scores: Record<PersonaKey, number>): PersonaResult {
  const sorted = (Object.entries(scores) as Array<[PersonaKey, number]>).sort(
    (a, b) => b[1] - a[1],
  );
  const [topKey, topScore] = sorted[0];
  const [secondKey, secondScore] = sorted[1];
  const isHybrid = topScore - secondScore <= 0.001;
  return {
    topKey,
    topScore,
    isHybrid,
    secondaryKey: isHybrid ? secondKey : null,
  };
}

/** Persona anahtarı → Türkçe etiket (SQL v_persona_label aynası). */
export const PERSONA_LABELS: Record<PersonaKey, string> = {
  global_networker: "Global Networker",
  quiet_local: "Sakin Yerleşik",
  adventure_seeker: "Maceracı Kaşif",
  family_planner: "Aile Planlayıcısı",
  career_builder: "Kariyer İnşacısı",
  community_anchor: "Topluluk Çapası",
};

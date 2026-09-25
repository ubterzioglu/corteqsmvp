// Relocation RPC/okuma satırlarını API sınırında normalize eder.
//
// Neden: `relocation_rank_locations_v1` canlıda `explanations` alanını HİÇ döndürmüyordu
// (2026-06-19'dan beri), TS tipi ise alanı zorunlu `string[]` sayıyordu. Şehir kartı
// `rec.explanations.length` okuyunca /relocation sayfası AppErrorBoundary'ye düştü
// (client_error_reports: "Cannot read properties of undefined (reading 'length')",
// 20–23 Eylül 2026). `as T[]` cast'i bu boşluğu derleme zamanında gizler; bu yüzden
// dizi/nesne alanları burada güvenli varsayılana çekilir ve bileşenler her zaman
// sözleşmedeki şekli alır.
//
// Kural: yalnız ŞEKİL düzeltilir. Değer uydurulmaz — eksik skor 0'a, eksik metin
// boş diziye düşer; "makul varsayılan" diye içerik üretilmez.

import { RELOCATION_RANK_WEIGHTS, type RelocationScoreKey } from "@/lib/relocation-ranking";
import type {
  RelocationEmergencyContactRow,
  RelocationHousehold,
  RelocationLocationRecommendation,
  RelocationMoveRow,
  RelocationServiceRow,
  RelocationStepRow,
} from "@/lib/relocation-types";

type UnknownRecord = Record<string, unknown>;

/** Skor anahtarları ağırlık tablosundan türetilir — SQL `score_breakdown` ile aynı altı anahtar. */
const SCORE_KEYS = Object.keys(RELOCATION_RANK_WEIGHTS) as RelocationScoreKey[];

function asRecord(value: unknown): UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

/** Dizi değilse `[]`; dizideki boş/metin olmayan öğeler elenir. */
export function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = toFiniteNumber(value, Number.NaN);
  return Number.isNaN(n) ? null : n;
}

/** Eksik skor bileşeni 0 olur — kart her anahtar için bir çubuk çizer. */
export function normalizeScoreBreakdown(value: unknown): Record<RelocationScoreKey, number> {
  const raw = asRecord(value);
  return SCORE_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: toFiniteNumber(raw[key], 0) }),
    {} as Record<RelocationScoreKey, number>,
  );
}

export function normalizeLocationRecommendation(
  value: unknown,
): RelocationLocationRecommendation {
  const raw = asRecord(value);
  const quality = asRecord(raw.source_quality);
  const ruleScore = toFiniteNumber(raw.rule_score, 0);
  return {
    ...(raw as Partial<RelocationLocationRecommendation>),
    entity_id: String(raw.entity_id ?? ""),
    country_code: String(raw.country_code ?? ""),
    city_code: String(raw.city_code ?? ""),
    title: String(raw.title ?? raw.city_code ?? ""),
    hard_filter_pass: raw.hard_filter_pass !== false,
    rule_score: ruleScore,
    final_score: toFiniteNumber(raw.final_score, ruleScore),
    score_breakdown: normalizeScoreBreakdown(raw.score_breakdown),
    explanations: toStringArray(raw.explanations),
    source_quality: {
      official_sources_ratio: toFiniteNumber(quality.official_sources_ratio, 0),
      freshness_hours: toNullableNumber(quality.freshness_hours),
    },
  };
}

export function normalizeServiceRow(value: unknown): RelocationServiceRow {
  const raw = asRecord(value) as Partial<RelocationServiceRow> & UnknownRecord;
  return {
    ...(raw as RelocationServiceRow),
    provider_name: String(raw.provider_name ?? ""),
    languages: toStringArray(raw.languages),
    trust_score: toFiniteNumber(raw.trust_score, 0),
  };
}

export function normalizeStepRow(value: unknown): RelocationStepRow {
  const raw = asRecord(value) as Partial<RelocationStepRow> & UnknownRecord;
  return {
    ...(raw as RelocationStepRow),
    name: String(raw.name ?? ""),
    required_documents: toStringArray(raw.required_documents),
    output_artifacts: toStringArray(raw.output_artifacts),
  };
}

export function normalizeEmergencyContactRow(value: unknown): RelocationEmergencyContactRow {
  const raw = asRecord(value) as Partial<RelocationEmergencyContactRow> & UnknownRecord;
  return {
    ...(raw as RelocationEmergencyContactRow),
    label: String(raw.label ?? ""),
  };
}

function normalizeHousehold(value: unknown): RelocationHousehold {
  const raw = asRecord(value);
  return {
    ...(raw as Partial<RelocationHousehold>),
    adults: toFiniteNumber(raw.adults, 1),
    pets: raw.pets === undefined ? undefined : toStringArray(raw.pets),
    accessibility_needs:
      raw.accessibility_needs === undefined ? undefined : toStringArray(raw.accessibility_needs),
  };
}

export function normalizeMoveRow(value: unknown): RelocationMoveRow {
  const raw = asRecord(value) as Partial<RelocationMoveRow> & UnknownRecord;
  return {
    ...(raw as RelocationMoveRow),
    target_country_codes: toStringArray(raw.target_country_codes),
    must_haves: toStringArray(raw.must_haves),
    nice_to_haves: toStringArray(raw.nice_to_haves),
    household: normalizeHousehold(raw.household),
    wizard_answers: asRecord(raw.wizard_answers),
  };
}

/** RPC dönüşü dizi değilse (null, tek nesne, hata gövdesi) boş liste. */
export function normalizeList<T>(value: unknown, normalize: (item: unknown) => T): T[] {
  return Array.isArray(value) ? value.map(normalize) : [];
}

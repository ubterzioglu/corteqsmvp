import { supabase } from "@/integrations/supabase/client";

export const ADMIN_TURKISH_MISSION_TYPES = [
  "embassy",
  "consulate_general",
  "consulate",
  "consular_office",
] as const;

export type AdminTurkishMissionType = (typeof ADMIN_TURKISH_MISSION_TYPES)[number];

export type TurkishMissionAdminRecord = {
  id: string;
  slug: string;
  missionType: AdminTurkishMissionType;
  missionName: string;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  cityNormalized: string | null;
  parentMissionSlug: string | null;
  address: string | null;
  phones: string[];
  emails: string[];
  faxes: string[];
  emergencyPhones: string[];
  websiteUrl: string | null;
  appointmentUrl: string | null;
  jurisdiction: string | null;
  workingHours: string | null;
  officeHoursStructured: Record<string, unknown>;
  consularCallCenter: string | null;
  parserConfidence: number;
  dataCompletenessScore: number;
  status: "active" | "inactive" | "needs_review";
  verificationStatus: string;
  sourceHash: string | null;
  sourceUrl: string;
  scrapedAt: string;
  lastVerifiedAt: string;
  contactFields: Record<string, unknown>;
  rawSnapshot: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type TurkishMissionAdminInput = {
  slug: string;
  missionType: AdminTurkishMissionType;
  missionName: string;
  country?: string | null;
  countryCode?: string | null;
  city?: string | null;
  cityNormalized?: string | null;
  parentMissionSlug?: string | null;
  address?: string | null;
  phones: string[];
  emails: string[];
  faxes: string[];
  emergencyPhones: string[];
  websiteUrl?: string | null;
  appointmentUrl?: string | null;
  jurisdiction?: string | null;
  workingHours?: string | null;
  officeHoursStructured: Record<string, unknown>;
  consularCallCenter?: string | null;
  parserConfidence: number;
  dataCompletenessScore: number;
  status: "active" | "inactive" | "needs_review";
  verificationStatus: string;
  sourceHash?: string | null;
  sourceUrl: string;
  scrapedAt?: string;
  lastVerifiedAt?: string;
  contactFields: Record<string, unknown>;
  rawSnapshot: Record<string, unknown>;
};

type TurkishMissionRow = {
  id: string;
  slug: string;
  mission_type: AdminTurkishMissionType;
  mission_name: string;
  country: string | null;
  country_code: string | null;
  city: string | null;
  city_normalized: string | null;
  parent_mission_slug: string | null;
  address: string | null;
  phones: unknown;
  emails: unknown;
  faxes: unknown;
  emergency_phones: unknown;
  website_url: string | null;
  appointment_url: string | null;
  jurisdiction: string | null;
  working_hours: string | null;
  office_hours_structured: unknown;
  consular_call_center: string | null;
  parser_confidence: number;
  data_completeness_score: number;
  status: "active" | "inactive" | "needs_review";
  verification_status: string;
  source_hash: string | null;
  source_url: string;
  scraped_at: string;
  last_verified_at: string;
  contact_fields: unknown;
  raw_snapshot: unknown;
  created_at: string;
  updated_at: string;
};

const normalizeOptionalText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const parseStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];

const parseRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const rowToRecord = (row: TurkishMissionRow): TurkishMissionAdminRecord => ({
  id: row.id,
  slug: row.slug,
  missionType: row.mission_type,
  missionName: row.mission_name,
  country: row.country,
  countryCode: row.country_code,
  city: row.city,
  cityNormalized: row.city_normalized,
  parentMissionSlug: row.parent_mission_slug,
  address: row.address,
  phones: parseStringArray(row.phones),
  emails: parseStringArray(row.emails),
  faxes: parseStringArray(row.faxes),
  emergencyPhones: parseStringArray(row.emergency_phones),
  websiteUrl: row.website_url,
  appointmentUrl: row.appointment_url,
  jurisdiction: row.jurisdiction,
  workingHours: row.working_hours,
  officeHoursStructured: parseRecord(row.office_hours_structured),
  consularCallCenter: row.consular_call_center,
  parserConfidence: row.parser_confidence,
  dataCompletenessScore: row.data_completeness_score,
  status: row.status,
  verificationStatus: row.verification_status,
  sourceHash: row.source_hash,
  sourceUrl: row.source_url,
  scrapedAt: row.scraped_at,
  lastVerifiedAt: row.last_verified_at,
  contactFields: parseRecord(row.contact_fields),
  rawSnapshot: parseRecord(row.raw_snapshot),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const inputToPayload = (input: TurkishMissionAdminInput) => ({
  slug: input.slug.trim(),
  mission_type: input.missionType,
  mission_name: input.missionName.trim(),
  country: normalizeOptionalText(input.country),
  country_code: normalizeOptionalText(input.countryCode),
  city: normalizeOptionalText(input.city),
  city_normalized: normalizeOptionalText(input.cityNormalized),
  parent_mission_slug: normalizeOptionalText(input.parentMissionSlug),
  address: normalizeOptionalText(input.address),
  phones: input.phones,
  emails: input.emails,
  faxes: input.faxes,
  emergency_phones: input.emergencyPhones,
  website_url: normalizeOptionalText(input.websiteUrl),
  appointment_url: normalizeOptionalText(input.appointmentUrl),
  jurisdiction: normalizeOptionalText(input.jurisdiction),
  working_hours: normalizeOptionalText(input.workingHours),
  office_hours_structured: input.officeHoursStructured,
  consular_call_center: normalizeOptionalText(input.consularCallCenter),
  parser_confidence: input.parserConfidence,
  data_completeness_score: input.dataCompletenessScore,
  status: input.status,
  verification_status: input.verificationStatus.trim(),
  source_hash: normalizeOptionalText(input.sourceHash),
  source_url: input.sourceUrl.trim(),
  scraped_at: input.scrapedAt,
  last_verified_at: input.lastVerifiedAt,
  contact_fields: input.contactFields,
  raw_snapshot: input.rawSnapshot,
});

export const getAdminTurkishMissionTypeLabel = (value: AdminTurkishMissionType) => {
  switch (value) {
    case "embassy":
      return "Büyükelçilik";
    case "consulate_general":
      return "Başkonsolosluk";
    case "consulate":
      return "Konsolosluk";
    case "consular_office":
      return "Konsolosluk Ofisi";
  }
};

export const slugifyTurkishMission = (value: string) =>
  value
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);

export async function listTurkishMissionsAsAdmin(
  missionType?: AdminTurkishMissionType,
): Promise<TurkishMissionAdminRecord[]> {
  let query = (supabase as any)
    .from("turkish_missions")
    .select("*")
    .in("mission_type", [...ADMIN_TURKISH_MISSION_TYPES]);

  if (missionType) {
    query = query.eq("mission_type", missionType);
  }

  const { data, error } = await query
    .order("country", { ascending: true })
    .order("city", { ascending: true })
    .order("mission_name", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as TurkishMissionRow[]).map(rowToRecord);
}

export async function createTurkishMissionAsAdmin(input: TurkishMissionAdminInput): Promise<TurkishMissionAdminRecord> {
  const { data, error } = await (supabase as any)
    .from("turkish_missions")
    .insert(inputToPayload(input))
    .select("*")
    .single();

  if (error) throw error;
  return rowToRecord(data as TurkishMissionRow);
}

export async function updateTurkishMissionAsAdmin(
  id: string,
  input: TurkishMissionAdminInput,
): Promise<TurkishMissionAdminRecord> {
  const { data, error } = await (supabase as any)
    .from("turkish_missions")
    .update(inputToPayload(input))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return rowToRecord(data as TurkishMissionRow);
}

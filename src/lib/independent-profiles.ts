import { supabase } from "@/integrations/supabase/client";

export type IndependentProfileKind = "consulate";

export type IndependentProfileService = {
  title: string;
  description: string;
};

export type IndependentProfileAnnouncement = {
  title: string;
  date?: string;
  type?: string;
  description?: string;
};

export type IndependentProfileCta = {
  label: string;
  url: string;
  variant?: "default" | "outline";
};

export type IndependentProfile = {
  id: string;
  slug: string;
  profileKind: IndependentProfileKind;
  typeLabel: string;
  title: string;
  subtitle: string | null;
  country: string;
  city: string;
  description: string;
  websiteUrl: string | null;
  heroImageUrl: string | null;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  addressText: string | null;
  mapQuery: string | null;
  workingHours: string | null;
  services: IndependentProfileService[];
  announcements: IndependentProfileAnnouncement[];
  ctas: IndependentProfileCta[];
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type IndependentProfileInput = {
  slug: string;
  profileKind: IndependentProfileKind;
  typeLabel: string;
  title: string;
  subtitle?: string | null;
  country: string;
  city: string;
  description: string;
  websiteUrl?: string | null;
  heroImageUrl?: string | null;
  logoUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  addressText?: string | null;
  mapQuery?: string | null;
  workingHours?: string | null;
  services: IndependentProfileService[];
  announcements: IndependentProfileAnnouncement[];
  ctas: IndependentProfileCta[];
  isPublished: boolean;
  sortOrder: number;
};

type IndependentProfileRow = {
  id: string;
  slug: string;
  profile_kind: IndependentProfileKind;
  type_label: string;
  title: string;
  subtitle: string | null;
  country: string;
  city: string;
  description: string;
  website_url: string | null;
  hero_image_url: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address_text: string | null;
  map_query: string | null;
  working_hours: string | null;
  services_json: unknown;
  announcements_json: unknown;
  cta_json: unknown;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const CONSULATE_SLUG_BY_ASSOCIATION_ID: Record<string, string> = {
  "tc-berlin-buyukelcilik": "tc-berlin-buyukelcilik",
  "tc-londra-baskonsolosluk": "tc-londra-baskonsolosluk",
  "tc-washington-buyukelcilik": "tc-washington-buyukelcilik",
  "tc-dubai-baskonsolosluk": "tc-dubai-baskonsolosluk",
};

const normalizeOptionalText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const parseServices = (value: unknown): IndependentProfileService[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item) => ({
          title: typeof item.title === "string" ? item.title : "",
          description: typeof item.description === "string" ? item.description : "",
        }))
        .filter((item) => item.title)
    : [];

const parseAnnouncements = (value: unknown): IndependentProfileAnnouncement[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item) => ({
          title: typeof item.title === "string" ? item.title : "",
          date: typeof item.date === "string" ? item.date : undefined,
          type: typeof item.type === "string" ? item.type : undefined,
          description: typeof item.description === "string" ? item.description : undefined,
        }))
        .filter((item) => item.title)
    : [];

const parseCtas = (value: unknown): IndependentProfileCta[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item) => ({
          label: typeof item.label === "string" ? item.label : "",
          url: typeof item.url === "string" ? item.url : "",
          variant: item.variant === "default" ? "default" : "outline",
        }))
        .filter((item) => item.label && item.url)
    : [];

const rowToIndependentProfile = (row: IndependentProfileRow): IndependentProfile => ({
  id: row.id,
  slug: row.slug,
  profileKind: row.profile_kind,
  typeLabel: row.type_label,
  title: row.title,
  subtitle: row.subtitle,
  country: row.country,
  city: row.city,
  description: row.description,
  websiteUrl: row.website_url,
  heroImageUrl: row.hero_image_url,
  logoUrl: row.logo_url,
  contactEmail: row.contact_email,
  contactPhone: row.contact_phone,
  addressText: row.address_text,
  mapQuery: row.map_query,
  workingHours: row.working_hours,
  services: parseServices(row.services_json),
  announcements: parseAnnouncements(row.announcements_json),
  ctas: parseCtas(row.cta_json),
  isPublished: row.is_published,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const inputToPayload = (input: IndependentProfileInput) => ({
  slug: input.slug.trim(),
  profile_kind: input.profileKind,
  type_label: input.typeLabel.trim(),
  title: input.title.trim(),
  subtitle: normalizeOptionalText(input.subtitle),
  country: input.country.trim(),
  city: input.city.trim(),
  description: input.description.trim(),
  website_url: normalizeOptionalText(input.websiteUrl),
  hero_image_url: normalizeOptionalText(input.heroImageUrl),
  logo_url: normalizeOptionalText(input.logoUrl),
  contact_email: normalizeOptionalText(input.contactEmail),
  contact_phone: normalizeOptionalText(input.contactPhone),
  address_text: normalizeOptionalText(input.addressText),
  map_query: normalizeOptionalText(input.mapQuery),
  working_hours: normalizeOptionalText(input.workingHours),
  services_json: input.services,
  announcements_json: input.announcements,
  cta_json: input.ctas,
  is_published: input.isPublished,
  sort_order: input.sortOrder,
});

export const slugifyIndependentProfile = (value: string) =>
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
    .slice(0, 80);

export const getConsulateSlugForAssociationId = (associationId: string) =>
  CONSULATE_SLUG_BY_ASSOCIATION_ID[associationId] ?? null;

export async function getPublicIndependentProfile(slug: string): Promise<IndependentProfile | null> {
  const { data, error } = await (supabase as any).rpc("get_public_independent_profile", {
    p_slug: slug,
  });

  if (error || !data) return null;
  return rowToIndependentProfile(data as IndependentProfileRow);
}

export async function listPublishedIndependentProfiles(
  profileKind: IndependentProfileKind = "consulate",
): Promise<IndependentProfile[]> {
  const { data, error } = await (supabase as any)
    .from("independent_profiles")
    .select("*")
    .eq("is_published", true)
    .eq("profile_kind", profileKind)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error || !Array.isArray(data)) return [];
  return data.map((row) => rowToIndependentProfile(row as IndependentProfileRow));
}

export async function listIndependentProfilesAsAdmin(): Promise<IndependentProfile[]> {
  const { data, error } = await (supabase as any)
    .from("independent_profiles")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as IndependentProfileRow[]).map(rowToIndependentProfile);
}

export async function createIndependentProfileAsAdmin(input: IndependentProfileInput): Promise<IndependentProfile> {
  const { data, error } = await (supabase as any)
    .from("independent_profiles")
    .insert(inputToPayload(input))
    .select("*")
    .single();

  if (error) throw error;
  return rowToIndependentProfile(data as IndependentProfileRow);
}

export async function updateIndependentProfileAsAdmin(
  id: string,
  input: IndependentProfileInput,
): Promise<IndependentProfile> {
  const { data, error } = await (supabase as any)
    .from("independent_profiles")
    .update(inputToPayload(input))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return rowToIndependentProfile(data as IndependentProfileRow);
}

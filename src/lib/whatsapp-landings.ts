import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type LandingMode = "visual" | "text";
export type LandingCategory =
  | "alumni"
  | "hobi"
  | "is"
  | "doktor"
  | "yatirim"
  | "girisim"
  | "akademik"
  | "dayanisma"
  | "diger";
export type LandingStatus = "pending" | "approved" | "rejected";
export type LandingSubmitterRole = "manager" | "member";

type WhatsAppLandingRow = Tables<"whatsapp_landings">;
type WhatsAppJoinRequestInsert = TablesInsert<"whatsapp_join_requests">;

export interface WhatsAppLanding {
  id: string;
  dbId?: string;
  groupName: string;
  platform?: string;
  category: LandingCategory;
  country: string;
  city: string;
  mode: LandingMode;
  heroImage?: string;
  tagline: string;
  callToActionText: string;
  conditions: string;
  whatsappLink: string;
  adminName?: string;
  adminContact?: string;
  description?: string;
  submitterRole?: LandingSubmitterRole;
  memberApproved?: boolean;
  adminApproved?: boolean;
  status?: LandingStatus;
  rejectionReason?: string;
  createdAt: string;
}

export interface SaveLandingInput {
  groupName: string;
  category: LandingCategory;
  country: string;
  city: string;
  mode: LandingMode;
  heroImage?: string;
  tagline?: string;
  callToActionText?: string;
  conditions?: string;
  whatsappLink: string;
  adminName?: string;
  adminContact?: string;
  description?: string;
}

export interface JoinRequestInput {
  landingDbId: string;
  fullName: string;
  email: string;
  phone?: string;
  note?: string;
}

export interface UpdateLandingInput {
  groupName: string;
  category: LandingCategory;
  country: string;
  city: string;
  mode: LandingMode;
  heroImage?: string;
  tagline?: string;
  callToActionText?: string;
  conditions?: string;
  whatsappLink: string;
  adminName?: string;
  adminContact?: string;
  description?: string;
  memberApproved: boolean;
  adminApproved: boolean;
}

const WHATSAPP_LANDING_HERO_BUCKET = "whatsapp-landing-hero";

const COMMUNITY_TURKISH_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bTurk\b/g, "Türk"],
  [/\bturk\b/g, "türk"],
  [/\bGirisimciler\b/g, "Girişimciler"],
  [/\bgirisimciler\b/g, "girişimciler"],
  [/\bGirisim\b/g, "Girişim"],
  [/\bgirisim\b/g, "girişim"],
  [/\bYatirim\b/g, "Yatırım"],
  [/\byatirim\b/g, "yatırım"],
  [/\bCevresi\b/g, "Çevresi"],
  [/\bcevresi\b/g, "çevresi"],
  [/\bBirlesik\b/g, "Birleşik"],
  [/\bbirlesik\b/g, "birleşik"],
  [/\bIliskileri\b/g, "İlişkileri"],
  [/\biliskileri\b/g, "ilişkileri"],
  [/\bDayanisma\b/g, "Dayanışma"],
  [/\bdayanisma\b/g, "dayanışma"],
  [/\bKulubu\b/g, "Kulübü"],
  [/\bkulubu\b/g, "kulübü"],
  [/\bAgi\b/g, "Ağı"],
  [/\bagi\b/g, "ağı"],
  [/\bHatti\b/g, "Hattı"],
  [/\bhatti\b/g, "hattı"],
];

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

// Keep addcom copy and community metadata on a single Turkish normalization path.
export function normalizeCommunityText(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  return COMMUNITY_TURKISH_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    trimmed,
  );
}

function parseSubmitterRole(description?: string | null): LandingSubmitterRole | undefined {
  if (!description) return undefined;
  if (description.includes("[Başvuru tipi: Topluluk Yöneticisiyim]")) return "manager";
  if (description.includes("[Başvuru tipi: Topluluk Üyesiyim]")) return "member";
  return undefined;
}

function parseTagValue(description: string | null | undefined, tagName: string) {
  if (!description) return undefined;
  const match = description.match(new RegExp(`\\[${tagName}:\\s*([^\\]]+)\\]`, "i"));
  return match?.[1]?.trim();
}

function normalizeOptionalText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeCommunityOptionalText(value?: string | null) {
  const trimmed = normalizeCommunityText(value);
  return trimmed ? trimmed : undefined;
}

function rowToLanding(row: WhatsAppLandingRow): WhatsAppLanding {
  return {
    id: row.slug,
    dbId: row.id,
    groupName: normalizeCommunityText(row.group_name),
    platform: parseTagValue(row.description, "Platform"),
    category: row.category as LandingCategory,
    country: normalizeCommunityText(row.country),
    city: normalizeCommunityText(row.city),
    mode: row.mode as LandingMode,
    heroImage: row.hero_image ?? undefined,
    tagline: normalizeCommunityText(row.tagline),
    callToActionText: normalizeCommunityText(row.call_to_action_text),
    conditions: normalizeCommunityText(row.conditions),
    whatsappLink: row.whatsapp_link,
    adminName: normalizeCommunityOptionalText(row.admin_name),
    adminContact: normalizeOptionalText(row.admin_contact),
    description: normalizeCommunityOptionalText(row.description),
    submitterRole: parseSubmitterRole(row.description),
    memberApproved: row.member_approved ?? false,
    adminApproved: row.admin_approved ?? false,
    status: row.status as LandingStatus,
    rejectionReason: row.rejection_reason ?? undefined,
    createdAt: row.created_at,
  };
}

async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Giriş yapmalısın.");
  return user;
}

export async function getLanding(slug: string): Promise<WhatsAppLanding | undefined> {
  const { data, error } = await supabase
    .from("whatsapp_landings")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!error && data) return rowToLanding(data);
  return undefined;
}

export async function listLandings(): Promise<WhatsAppLanding[]> {
  const { data, error } = await supabase
    .from("whatsapp_landings")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (!error && data) return data.map(rowToLanding);
  return [];
}

export async function submitLanding(input: SaveLandingInput): Promise<{ slug: string; id: string }> {
  const user = await getAuthenticatedUser();
  const groupName = normalizeCommunityText(input.groupName);
  const country = normalizeCommunityText(input.country);
  const city = normalizeCommunityText(input.city);
  const heroImage = input.heroImage?.trim() || null;
  const tagline = normalizeCommunityText(input.tagline) || null;
  const callToActionText = normalizeCommunityText(input.callToActionText) || null;
  const conditions = normalizeCommunityText(input.conditions) || null;
  const description = normalizeCommunityText(input.description) || null;
  const baseSlug = slugify(`${groupName}-${city}`) || `addwa-${Date.now()}`;
  let slug = baseSlug;
  const adminName = normalizeCommunityOptionalText(input.adminName) ?? null;
  const adminContact = normalizeOptionalText(input.adminContact) ?? null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data } = await supabase.from("whatsapp_landings").select("id").eq("slug", slug).maybeSingle();
    if (!data) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const payload: TablesInsert<"whatsapp_landings"> = {
    user_id: user.id,
    slug,
    group_name: groupName,
    category: input.category,
    country,
    city,
    mode: input.mode,
    hero_image: heroImage,
    tagline,
    call_to_action_text: callToActionText,
    conditions,
    whatsapp_link: input.whatsappLink.trim(),
    admin_name: adminName,
    admin_contact: adminContact,
    description,
  };

  const { error } = await supabase.from("whatsapp_landings").insert(payload);

  if (error) throw error;

  const { data } = await supabase
    .from("whatsapp_landings")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  return { id: data?.id ?? "", slug };
}

export async function uploadWhatsAppLandingHeroImage(file: File): Promise<string> {
  const user = await getAuthenticatedUser();
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const safeBase = slugify(file.name.replace(/\.[^/.]+$/, "")) || "hero-image";
  const filePath = `${user.id}/${Date.now()}-${safeBase}.${extension}`;

  const { error } = await supabase.storage
    .from(WHATSAPP_LANDING_HERO_BUCKET)
    .upload(filePath, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage
    .from(WHATSAPP_LANDING_HERO_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function createJoinRequest(input: JoinRequestInput) {
  const user = await getAuthenticatedUser();

  const payload: WhatsAppJoinRequestInsert = {
    landing_id: input.landingDbId,
    user_id: user.id,
    full_name: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || null,
    note: input.note?.trim() || null,
  };

  const { error } = await supabase.from("whatsapp_join_requests").insert(payload);
  if (error) throw error;
}

export async function listAllSubmissions(status?: LandingStatus): Promise<WhatsAppLanding[]> {
  let query = supabase.from("whatsapp_landings").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(rowToLanding);
}

export async function setLandingStatus(dbId: string, status: LandingStatus, rejectionReason?: string) {
  const { error } = await supabase
    .from("whatsapp_landings")
    .update({
      status,
      rejection_reason: rejectionReason?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dbId);

  if (error) throw error;
}

export async function updateLandingTagline(dbId: string, tagline: string) {
  const { error } = await supabase
    .from("whatsapp_landings")
    .update({
      tagline: tagline.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dbId);

  if (error) throw error;
}

export async function updateLanding(dbId: string, input: UpdateLandingInput) {
  if (input.memberApproved && input.adminApproved) {
    throw new Error("Bir topluluk hem üye hem admin onaylı olamaz");
  }

  const adminName = normalizeCommunityOptionalText(input.adminName) ?? null;
  const adminContact = normalizeOptionalText(input.adminContact) ?? null;

  const cleanDescription = normalizeCommunityText(
    input.description
      ?.replace(/\[Badge member:\s*(true|false)\]\s*/gi, "")
      .replace(/\[Badge admin:\s*(true|false)\]\s*/gi, "")
      .trim(),
  ) || null;

  const { error } = await supabase
    .from("whatsapp_landings")
    .update({
      group_name: normalizeCommunityText(input.groupName),
      category: input.category,
      country: normalizeCommunityText(input.country),
      city: normalizeCommunityText(input.city),
      mode: input.mode,
      hero_image: input.heroImage?.trim() || null,
      tagline: normalizeCommunityText(input.tagline) || null,
      call_to_action_text: normalizeCommunityText(input.callToActionText) || null,
      conditions: normalizeCommunityText(input.conditions) || null,
      whatsapp_link: input.whatsappLink.trim(),
      admin_name: adminName,
      admin_contact: adminContact,
      description: cleanDescription,
      member_approved: input.memberApproved,
      admin_approved: input.adminApproved,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dbId);

  if (error) throw error;
}

export async function deleteLanding(dbId: string) {
  const { error } = await supabase.from("whatsapp_landings").delete().eq("id", dbId);
  if (error) throw error;
}

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
  editorReviewPending?: boolean;
  editorReviewUpdatedAt?: string;
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
}

export interface LandingEditorAssignment {
  id: string;
  landingId: string;
  landingSlug: string;
  landingGroupName: string;
  userId: string;
  userFullName: string | null;
  userEmail: string | null;
  createdAt: string;
  updatedAt: string;
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

function parseBooleanTag(description: string | null | undefined, tagName: string, fallback: boolean) {
  if (!description) return fallback;
  const match = description.match(new RegExp(`\\[${tagName}:\\s*(true|false)\\]`, "i"));
  if (!match) return fallback;
  return match[1].toLowerCase() === "true";
}

function hasBooleanTag(description: string | null | undefined, tagName: string) {
  if (!description) return false;
  return new RegExp(`\\[${tagName}:\\s*(true|false)\\]`, "i").test(description);
}

function normalizeOptionalText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeCommunityOptionalText(value?: string | null) {
  const trimmed = normalizeCommunityText(value);
  return trimmed ? trimmed : undefined;
}

export function stripLandingMetadataTags(description?: string | null) {
  return (description ?? "")
    .replace(/\[Platform:\s*[^\]]+\]\s*/gi, "")
    .replace(/\[Badge member:\s*(true|false)\]\s*/gi, "")
    .replace(/\[Badge admin:\s*(true|false)\]\s*/gi, "")
    .replace(/\[Editor review pending:\s*(true|false)\]\s*/gi, "")
    .replace(/\[Editor review updated at:\s*[^\]]+\]\s*/gi, "")
    .trim();
}

export function parseAdminContact(adminContact?: string) {
  const lines = adminContact?.split("\n").map((line) => line.trim()).filter(Boolean) ?? [];
  const emailLine = lines.find((line) => line.toLowerCase().startsWith("e-posta:"));
  const phoneLine = lines.find((line) => line.toLowerCase().startsWith("telefon:"));
  const emailMatch = adminContact?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = adminContact?.match(/(\+?\d[\d\s().-]{6,}\d)/);

  return {
    adminEmail: emailLine ? emailLine.replace(/^e-posta:\s*/i, "").trim() : (emailMatch?.[0] ?? ""),
    adminPhone: phoneLine ? phoneLine.replace(/^telefon:\s*/i, "").trim() : (phoneMatch?.[0]?.trim() ?? ""),
  };
}

export function buildLandingDescription(params: {
  description?: string | null;
  platform?: string | null;
  memberApproved?: boolean;
  adminApproved?: boolean;
  editorReviewPending?: boolean;
  editorReviewUpdatedAt?: string | null;
}) {
  const parts = [stripLandingMetadataTags(params.description)];

  if (params.platform?.trim()) {
    parts.push(`[Platform: ${params.platform.trim()}]`);
  }

  if (typeof params.memberApproved === "boolean") {
    parts.push(`[Badge member: ${params.memberApproved ? "true" : "false"}]`);
  }

  if (typeof params.adminApproved === "boolean") {
    parts.push(`[Badge admin: ${params.adminApproved ? "true" : "false"}]`);
  }

  if (typeof params.editorReviewPending === "boolean") {
    parts.push(`[Editor review pending: ${params.editorReviewPending ? "true" : "false"}]`);
  }

  if (params.editorReviewUpdatedAt?.trim()) {
    parts.push(`[Editor review updated at: ${params.editorReviewUpdatedAt.trim()}]`);
  }

  return parts.filter(Boolean).join(" ").trim();
}

export function rowToLanding(row: WhatsAppLandingRow): WhatsAppLanding {
  const hasMemberApprovalTag = hasBooleanTag(row.description, "Badge member");
  const hasAdminApprovalTag = hasBooleanTag(row.description, "Badge admin");
  const adminApproved = hasAdminApprovalTag
    ? parseBooleanTag(row.description, "Badge admin", false)
    : row.status === "approved";
  const memberApproved = adminApproved
    ? false
    : hasMemberApprovalTag
      ? parseBooleanTag(row.description, "Badge member", false)
      : true;

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
    memberApproved,
    adminApproved,
    editorReviewPending: parseBooleanTag(row.description, "Editor review pending", false),
    editorReviewUpdatedAt: parseTagValue(row.description, "Editor review updated at"),
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

async function getOptionalUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  return user ?? null;
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

export async function getEditableLandingForCurrentUser(slug: string): Promise<WhatsAppLanding | undefined> {
  const { data, error } = await (supabase as any).rpc("get_current_user_editable_whatsapp_landing", {
    p_slug: slug,
  });

  if (error || !Array.isArray(data) || data.length === 0) return undefined;
  return rowToLanding(data[0] as WhatsAppLandingRow);
}

export async function canCurrentUserEditLanding(landingDbId: string): Promise<boolean> {
  const { data, error } = await (supabase as any).rpc("current_user_can_edit_whatsapp_landing", {
    p_landing_id: landingDbId,
  });

  if (error) return false;
  return Boolean(data);
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
  const user = await getOptionalUser();
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

  const payload = {
    user_id: user?.id ?? null,
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
  } as TablesInsert<"whatsapp_landings">;

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
  const user = await getOptionalUser();
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const safeBase = slugify(file.name.replace(/\.[^/.]+$/, "")) || "hero-image";
  const ownerSegment = user?.id ?? "anon";
  const filePath = `${ownerSegment}/${Date.now()}-${safeBase}.${extension}`;

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
  const user = await getOptionalUser();

  const payload = {
    landing_id: input.landingDbId,
    user_id: user?.id ?? null,
    full_name: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || null,
    note: input.note?.trim() || null,
  } as WhatsAppJoinRequestInsert;

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
  const adminName = normalizeCommunityOptionalText(input.adminName) ?? null;
  const adminContact = normalizeOptionalText(input.adminContact) ?? null;

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
      description: normalizeCommunityText(input.description) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dbId);

  if (error) throw error;
}

export async function updateCurrentUserEditableLanding(params: {
  landingId: string;
  groupName: string;
  category: LandingCategory;
  country: string;
  city: string;
  heroImage?: string;
  callToActionText?: string;
  conditions?: string;
  whatsappLink: string;
  adminName?: string;
  adminContact?: string;
  description?: string;
}) {
  const { data, error } = await (supabase as any).rpc("update_current_user_editable_whatsapp_landing", {
    p_landing_id: params.landingId,
    p_group_name: normalizeCommunityText(params.groupName),
    p_category: params.category,
    p_country: normalizeCommunityText(params.country),
    p_city: normalizeCommunityText(params.city),
    p_hero_image: params.heroImage?.trim() || null,
    p_call_to_action_text: normalizeCommunityText(params.callToActionText) || null,
    p_conditions: normalizeCommunityText(params.conditions) || null,
    p_whatsapp_link: params.whatsappLink.trim(),
    p_admin_name: normalizeCommunityOptionalText(params.adminName) ?? null,
    p_admin_contact: normalizeOptionalText(params.adminContact) ?? null,
    p_description: normalizeCommunityText(params.description) || null,
  });

  if (error) throw error;
  return rowToLanding(data as WhatsAppLandingRow);
}

export async function listLandingEditorAssignmentsAsAdmin(): Promise<LandingEditorAssignment[]> {
  const { data, error } = await (supabase as any)
    .from("whatsapp_landing_editors")
    .select(`
      id,
      landing_id,
      user_id,
      created_at,
      updated_at,
      whatsapp_landings!inner(id, slug, group_name),
      user_profiles!inner(user_id, full_name, email)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as any[]).map((row) => ({
    id: String(row.id),
    landingId: String(row.landing_id),
    landingSlug: String(row.whatsapp_landings.slug),
    landingGroupName: normalizeCommunityText(String(row.whatsapp_landings.group_name)),
    userId: String(row.user_id),
    userFullName: row.user_profiles.full_name ?? null,
    userEmail: row.user_profiles.email ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export async function grantLandingEditorAsAdmin(landingId: string, userId: string) {
  const { error } = await (supabase as any).rpc("admin_grant_whatsapp_landing_editor", {
    p_landing_id: landingId,
    p_user_id: userId,
  });

  if (error) throw error;
}

export async function revokeLandingEditorAsAdmin(assignmentId: string) {
  const { error } = await (supabase as any).rpc("admin_revoke_whatsapp_landing_editor", {
    p_assignment_id: assignmentId,
  });

  if (error) throw error;
}

export async function deleteLanding(dbId: string) {
  const { error } = await supabase.from("whatsapp_landings").delete().eq("id", dbId);
  if (error) throw error;
}

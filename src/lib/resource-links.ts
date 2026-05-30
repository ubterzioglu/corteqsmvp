import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export const resourceLinkPlatforms = [
  "Instagram",
  "LinkedIn",
  "Twitter (X)",
  "YouTube",
  "TikTok",
  "Facebook",
  "Reddit",
  "Discord",
  "Diğer",
] as const;

export const resourceLinkAuthors = ["UBT", "Burak", "Diğer"] as const;

export const advisorProfileSections = [
  { key: "consultant", label: "Consultant", tableName: "consultant_social_media_links" },
  { key: "influencer", label: "Influencer", tableName: "influencer_social_media_links" },
  { key: "contributor", label: "Contributor", tableName: "contributor_social_media_links" },
] as const;

export type AdvisorProfileSection = (typeof advisorProfileSections)[number];
export type AdvisorProfileKey = AdvisorProfileSection["key"];
export type AdvisorProfileTableName = AdvisorProfileSection["tableName"];
export type ResourceLinkTableName = "advisor_social_media_links" | "social_media_links" | AdvisorProfileTableName;
export type ResourceLinkPlatform = (typeof resourceLinkPlatforms)[number];
export type ResourceLinkAuthor = (typeof resourceLinkAuthors)[number];
export type LegacyAdvisorResourceLinkRow = Tables<"advisor_social_media_links">;
export type AdvisorResourceLinkRow = Tables<"consultant_social_media_links">;
export type SocialResourceLinkRow = Tables<"social_media_links">;
export type ResourceLinkRow = LegacyAdvisorResourceLinkRow | AdvisorResourceLinkRow | SocialResourceLinkRow;
export type ResourceLinkInsert = TablesInsert<"advisor_social_media_links">;
export type ResourceLinkUpdate = TablesUpdate<"advisor_social_media_links">;
export type AdvisorResourceLinkInsert = TablesInsert<"consultant_social_media_links">;
export type AdvisorResourceLinkUpdate = TablesUpdate<"consultant_social_media_links">;
export type AdvisorContactStatusKey =
  | "contacted_whatsapp"
  | "contacted_instagram"
  | "contacted_email"
  | "contacted_phone";

export type ResourceLinkFormState = {
  platform: ResourceLinkPlatform;
  description: string;
  link: string;
  added_by: ResourceLinkAuthor;
};

export type AdvisorResourceLinkFormState = {
  name: string;
  description: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  contacted_whatsapp: boolean;
  contacted_instagram: boolean;
  contacted_email: boolean;
  contacted_phone: boolean;
  added_by: ResourceLinkAuthor;
};

export function createEmptyResourceLinkFormState(): ResourceLinkFormState {
  return {
    platform: "Diğer",
    description: "",
    link: "",
    added_by: "UBT",
  };
}

export function createEmptyAdvisorResourceLinkFormState(): AdvisorResourceLinkFormState {
  return {
    name: "",
    description: "",
    email: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    contacted_whatsapp: false,
    contacted_instagram: false,
    contacted_email: false,
    contacted_phone: false,
    added_by: "UBT",
  };
}

export function validateResourceLinkUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Link URL zorunlu.";
  if (!/^https?:\/\/\S+$/i.test(trimmed)) return "Link http:// veya https:// ile başlamalı.";
  return null;
}

export function validateAdvisorResourceLinkForm(form: AdvisorResourceLinkFormState) {
  if (!form.name.trim()) return "Ad zorunlu.";
  return null;
}

export function toResourceLinkPayload(form: ResourceLinkFormState): ResourceLinkInsert {
  const urlError = validateResourceLinkUrl(form.link);
  if (urlError) throw new Error(urlError);

  return {
    platform: form.platform,
    description: form.description.trim() || null,
    link: form.link.trim(),
    added_by: form.added_by,
  };
}

export function toAdvisorResourceLinkPayload(form: AdvisorResourceLinkFormState): AdvisorResourceLinkInsert {
  const formError = validateAdvisorResourceLinkForm(form);
  if (formError) throw new Error(formError);
  const instagram = form.instagram.trim() || null;

  return {
    name: form.name.trim(),
    platform: "Instagram",
    description: form.description.trim() || null,
    link: instagram,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    whatsapp: form.whatsapp.trim() || null,
    instagram,
    contacted_whatsapp: form.contacted_whatsapp,
    contacted_instagram: form.contacted_instagram,
    contacted_email: form.contacted_email,
    contacted_phone: form.contacted_phone,
    added_by: form.added_by,
  };
}

export function toResourceLinkFormState(row: ResourceLinkRow): ResourceLinkFormState {
  return {
    platform: row.platform,
    description: row.description ?? "",
    link: row.link ?? "",
    added_by: row.added_by,
  };
}

export function toAdvisorResourceLinkFormState(row: AdvisorResourceLinkRow): AdvisorResourceLinkFormState {
  return {
    name: row.name,
    description: row.description ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    whatsapp: row.whatsapp ?? "",
    instagram: row.instagram ?? row.link ?? "",
    contacted_whatsapp: row.contacted_whatsapp,
    contacted_instagram: row.contacted_instagram,
    contacted_email: row.contacted_email,
    contacted_phone: row.contacted_phone,
    added_by: row.added_by,
  };
}

export function safeResourceHref(value: string | null) {
  if (!value) return "#";
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return "#";
  return trimmed;
}

export async function listResourceLinks(tableName: ResourceLinkTableName): Promise<ResourceLinkRow[]> {
  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listAdvisorResourceLinks(tableName: AdvisorProfileTableName): Promise<AdvisorResourceLinkRow[]> {
  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createResourceLink(
  tableName: ResourceLinkTableName,
  payload: ResourceLinkInsert,
): Promise<ResourceLinkRow> {
  const { data, error } = await supabase.from(tableName).insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function createAdvisorResourceLink(
  tableName: AdvisorProfileTableName,
  payload: AdvisorResourceLinkInsert,
): Promise<AdvisorResourceLinkRow> {
  const { data, error } = await supabase.from(tableName).insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateResourceLink(
  tableName: ResourceLinkTableName,
  id: string,
  payload: ResourceLinkUpdate,
): Promise<ResourceLinkRow> {
  const { data, error } = await supabase.from(tableName).update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateAdvisorResourceLink(
  tableName: AdvisorProfileTableName,
  id: string,
  payload: AdvisorResourceLinkUpdate,
): Promise<AdvisorResourceLinkRow> {
  const { data, error } = await supabase
    .from(tableName)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateAdvisorContactStatus(
  tableName: AdvisorProfileTableName,
  id: string,
  key: AdvisorContactStatusKey,
  value: boolean,
): Promise<AdvisorResourceLinkRow> {
  return updateAdvisorResourceLink(tableName, id, { [key]: value });
}

export async function deleteResourceLink(tableName: ResourceLinkTableName, id: string): Promise<void> {
  const { error } = await supabase.from(tableName).delete().eq("id", id);
  if (error) throw error;
}

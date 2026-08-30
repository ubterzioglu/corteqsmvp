import { supabase } from "@/integrations/supabase/client";

export const CONTRIBUTOR_RESOURCE_TYPES = [
  "business",
  "advisor",
  "association",
  "whatsapp_group",
  "influencer",
  "event",
  "facebook_group",
  "instagram_page",
  "professional_community",
  "local_service",
] as const;

export type ContributorResourceType = (typeof CONTRIBUTOR_RESOURCE_TYPES)[number];
export type ContributorResourceStatus = "draft" | "submitted" | "accepted" | "needs_info" | "rejected" | "duplicate";
export type ContributorPermissionStatus = "unknown" | "confirmed" | "not_required";

export type ContributorResourceInput = {
  resourceType: ContributorResourceType;
  displayName: string;
  country: string;
  city: string;
  sourceUrl: string;
  summary: string;
  verifiedOn: string;
  permissionStatus: ContributorPermissionStatus;
  conflictDisclosure: string;
};

export type ContributorResourceSubmission = ContributorResourceInput & {
  id: string;
  status: ContributorResourceStatus;
  decisionNote: string | null;
  canonicalSubmissionId: string | null;
  submittedBy: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

type ContributorResourceRow = {
  id: string;
  resource_type: string;
  display_name: string;
  country: string;
  city: string;
  source_url: string;
  summary: string;
  verified_on: string;
  permission_status: string;
  conflict_disclosure: string | null;
  status: string;
  decision_note: string | null;
  canonical_submission_id: string | null;
  submitted_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const STATUSES: ContributorResourceStatus[] = ["draft", "submitted", "accepted", "needs_info", "rejected", "duplicate"];
const PERMISSION_STATUSES: ContributorPermissionStatus[] = ["unknown", "confirmed", "not_required"];

export function contributorResourceStatus(value: string): ContributorResourceStatus {
  return STATUSES.includes(value as ContributorResourceStatus) ? value as ContributorResourceStatus : "submitted";
}

function contributorResourceType(value: string): ContributorResourceType {
  return CONTRIBUTOR_RESOURCE_TYPES.includes(value as ContributorResourceType)
    ? value as ContributorResourceType
    : "local_service";
}

function contributorPermissionStatus(value: string): ContributorPermissionStatus {
  return PERMISSION_STATUSES.includes(value as ContributorPermissionStatus)
    ? value as ContributorPermissionStatus
    : "unknown";
}

export function validateContributorResourceInput(input: ContributorResourceInput): string | null {
  if (input.displayName.trim().length < 2) return "Kaynak adı en az iki karakter olmalı.";
  if (input.country.trim().length < 2 || input.city.trim().length < 2) return "Ülke ve şehir zorunlu.";
  if (input.summary.trim().length < 10) return "Fayda özeti en az 10 karakter olmalı.";
  if (!input.verifiedOn) return "Bilginin kontrol edildiği tarih zorunlu.";
  if (input.verifiedOn > new Date().toISOString().slice(0, 10)) return "Kontrol tarihi gelecekte olamaz.";

  try {
    const parsed = new URL(input.sourceUrl.trim());
    if (!(["http:", "https:"] as string[]).includes(parsed.protocol)) throw new Error("unsafe protocol");
    if (parsed.username || parsed.password) return "Kaynak adresinde kullanıcı adı veya parola bulunamaz.";
  } catch {
    return "Birincil kaynak adresi http veya https ile başlayan geçerli bir URL olmalı.";
  }

  if (input.sourceUrl.trim().length > 2048) return "Kaynak adresi çok uzun.";
  if (input.conflictDisclosure.trim().length > 1000) return "Çıkar ilişkisi açıklaması çok uzun.";
  return null;
}

function mapRow(row: ContributorResourceRow): ContributorResourceSubmission {
  return {
    id: row.id,
    resourceType: contributorResourceType(row.resource_type),
    displayName: row.display_name,
    country: row.country,
    city: row.city,
    sourceUrl: row.source_url,
    summary: row.summary,
    verifiedOn: row.verified_on,
    permissionStatus: contributorPermissionStatus(row.permission_status),
    conflictDisclosure: row.conflict_disclosure ?? "",
    status: contributorResourceStatus(row.status),
    decisionNote: row.decision_note,
    canonicalSubmissionId: row.canonical_submission_id,
    submittedBy: row.submitted_by,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

export async function listContributorResourceSubmissions(): Promise<ContributorResourceSubmission[]> {
  const { data, error } = await supabase
    .from("contributor_resource_submissions")
    .select("id, resource_type, display_name, country, city, source_url, summary, verified_on, permission_status, conflict_disclosure, status, decision_note, canonical_submission_id, submitted_by, reviewed_by, reviewed_at, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as ContributorResourceRow[]).map(mapRow);
}

export async function createContributorResourceSubmission(input: ContributorResourceInput): Promise<string> {
  const validationError = validateContributorResourceInput(input);
  if (validationError) throw new Error(validationError);

  const { data, error } = await supabase.rpc("admin_create_contributor_resource_submission", {
    p_resource_type: input.resourceType,
    p_display_name: input.displayName.trim(),
    p_country: input.country.trim(),
    p_city: input.city.trim(),
    p_source_url: input.sourceUrl.trim(),
    p_summary: input.summary.trim(),
    p_verified_on: input.verifiedOn,
    p_permission_status: input.permissionStatus,
    p_conflict_disclosure: input.conflictDisclosure.trim() || undefined,
  });
  if (error) throw error;
  if (typeof data !== "string") throw new Error("Kaynak gönderimi oluşturulamadı.");
  return data;
}

export async function listMyContributorResourceSubmissions(): Promise<ContributorResourceSubmission[]> {
  return listContributorResourceSubmissions();
}

export async function submitContributorResourceSubmission(input: ContributorResourceInput): Promise<string> {
  const validationError = validateContributorResourceInput(input);
  if (validationError) throw new Error(validationError);

  const { data, error } = await supabase.rpc("submit_contributor_resource_submission", {
    p_resource_type: input.resourceType,
    p_display_name: input.displayName.trim(),
    p_country: input.country.trim(),
    p_city: input.city.trim(),
    p_source_url: input.sourceUrl.trim(),
    p_summary: input.summary.trim(),
    p_verified_on: input.verifiedOn,
    p_permission_status: input.permissionStatus,
    p_conflict_disclosure: input.conflictDisclosure.trim() || undefined,
  });
  if (error) {
    if (error.message.includes("contributor_role_required")) {
      throw new Error("Kaynak göndermek için aktif Contributor rolü gerekli.");
    }
    if (error.message.includes("rate_limit_exceeded")) {
      throw new Error("Bir saatte en fazla 10 kaynak gönderebilirsin. Lütfen daha sonra tekrar dene.");
    }
    if (error.message.includes("source_already_submitted")) {
      throw new Error("Bu bağlantıyı daha önce incelemeye gönderdin.");
    }
    throw error;
  }
  if (typeof data !== "string") throw new Error("Kaynak gönderimi oluşturulamadı.");
  return data;
}

export async function reviewContributorResourceSubmission(input: {
  submissionId: string;
  status: Exclude<ContributorResourceStatus, "draft" | "submitted">;
  decisionNote?: string;
  canonicalSubmissionId?: string;
}): Promise<void> {
  const { error } = await supabase.rpc("admin_review_contributor_resource_submission", {
    p_submission_id: input.submissionId,
    p_status: input.status,
    p_decision_note: input.decisionNote?.trim() || undefined,
    p_canonical_submission_id: input.canonicalSubmissionId || undefined,
  });
  if (error) throw error;
}

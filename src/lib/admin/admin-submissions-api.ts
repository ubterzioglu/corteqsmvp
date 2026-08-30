import { supabase } from "@/integrations/supabase/client";
import {
  buildSubmissionSearchText,
  getSubmissionDocuments,
  submissionStatusOptions,
  type Submission,
  type SubmissionStatus,
  type UploadedDocument,
} from "@/lib/submissions";
import { trIncludes } from "@/lib/text-normalization";

export const ADMIN_SUBMISSIONS_PAGE_SIZE = 500;
const SUBMISSION_DOCUMENTS_BUCKET = "submission-documents";
const validStatuses = new Set(submissionStatusOptions.map((option) => option.value));

export type AdminSubmissionFilters = {
  status?: string;
  formType?: string;
  category?: string;
  createdFrom?: string;
  createdTo?: string;
  search?: string;
  hasDocuments?: boolean;
};

export type SubmissionPageFetcher = (from: number, to: number) => Promise<Submission[]>;

export async function fetchAllSubmissionPages(
  fetchPage: SubmissionPageFetcher,
  pageSize = ADMIN_SUBMISSIONS_PAGE_SIZE,
): Promise<Submission[]> {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1000) {
    throw new Error("Geçersiz başvuru sayfa boyutu.");
  }

  const rows: Submission[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function fetchSubmissionPage(from: number, to: number): Promise<Submission[]> {
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return (data ?? []) as Submission[];
}

export function filterSubmissions(
  submissions: Submission[],
  filters: AdminSubmissionFilters = {},
): Submission[] {
  const search = filters.search?.trim() ?? "";
  return submissions.filter((submission) => {
    if (filters.status && filters.status !== "all" && submission.status !== filters.status) return false;
    if (filters.formType && filters.formType !== "all" && submission.form_type !== filters.formType) return false;
    if (filters.category && filters.category !== "all" && submission.category !== filters.category) return false;

    const createdDate = submission.created_at.slice(0, 10);
    if (filters.createdFrom && createdDate < filters.createdFrom) return false;
    if (filters.createdTo && createdDate > filters.createdTo) return false;
    if (filters.hasDocuments && getSubmissionDocuments(submission).length === 0) return false;
    if (search && !trIncludes(buildSubmissionSearchText(submission), search)) return false;
    return true;
  });
}

export async function fetchSubmissions(
  filters: AdminSubmissionFilters = {},
): Promise<Submission[]> {
  const submissions = await fetchAllSubmissionPages(fetchSubmissionPage);
  return filterSubmissions(submissions, filters);
}

export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus,
): Promise<Submission> {
  if (!id.trim()) throw new Error("Başvuru kimliği gerekli.");
  if (!validStatuses.has(status)) throw new Error("Geçersiz başvuru durumu.");

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw authError ?? new Error("Yönetici oturumu bulunamadı.");

  const { data, error } = await supabase
    .from("submissions")
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: authData.user.id })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Submission;
}

function normalizeStoragePath(path: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(path).replace(/^\/+/, "");
  } catch {
    return null;
  }
  if (!decoded || decoded.includes("\\") || decoded.split("/").some((segment) => segment === "..")) {
    return null;
  }
  return decoded;
}

export function getSubmissionStoragePath(document: UploadedDocument): string | null {
  if (document.path) return normalizeStoragePath(document.path);
  if (!document.url) return null;

  try {
    const url = new URL(document.url);
    if (!url.hostname.endsWith(".supabase.co")) return null;
    const markers = [
      `/storage/v1/object/public/${SUBMISSION_DOCUMENTS_BUCKET}/`,
      `/storage/v1/object/sign/${SUBMISSION_DOCUMENTS_BUCKET}/`,
      `/storage/v1/object/authenticated/${SUBMISSION_DOCUMENTS_BUCKET}/`,
    ];
    const marker = markers.find((candidate) => url.pathname.includes(candidate));
    if (!marker) return null;
    return normalizeStoragePath(url.pathname.slice(url.pathname.indexOf(marker) + marker.length));
  } catch {
    return null;
  }
}

export async function getAdminSubmissionDocumentUrl(document: UploadedDocument): Promise<string> {
  const path = getSubmissionStoragePath(document);
  if (!path) throw new Error("Dosyanın güvenli depolama yolu bulunamadı.");

  const { data, error } = await supabase.storage
    .from(SUBMISSION_DOCUMENTS_BUCKET)
    .createSignedUrl(path, 300);
  if (error || !data?.signedUrl) throw error ?? new Error("Dosya bağlantısı üretilemedi.");
  return data.signedUrl;
}

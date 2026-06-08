import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { REFERRAL_SOURCE_OPTIONS } from "@/lib/pending-onboarding-normalize";
import { normalizeOptionalTurkishText, normalizeTurkishText } from "@/lib/text-normalization";

export type Submission = Tables<"submissions">;
export type SubmissionInsert = TablesInsert<"submissions">;
export type SubmissionStatus = Submission["status"];
export type SubmissionFormMode = "register" | "support" | "backer";
export type UploadedDocument = {
  url: string | null;
  name: string;
  path?: string | null;
  sizeBytes?: number | null;
  contentType?: string | null;
};
export type SubmissionDocumentsBucketStats = {
  bucketId: string;
  fileCount: number;
  totalBytes: number;
  fileSizeLimit: number;
  usageRatio: number;
};
export type SubmissionDocumentsBucketLevel = "normal" | "info" | "warning" | "critical";
export type ReferralValidationStatus = "missing" | "not_found" | "inactive" | "expired" | "out_of_window" | "valid";

type ErrorWithMessage = {
  message?: string;
  code?: string;
};

export const allowedSubmissionDocumentTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const maxSubmissionDocumentBytes = 50 * 1024 * 1024;
export const maxSubmissionDocumentCount = 5;

export const categoryOptions = [
  { value: "danisman", label: "Danışman" },
  { value: "isletme", label: "İşletme / Şirket" },
  { value: "dernek", label: "Dernek" },
  { value: "vakif", label: "Vakıf" },
  { value: "radyo-tv", label: "Radyo / TV" },
  { value: "blogger-vlogger", label: "Blogger / Vlogger" },
  { value: "influencer", label: "Influencer" },
  { value: "sehir-elcisi", label: "Şehir Elçisi" },
  { value: "bireysel", label: "Bireysel Kullanıcı" },
  { value: "support", label: "Destek / Yatırım" },
] as const;

export const referralSourceOptions = REFERRAL_SOURCE_OPTIONS;

const categoryLabelMap = new Map(categoryOptions.map((option) => [option.value, option.label]));
const referralLabelMap = new Map(referralSourceOptions.map((option) => [option.value, option.label]));

const statusLabelMap: Record<SubmissionStatus, string> = {
  new: "Yeni",
  contacted: "İletişime geçildi",
  archived: "Arşivlendi",
};

export const submissionStatusOptions: Array<{ value: SubmissionStatus; label: string }> = [
  { value: "new", label: statusLabelMap.new },
  { value: "contacted", label: statusLabelMap.contacted },
  { value: "archived", label: statusLabelMap.archived },
];

export function getCategoryLabel(category: string | null) {
  if (!category) return "Belirtilmedi";
  return categoryLabelMap.get(category) ?? category;
}

export function getFormTypeLabel(formType: string) {
  if (formType === "support") return "Destek";
  if (formType === "backer") return "Backer";
  if (formType === "wa") return "WA";
  return "Kayıt";
}

export function getStatusLabel(status: SubmissionStatus) {
  return statusLabelMap[status] ?? status;
}

export function getReferralSourceLabel(source: string | null) {
  if (!source) return "Belirtilmedi";
  if (source === "ai-chat") return "AI Chat";
  return referralLabelMap.get(source) ?? source;
}

export function shouldShowReferralDetail(source: string) {
  return source !== "" && source !== "google" && source !== "basin-haber";
}

export function isReferralDetailRequired(source: string) {
  return source === "whatsapp";
}

export function getReferralDetailLabel(source: string) {
  if (source === "whatsapp") return "Hangi WhatsApp grubu? *";
  if (source === "instagram") return "Hangi Instagram hesabı / gönderi?";
  if (source === "linkedin") return "Hangi LinkedIn hesabı / gönderi?";
  if (source === "x-twitter") return "Hangi X (Twitter) hesabı?";
  if (source === "facebook") return "Hangi Facebook sayfa / grubu?";
  if (source === "tiktok") return "Hangi TikTok hesabı?";
  if (source === "youtube") return "Hangi YouTube kanalı / videosu?";
  if (source === "arkadas-tavsiye") return "Sizi yönlendiren kişinin adı";
  if (source === "etkinlik") return "Hangi etkinlik / buluşma?";
  if (source === "diger") return "Lütfen detay verin";
  return "Detay";
}

export function getReferralDetailPlaceholder(source: string) {
  if (source === "whatsapp") return "Örn: Berlin Diaspora Topluluğu";
  if (source === "arkadas-tavsiye") return "Örn: Ahmet Yılmaz";
  return "Detay yazın";
}

export function buildSubmissionSearchText(submission: Submission) {
  return [
    submission.form_type,
    submission.category,
    submission.status,
    submission.fullname,
    submission.country,
    submission.city,
    submission.business,
    submission.field,
    submission.email,
    submission.phone,
    submission.description,
    submission.offers_needs,
    submission.notes,
    submission.document_name,
    submission.company_name,
    submission.donation_amount?.toString(),
    submission.donation_currency,
    submission.whatsapp_interest?.toString(),
    submission.referral_source,
    submission.referral_detail,
    submission.referral_code,
    submission.linkedin,
    submission.instagram,
    submission.tiktok,
    submission.facebook,
    submission.twitter,
    submission.website,
    submission.documents
      ?.map((document) => {
        if (!document || typeof document !== "object") return "";
        return "name" in document && typeof document.name === "string" ? document.name : "";
      })
      .filter(Boolean)
      .join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function validateSubmissionDocuments(files: File[], currentFiles: File[] = []) {
  const merged = [...currentFiles];

  for (const file of files) {
    if (!allowedSubmissionDocumentTypes.includes(file.type as (typeof allowedSubmissionDocumentTypes)[number])) {
      return {
        ok: false as const,
        message: `"${file.name}" desteklenmeyen format. Sadece PDF, DOC, DOCX, JPG, PNG, WEBP.`,
      };
    }

    if (file.size > maxSubmissionDocumentBytes) {
      return {
        ok: false as const,
        message: `"${file.name}" çok büyük. Dosya başına maks. 50 MB.`,
      };
    }

    if (merged.length >= maxSubmissionDocumentCount) {
      return {
        ok: false as const,
        message: `En fazla ${maxSubmissionDocumentCount} dosya yükleyebilirsiniz.`,
      };
    }

    if (!merged.some((existing) => existing.name === file.name && existing.size === file.size)) {
      merged.push(file);
    }
  }

  return { ok: true as const, files: merged };
}

function parseUploadedDocument(input: unknown): UploadedDocument | null {
  if (!input || typeof input !== "object") return null;

  const url = "url" in input && typeof input.url === "string" ? input.url : null;
  const name = "name" in input && typeof input.name === "string" ? input.name : "";
  const path = "path" in input && typeof input.path === "string" ? input.path : null;
  const sizeBytes =
    "sizeBytes" in input && typeof input.sizeBytes === "number" && Number.isFinite(input.sizeBytes)
      ? input.sizeBytes
      : null;
  const contentType =
    "contentType" in input && typeof input.contentType === "string" ? input.contentType : null;

  if (!name || (!url && !path)) return null;

  return { url, name, path, sizeBytes, contentType };
}

export function getSubmissionDocuments(
  submission: Pick<Submission, "documents" | "document_url" | "document_name">,
): UploadedDocument[] {
  const documents = Array.isArray(submission.documents)
    ? submission.documents.map(parseUploadedDocument).filter((document): document is UploadedDocument => Boolean(document))
    : [];

  if (documents.length > 0) return documents;

  if (submission.document_url && submission.document_name) {
    return [{ url: submission.document_url, path: null, name: submission.document_name, sizeBytes: null, contentType: null }];
  }

  return [];
}

export async function getSubmissionDocumentAccessUrl(document: UploadedDocument): Promise<string> {
  if (document.path) {
    const { data, error } = await supabase.storage
      .from("submission-documents")
      .createSignedUrl(document.path, 300);

    if (error || !data?.signedUrl) {
      throw error ?? new Error("Doküman için signed URL üretilemedi.");
    }

    return data.signedUrl;
  }

  if (document.url) {
    return document.url;
  }

  throw new Error("Doküman yolu bulunamadı.");
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  const digits = value >= 10 || exponent === 0 || Number.isInteger(value) ? 0 : 1;
  return `${value.toFixed(digits)} ${units[exponent]}`;
}

export function getSubmissionDocumentsBucketLevel(usageRatio: number): SubmissionDocumentsBucketLevel {
  if (usageRatio >= 0.95) return "critical";
  if (usageRatio >= 0.85) return "warning";
  if (usageRatio >= 0.7) return "info";
  return "normal";
}

export async function uploadSubmissionDocuments(files: File[]): Promise<UploadedDocument[]> {
  if (!files.length) return [];

  const uploadedDocs: UploadedDocument[] = [];

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const { error } = await supabase.storage
      .from("submission-documents")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) throw error;

    uploadedDocs.push({
      url: null,
      name: file.name,
      path,
      sizeBytes: file.size,
      contentType: file.type || null,
    });
  }

  return uploadedDocs;
}

export async function getSubmissionDocumentsBucketStats(): Promise<SubmissionDocumentsBucketStats> {
  const { data, error } = await supabase.rpc("get_submission_documents_bucket_stats");

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : null;
  if (!row) {
    return {
      bucketId: "submission-documents",
      fileCount: 0,
      totalBytes: 0,
      fileSizeLimit: 0,
      usageRatio: 0,
    };
  }

  return {
    bucketId: row.bucket_id ?? "submission-documents",
    fileCount: Number(row.file_count ?? 0),
    totalBytes: Number(row.total_bytes ?? 0),
    fileSizeLimit: Number(row.file_size_limit ?? 0),
    usageRatio: Number(row.usage_ratio ?? 0),
  };
}

export function toSubmissionInsert(
  values: Record<string, FormDataEntryValue>,
  mode: SubmissionFormMode,
  consentValue?: boolean,
): SubmissionInsert {
  const isSupport = mode === "support";
  const isBacker = mode === "backer";

  return {
    form_type: isBacker ? "backer" : isSupport ? "support" : "register",
    source_type: "form",
    category: isBacker ? "backer" : isSupport ? "support" : normalizeTurkishText(String(values.category ?? "")),
    fullname: normalizeTurkishText(String(values.fullname ?? "")),
    country: normalizeTurkishText(String(values.country ?? "")),
    city: normalizeTurkishText(String(values.city ?? "")),
    business: normalizeOptionalTurkishText(String(values.business ?? "")),
    company_name: isBacker ? normalizeOptionalTurkishText(String(values.company_name ?? "")) : null,
    field: isBacker
      ? (normalizeTurkishText(String(values.donor_type ?? "")) === "company" ? "Firma Bağışı" : "Bireysel Bağışçı")
      : normalizeTurkishText(String(values.field ?? "")),
    email: normalizeTurkishText(String(values.email ?? "")),
    phone: normalizeTurkishText(String(values.phone ?? "")),
    description: normalizeOptionalTurkishText(String(values.description ?? "")),
    offers_needs: normalizeOptionalTurkishText(String(values.offers_needs ?? "")),
    document_url: normalizeOptionalTurkishText(String(values.document_url ?? "")),
    document_name: normalizeOptionalTurkishText(String(values.document_name ?? "")),
    documents: Array.isArray(values.documents) ? (values.documents as unknown as SubmissionInsert["documents"]) : [],
    contest_interest: !isBacker && values.contest_interest === "yes",
    whatsapp_interest: isBacker ? values.whatsapp_interest === "yes" : values.whatsapp_interest === "yes",
    donation_amount: isBacker ? Number(values.donation_amount ?? 0) || null : null,
    donation_currency: isBacker ? "USD" : null,
    referral_source: normalizeOptionalTurkishText(String(values.referral_source ?? "")),
    referral_detail: normalizeOptionalTurkishText(String(values.referral_detail ?? "")),
    referral_code: normalizeOptionalTurkishText(String(values.referral_code ?? ""))?.toUpperCase() || null,
    referral_code_id: null,
    linkedin: normalizeOptionalTurkishText(String(values.linkedin ?? "")),
    instagram: normalizeOptionalTurkishText(String(values.instagram ?? "")),
    tiktok: normalizeOptionalTurkishText(String(values.tiktok ?? "")),
    facebook: normalizeOptionalTurkishText(String(values.facebook ?? "")),
    twitter: normalizeOptionalTurkishText(String(values.twitter ?? "")),
    website: normalizeOptionalTurkishText(String(values.website ?? "")),
    consent: consentValue ?? false,
    status: "new",
  };
}

export function getReferralValidationMessage(status: ReferralValidationStatus) {
  if (status === "not_found") return "Referral kodu bulunamadi.";
  if (status === "inactive") return "Referral kodu pasif durumda.";
  if (status === "expired") return "Referral kodunun suresi dolmus.";
  if (status === "out_of_window") return "Referral kodu bu tarihte kullanilamaz.";
  if (status === "missing") return "Referral kodu bos birakilamaz.";
  return "Referral kodu geçersiz.";
}

export async function validateReferralCodeBeforeSubmit(referralCode: string | null | undefined) {
  const normalized = normalizeOptionalTurkishText(referralCode ?? "")?.toUpperCase() ?? "";
  if (!normalized) return null;

  const { data, error } = await supabase.rpc("validate_and_bind_referral_code", {
    input_code: normalized,
    reference_time: new Date().toISOString(),
  });

  if (error) throw error;
  const result = data?.[0];
  const status = (result?.status ?? "not_found") as ReferralValidationStatus;
  if (status !== "valid") {
    throw new Error(getReferralValidationMessage(status));
  }

  return result?.normalized_code ?? normalized;
}

export function getReadableErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim() !== "") return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const maybeMessage = (error as ErrorWithMessage).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim() !== "") return maybeMessage;
  }
  return fallback;
}

function getMissingColumnName(error: unknown): string | null {
  const message =
    error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error && typeof (error as ErrorWithMessage).message === "string"
        ? (error as ErrorWithMessage).message ?? ""
        : "";

  const match = message.match(/column ["']?([a-zA-Z0-9_]+)["']? .* does not exist/i);
  return match?.[1] ?? null;
}

function isRowLevelSecurityError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const code = "code" in error && typeof (error as ErrorWithMessage).code === "string" ? (error as ErrorWithMessage).code : "";
  const message = "message" in error && typeof (error as ErrorWithMessage).message === "string" ? (error as ErrorWithMessage).message : "";

  return code === "42501" || /row-level security policy/i.test(message ?? "");
}

function isOnboardingDuplicateError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const code = "code" in error && typeof (error as ErrorWithMessage).code === "string" ? (error as ErrorWithMessage).code : "";
  const message = "message" in error && typeof (error as ErrorWithMessage).message === "string" ? (error as ErrorWithMessage).message : "";

  return code === "23505" && /onboarding_key/i.test(message ?? "");
}

export async function insertSubmissionWithCompatibility(payload: SubmissionInsert) {
  let currentPayload: Record<string, unknown> = { ...payload };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await supabase
      .from("submissions")
      .insert(currentPayload as SubmissionInsert)
      .select("id")
      .single();

    if (!error) return data;

    if (isOnboardingDuplicateError(error)) {
      return { id: null, duplicate: true };
    }

    const missingColumn = getMissingColumnName(error);
    if (missingColumn && missingColumn in currentPayload) {
      const { [missingColumn]: _removed, ...nextPayload } = currentPayload;
      currentPayload = nextPayload;
      continue;
    }

    // Public insert policy exists but public select policy does not. In that case,
    // `insert(...).select(...).single()` can fail even though raw insert is allowed.
    if (isRowLevelSecurityError(error)) {
      const { error: insertOnlyError } = await supabase.from("submissions").insert(currentPayload as SubmissionInsert);
      if (!insertOnlyError) return null;

      if (isOnboardingDuplicateError(insertOnlyError)) {
        return { id: null, duplicate: true };
      }

      const fallbackMissingColumn = getMissingColumnName(insertOnlyError);
      if (fallbackMissingColumn && fallbackMissingColumn in currentPayload) {
        const { [fallbackMissingColumn]: _removed, ...nextPayload } = currentPayload;
        currentPayload = nextPayload;
        continue;
      }

      throw insertOnlyError;
    }

    throw error;
  }

  throw new Error("Kayıt gönderimi sürüm uyumluluğu nedeniyle tamamlanamadı.");
}

// Revizyon İstekleri — API katmanı.
// /admin/revision-requests sayfasının veri katmanı: serbest revizyon talepleri
// (revision_requests) + talep başına çoklu yorum thread'i (revision_request_comments).
// RLS: yalnız admin okur/yazar; tüm adminler ortak durumu görür (mig 20260628100000).
//
// 27.09.2026: "types.ts henüz bu tabloları içermiyor" notu ölçümle çürüdü — üç
// tablo da tipliydi. Gevşek istemci şimi (`LooseQuery`) KALDIRILDI.
// ⚠️ Şim kaldırılınca `tsc` 3 gerçek bulgu verdi, üçü de YAZMA yükünde:
// `buildRequestPayload` dönüşü `Record<string, unknown>` olduğu için yük hiç
// denetlenmiyordu ve ek eklemede hesaplanmış anahtar (`[column]: value`) nesneyi
// indeks imzasına genişletiyordu. İkisi de olmayan bir sütuna yazmayı derleme
// zamanında gizler — canlıda `PGRST204` olarak çıkar (CLAUDE.md'nin belgelediği sınıf).
//
// Tablo başına DOĞRUDAN `supabase.from("...")` çağrılır; ortak bir
// `table(name: string)` yardımcısı KULLANILMAZ — birleşim tipi üç tablonun
// sütunlarını kesişime sokar ve var olan sütunları bile reddeder.
//
// created_by → e-posta gösterimi admin_get_user_email(uuid) RPC ile çözülür.

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { sanitizeError, validateContent, validateFile, validateTitle } from "@/lib/security";

type AttachmentInsert = Database["public"]["Tables"]["revision_request_attachments"]["Insert"];

/** Talep durumları — DB CHECK ile eşleşir. */
export const REVISION_STATUSES = ["acik", "inceleniyor", "yapildi", "iptal"] as const;
export type RevisionStatus = (typeof REVISION_STATUSES)[number];

/** Durum → görünür Türkçe etiket. */
export const REVISION_STATUS_LABELS: Record<RevisionStatus, string> = {
  acik: "Açık",
  inceleniyor: "İnceleniyor",
  yapildi: "Yapıldı",
  iptal: "İptal",
};

export const REVISION_PRIORITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export type RevisionRequest = {
  id: string;
  /**
   * Sıralı revizyon numarası (#REV-N). Veritabanındaki BEFORE INSERT tetikleyicisi
   * atar (mig 20260927190000) — istemci ASLA yazmaz. Numara atanmadan önce açılmış
   * satırlarda null olabileceği için gösterim tarafı bunu karşılamalıdır.
   */
  revisionNumber: number | null;
  title: string;
  detail: string;
  status: RevisionStatus;
  priority: number;
  areaLabel: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Revizyon numarasını "#REV-042" biçimine çevirir.
 *
 * ⚠️ AYNA: Aynı biçim mail şablonunda da var
 * (`supabase/functions/_shared/emails/revision-request-completed.ts`).
 * Edge Function deploy'u yalnız `supabase/functions/` klasörünü yüklediği için
 * oradan `src/` içine import EDİLEMEZ; bu yüzden biçim iki yerde tekrarlanır
 * (STATUS_LABELS ile aynı gerekçe). Birini değiştirirsen diğerini de değiştir —
 * `revision-requests.test.ts` ikisini birlikte kilitler.
 *
 * Numara yoksa BOŞ döner; çağıran taraf rozeti hiç çizmemelidir.
 */
export function formatRevisionNumber(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "";
  return `#REV-${String(Math.trunc(value)).padStart(3, "0")}`;
}

export type RevisionComment = {
  id: string;
  requestId: string;
  body: string;
  createdBy: string | null;
  createdAt: string;
};

export type RevisionRequestForm = {
  title: string;
  detail: string;
  status: RevisionStatus;
  priority: number;
  areaLabel: string;
};

type RequestRow = {
  id: string;
  revision_number: number | null;
  title: string;
  detail: string;
  status: RevisionStatus;
  priority: number;
  area_label: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type CommentRow = {
  id: string;
  request_id: string;
  body: string;
  created_by: string | null;
  created_at: string;
};

const REQUEST_SELECT =
  "id,revision_number,title,detail,status,priority,area_label,created_by,created_at,updated_at";
const COMMENT_SELECT = "id,request_id,body,created_by,created_at";

// types.ts bu tabloları tanımadığı için tüm sorgular tek bir gevşek istemci
// arayüzünden geçer (social-share-log.ts deseni).

function mapRequest(row: RequestRow): RevisionRequest {
  return {
    id: row.id,
    revisionNumber: typeof row.revision_number === "number" ? row.revision_number : null,
    title: row.title,
    detail: row.detail,
    status: row.status,
    priority: row.priority,
    areaLabel: row.area_label,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapComment(row: CommentRow): RevisionComment {
  return {
    id: row.id,
    requestId: row.request_id,
    body: row.body,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function getRevisionStatusLabel(status: string): string {
  return REVISION_STATUS_LABELS[status as RevisionStatus] ?? status;
}

/** Talep formunu doğrular; geçerliyse null, değilse Türkçe hata mesajı döner. */
export function validateRevisionRequestForm(form: RevisionRequestForm): string | null {
  const title = form.title.trim();
  if (!title) {
    return "Başlık boş bırakılamaz.";
  }

  const titleError = validateTitle(title);
  if (titleError) return titleError;

  const detailError = validateContent(form.detail);
  if (detailError) return detailError;

  if (!REVISION_STATUSES.includes(form.status)) {
    return "Geçersiz durum.";
  }

  if (
    !Number.isInteger(form.priority) ||
    form.priority < REVISION_PRIORITY_OPTIONS[0] ||
    form.priority > REVISION_PRIORITY_OPTIONS[REVISION_PRIORITY_OPTIONS.length - 1]
  ) {
    return "Geçersiz öncelik değeri.";
  }

  return null;
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// Dönüş tipi BİLEREK açıklanmıyor: `Record<string, unknown>` derleyicinin
// insert/update yükünü tabloya karşı denetlemesini engelliyordu. Çıkarım
// bırakıldığında olmayan bir sütuna yazmak derleme zamanında yakalanır
// (CLAUDE.md: cast yerine `satisfies`; PGRST204 sınıfı).
function buildRequestPayload(form: RevisionRequestForm) {
  return {
    title: form.title.trim().slice(0, 200),
    detail: form.detail.trim(),
    status: form.status,
    priority: form.priority,
    area_label: form.areaLabel.trim(),
  };
}

/** Aktif (silinmemiş) talepleri öncelik + tarih sırasıyla getirir. */
export async function fetchRevisionRequests(): Promise<RevisionRequest[]> {
  const { data, error } = await supabase.from("revision_requests")
    .select(REQUEST_SELECT)
    .is("deleted_at", null)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(sanitizeError(error, "Revizyon istekleri yüklenemedi."));
  }

  return ((data as RequestRow[]) ?? []).map(mapRequest);
}

/** Bir talebin aktif yorumlarını eskiden yeniye getirir. */
export async function fetchComments(requestId: string): Promise<RevisionComment[]> {
  const { data, error } = await supabase.from("revision_request_comments")
    .select(COMMENT_SELECT)
    .eq("request_id", requestId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(sanitizeError(error, "Yorumlar yüklenemedi."));
  }

  return ((data as CommentRow[]) ?? []).map(mapComment);
}

/** Yeni revizyon talebi oluşturur (created_by = aktif admin). */
export async function createRevisionRequest(
  form: RevisionRequestForm,
): Promise<RevisionRequest> {
  const validationError = validateRevisionRequestForm(form);
  if (validationError) {
    throw new Error(validationError);
  }

  const createdBy = await currentUserId();
  const { data, error } = await supabase.from("revision_requests")
    .insert({ ...buildRequestPayload(form), created_by: createdBy })
    .select(REQUEST_SELECT)
    .single();

  if (error || !data) {
    throw new Error(sanitizeError(error, "Revizyon isteği oluşturulamadı."));
  }

  return mapRequest(data as RequestRow);
}

/** Var olan bir talebi günceller (updated_at trigger ile otomatik). */
export async function updateRevisionRequest(
  id: string,
  form: RevisionRequestForm,
): Promise<RevisionRequest> {
  const validationError = validateRevisionRequestForm(form);
  if (validationError) {
    throw new Error(validationError);
  }

  const { data, error } = await supabase.from("revision_requests")
    .update(buildRequestPayload(form))
    .eq("id", id)
    .select(REQUEST_SELECT)
    .single();

  if (error || !data) {
    throw new Error(sanitizeError(error, "Revizyon isteği güncellenemedi."));
  }

  return mapRequest(data as RequestRow);
}

/** Talebi soft-delete eder (deleted_at set). Cascade ile yorumlar da gizlenir. */
export async function deleteRevisionRequest(id: string): Promise<void> {
  const { error } = await supabase.from("revision_requests")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(sanitizeError(error, "Revizyon isteği silinemedi."));
  }
}

/** Bir talebe yorum ekler (created_by = aktif admin). */
export async function addComment(requestId: string, body: string): Promise<RevisionComment> {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Yorum boş bırakılamaz.");
  }

  const contentError = validateContent(trimmed);
  if (contentError) {
    throw new Error(contentError);
  }

  const createdBy = await currentUserId();
  const { data, error } = await supabase.from("revision_request_comments")
    .insert({ request_id: requestId, body: trimmed, created_by: createdBy })
    .select(COMMENT_SELECT)
    .single();

  if (error || !data) {
    throw new Error(sanitizeError(error, "Yorum eklenemedi."));
  }

  return mapComment(data as CommentRow);
}

/** Yorumu soft-delete eder. */
export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from("revision_request_comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(sanitizeError(error, "Yorum silinemedi."));
  }
}

/**
 * Tekilleştirilmiş created_by id'lerini e-postaya çözer (UI yazar gösterimi).
 * admin_get_user_email moderator-gate'li SECURITY DEFINER RPC; her id ayrı çağrı.
 */
export async function fetchUserEmails(ids: (string | null)[]): Promise<Record<string, string>> {
  const uniqueIds = Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
  if (uniqueIds.length === 0) {
    return {};
  }

  const entries = await Promise.all(
    uniqueIds.map(async (id) => {
      const { data, error } = await supabase.rpc("admin_get_user_email" as never, {
        p_user_id: id,
      } as never);
      if (error || !data) {
        return [id, ""] as const;
      }
      return [id, data as unknown as string] as const;
    }),
  );

  const result: Record<string, string> = {};
  for (const [id, email] of entries) {
    if (email) {
      result[id] = email;
    }
  }
  return result;
}

export type RevisionAttachment = {
  id: string;
  requestId: string | null;
  commentId: string | null;
  storagePath: string;
  fileName: string;
  contentType: string | null;
  sizeBytes: number | null;
  createdBy: string | null;
  createdAt: string;
};

export type AttachmentParent = { requestId: string } | { commentId: string };

type AttachmentRow = {
  id: string;
  request_id: string | null;
  comment_id: string | null;
  storage_path: string;
  file_name: string;
  content_type: string | null;
  size_bytes: number | null;
  created_by: string | null;
  created_at: string;
};

const ATTACHMENT_SELECT =
  "id,request_id,comment_id,storage_path,file_name,content_type,size_bytes,created_by,created_at";
const ATTACHMENTS_BUCKET = "revision-attachments";

function mapAttachment(row: AttachmentRow): RevisionAttachment {
  return {
    id: row.id,
    requestId: row.request_id,
    commentId: row.comment_id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function attachmentParentColumn(parent: AttachmentParent): { column: "request_id" | "comment_id"; value: string } {
  return "requestId" in parent
    ? { column: "request_id", value: parent.requestId }
    : { column: "comment_id", value: parent.commentId };
}

function attachmentPathPrefix(parent: AttachmentParent): string {
  return "requestId" in parent ? `request/${parent.requestId}` : `comment/${parent.commentId}`;
}

function buildAttachmentPath(parent: AttachmentParent, file: File): string {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const rand = Math.random().toString(36).slice(2, 8);
  return `${attachmentPathPrefix(parent)}/${Date.now()}-${rand}-${safeName}`;
}

/** Bir talebin ya da yorumun aktif (silinmemiş) eklerini eskiden yeniye getirir. */
export async function fetchAttachments(parent: AttachmentParent): Promise<RevisionAttachment[]> {
  const { column, value } = attachmentParentColumn(parent);
  const { data, error } = await supabase.from("revision_request_attachments")
    .select(ATTACHMENT_SELECT)
    .eq(column, value)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(sanitizeError(error, "Ekler yüklenemedi."));
  }

  return ((data as AttachmentRow[]) ?? []).map(mapAttachment);
}

/** Bir dosyayı revision-attachments bucket'ına yükler ve satır ekler (created_by = aktif admin). */
export async function uploadAttachment(
  parent: AttachmentParent,
  file: File,
): Promise<RevisionAttachment> {
  const fileError = validateFile(file, {
    allowedExtensions: new Set(["png", "jpg", "jpeg", "gif", "webp"]),
    maxSize: 15 * 1024 * 1024,
  });
  if (fileError) {
    throw new Error(fileError);
  }

  const path = buildAttachmentPath(parent, file);
  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (uploadError) {
    throw new Error(sanitizeError(uploadError, "Görsel yüklenemedi."));
  }

  const createdBy = await currentUserId();
  const { column, value } = attachmentParentColumn(parent);
  const base = {
    storage_path: path,
    file_name: file.name,
    content_type: file.type || null,
    size_bytes: file.size,
    created_by: createdBy,
  };
  // Hesaplanmış anahtar (`[column]: value`) nesneyi indeks imzasına genişletiyor
  // ve tipli istemcinin yükü tabloya karşı denetlemesini engelliyor. İki açık dal
  // aynı yükü üretir — gönderilen alanlar birebir aynı — ama denetlenebilir.
  // Tip açıklaması ŞART: iki dalın birleşimi doğrudan `.insert()`'e verilemiyor
  // (`RejectExcessProperties` birleşime dağılmıyor). `satisfies` değil `:` —
  // amaç birleşimi tek şekle indirmek; fazla sütun yine derlemede yakalanır.
  const row: AttachmentInsert =
    column === "request_id"
      ? { ...base, request_id: value }
      : { ...base, comment_id: value };
  const { data, error } = await supabase.from("revision_request_attachments")
    .insert(row)
    .select(ATTACHMENT_SELECT)
    .single();

  if (error || !data) {
    throw new Error(sanitizeError(error, "Görsel yüklenemedi."));
  }

  return mapAttachment(data as AttachmentRow);
}

/** Eki storage'dan siler ve satırı soft-delete eder. */
export async function deleteAttachment(id: string, storagePath: string): Promise<void> {
  const { error: removeError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .remove([storagePath]);
  if (removeError) {
    throw new Error(sanitizeError(removeError, "Ek silinemedi."));
  }

  const { error } = await supabase.from("revision_request_attachments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(sanitizeError(error, "Ek silinemedi."));
  }
}

/** Bir ekin görüntülenmesi için kısa ömürlü signed URL üretir. */
export async function getAttachmentUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, 300);
  if (error || !data?.signedUrl) {
    throw new Error(sanitizeError(error, "Görsel için erişim linki üretilemedi."));
  }
  return data.signedUrl;
}



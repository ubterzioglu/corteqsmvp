// Revizyon İstekleri — API katmanı.
// /admin/revision-requests sayfasının veri katmanı: serbest revizyon talepleri
// (revision_requests) + talep başına çoklu yorum thread'i (revision_request_comments).
// RLS: yalnız admin okur/yazar; tüm adminler ortak durumu görür (mig 20260628100000).
//
// types.ts henüz bu tabloları içermiyor → supabase çağrılarında dar `as any` cast
// kullanılır (CLAUDE.md B1; social-share-log.ts ile aynı yaklaşım).
// created_by → e-posta gösterimi admin_get_user_email(uuid) RPC ile çözülür.

import { supabase } from "@/integrations/supabase/client";
import { sanitizeError, validateContent, validateTitle } from "@/lib/security";

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
  title: string;
  detail: string;
  status: RevisionStatus;
  priority: number;
  areaLabel: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

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
  "id,title,detail,status,priority,area_label,created_by,created_at,updated_at";
const COMMENT_SELECT = "id,request_id,body,created_by,created_at";

// types.ts bu tabloları tanımadığı için tüm sorgular tek bir gevşek istemci
// arayüzünden geçer (social-share-log.ts deseni).
type LooseQuery = {
  select: (cols: string) => LooseQuery;
  insert: (values: Record<string, unknown>) => LooseQuery;
  update: (values: Record<string, unknown>) => LooseQuery;
  eq: (column: string, value: unknown) => LooseQuery;
  is: (column: string, value: unknown) => LooseQuery;
  order: (column: string, options: { ascending: boolean }) => LooseQuery;
  single: () => Promise<{ data: unknown; error: unknown }>;
  then: Promise<{ data: unknown; error: unknown }>["then"];
};

const table = (name: string): LooseQuery =>
  (supabase as unknown as { from: (t: string) => LooseQuery }).from(name);

function mapRequest(row: RequestRow): RevisionRequest {
  return {
    id: row.id,
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

function buildRequestPayload(form: RevisionRequestForm): Record<string, unknown> {
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
  const { data, error } = await table("revision_requests")
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
  const { data, error } = await table("revision_request_comments")
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
  const { data, error } = await table("revision_requests")
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

  const { data, error } = await table("revision_requests")
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
  const { error } = await table("revision_requests")
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
  const { data, error } = await table("revision_request_comments")
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
  const { error } = await table("revision_request_comments")
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

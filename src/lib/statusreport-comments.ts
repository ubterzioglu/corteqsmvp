// /statusreport3006 — bölüm bazlı public yorum API katmanı.
//
// Sayfa public (giriş yok); herkes isim girerek yorum yazar. Okuma herkese açık
// (RLS public read), yazma yalnız security-definer RPC üzerinden
// (add_statusreport_comment_v1 — isim/gövde sanitize + rate-limit). Mig 20260701100000.
//
// types.ts bu tabloyu/RPC'yi tanımıyor → revision-requests.ts / social-share-log.ts
// deseni: dar `as any` cast + gevşek istemci arayüzü.

import { supabase } from "@/integrations/supabase/client";
import { sanitizeError } from "@/lib/security";

export type StatusReportComment = {
  id: string;
  sectionKey: string;
  authorName: string;
  body: string;
  createdAt: string;
};

type CommentRow = {
  id: string;
  section_key: string;
  author_name: string;
  body: string;
  created_at: string;
};

const COMMENT_SELECT = "id,section_key,author_name,body,created_at";

export const MAX_COMMENT_LENGTH = 4000;
export const MAX_AUTHOR_LENGTH = 80;

// types.ts bu tabloyu tanımadığı için sorgular tek bir gevşek istemciden geçer.
type LooseQuery = {
  select: (cols: string) => LooseQuery;
  eq: (column: string, value: unknown) => LooseQuery;
  is: (column: string, value: unknown) => LooseQuery;
  order: (column: string, options: { ascending: boolean }) => LooseQuery;
  then: Promise<{ data: unknown; error: unknown }>["then"];
};

const table = (name: string): LooseQuery =>
  (supabase as unknown as { from: (t: string) => LooseQuery }).from(name);

function mapComment(row: CommentRow): StatusReportComment {
  return {
    id: row.id,
    sectionKey: row.section_key,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

/**
 * Tüm bölümlerin yorumlarını tek seferde getirir (eskiden yeniye), bölüm
 * anahtarına göre gruplar. Sayfa açılışında bir kez çağrılır.
 */
export async function fetchAllComments(): Promise<Record<string, StatusReportComment[]>> {
  const { data, error } = await table("statusreport_comments")
    .select(COMMENT_SELECT)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(sanitizeError(error, "Yorumlar yüklenemedi."));
  }

  const grouped: Record<string, StatusReportComment[]> = {};
  for (const row of (data as CommentRow[]) ?? []) {
    const comment = mapComment(row);
    (grouped[comment.sectionKey] ??= []).push(comment);
  }
  return grouped;
}

/**
 * Bir bölüme yorum ekler. Anonim erişime açık security-definer RPC çağırır;
 * isim boşsa sunucu 'Anonim' yapar, sanitize + rate-limit sunucuda uygulanır.
 */
export async function addComment(
  sectionKey: string,
  authorName: string,
  body: string,
): Promise<StatusReportComment> {
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    throw new Error("Yorum boş bırakılamaz.");
  }
  if (trimmedBody.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Yorum çok uzun (en fazla ${MAX_COMMENT_LENGTH} karakter).`);
  }

  const { data, error } = await supabase.rpc("add_statusreport_comment_v1" as never, {
    p_section_key: sectionKey,
    p_author_name: authorName.trim().slice(0, MAX_AUTHOR_LENGTH),
    p_body: trimmedBody,
  } as never);

  if (error || !data) {
    throw new Error(sanitizeError(error, "Yorum eklenemedi."));
  }

  return mapComment(data as unknown as CommentRow);
}

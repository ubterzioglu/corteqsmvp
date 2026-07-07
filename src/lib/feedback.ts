// Üye Geri Bildirimleri — API katmanı.
// Üye tarafı: /feedback formundan submitFeedback (INSERT). Admin tarafı: /admin/feedback
// listesi (fetchFeedbackList) + durum güncelleme + soft-delete.
// RLS: INSERT authenticated (auth.uid() = created_by); SELECT/UPDATE admin-only
// (mig 20260707100000_member_feedback.sql).
//
// types.ts henüz bu tabloyu içermiyor → supabase çağrılarında dar cast kullanılır
// (revision-requests.ts LooseQuery deseni; CLAUDE.md B1).
//
// DİKKAT: submitFeedback insert'e .select() ZİNCİRLEMEZ — üyenin SELECT policy'si yok,
// returning istenirse RLS'e takılır. Insert `return=minimal` olarak kalmalı.

import { supabase } from "@/integrations/supabase/client";
import { sanitizeError, validateContent } from "@/lib/security";

/** Feedback durumları — DB CHECK ile eşleşir. */
export const FEEDBACK_STATUSES = ["yeni", "okundu", "arsiv"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

/** Durum → görünür Türkçe etiket. */
export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  yeni: "Yeni",
  okundu: "Okundu",
  arsiv: "Arşiv",
};

export type MemberFeedback = {
  id: string;
  body: string;
  pagePath: string;
  status: FeedbackStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type FeedbackRow = {
  id: string;
  body: string;
  page_path: string;
  status: FeedbackStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const FEEDBACK_SELECT = "id,body,page_path,status,created_by,created_at,updated_at";

// types.ts bu tabloyu tanımadığı için tüm sorgular tek bir gevşek istemci
// arayüzünden geçer (revision-requests.ts deseni).
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

function mapFeedback(row: FeedbackRow): MemberFeedback {
  return {
    id: row.id,
    body: row.body,
    pagePath: row.page_path,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getFeedbackStatusLabel(status: string): string {
  return FEEDBACK_STATUS_LABELS[status as FeedbackStatus] ?? status;
}

/** Feedback gövdesini doğrular; geçerliyse null, değilse Türkçe hata mesajı döner. */
export function validateFeedbackBody(body: string): string | null {
  const trimmed = body.trim();
  if (!trimmed) {
    return "Yorum boş bırakılamaz.";
  }
  return validateContent(trimmed);
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Üye feedback'i gönderir (created_by = aktif üye; RLS gereği oturum zorunlu). */
export async function submitFeedback(body: string, pagePath: string): Promise<void> {
  const validationError = validateFeedbackBody(body);
  if (validationError) {
    throw new Error(validationError);
  }

  const createdBy = await currentUserId();
  if (!createdBy) {
    throw new Error("Feedback göndermek için giriş yapmalısınız.");
  }

  const { error } = await table("member_feedback").insert({
    body: body.trim(),
    page_path: pagePath.trim().slice(0, 300),
    created_by: createdBy,
  });

  if (error) {
    throw new Error(sanitizeError(error, "Feedback gönderilemedi."));
  }
}

/** Aktif (silinmemiş) feedback'leri yeniden eskiye getirir (admin). */
export async function fetchFeedbackList(): Promise<MemberFeedback[]> {
  const { data, error } = await table("member_feedback")
    .select(FEEDBACK_SELECT)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(sanitizeError(error, "Geri bildirimler yüklenemedi."));
  }

  return ((data as FeedbackRow[]) ?? []).map(mapFeedback);
}

/** Feedback durumunu günceller (admin; updated_at trigger ile otomatik). */
export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
): Promise<void> {
  if (!FEEDBACK_STATUSES.includes(status)) {
    throw new Error("Geçersiz durum.");
  }

  const { error } = await table("member_feedback").update({ status }).eq("id", id);

  if (error) {
    throw new Error(sanitizeError(error, "Durum güncellenemedi."));
  }
}

/** Feedback'i soft-delete eder (admin). */
export async function deleteFeedback(id: string): Promise<void> {
  const { error } = await table("member_feedback")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(sanitizeError(error, "Geri bildirim silinemedi."));
  }
}

// Üye Geri Bildirimleri — API katmanı.
// Üye tarafı: /feedback formundan submitFeedback (INSERT). Admin tarafı: /admin/feedback
// listesi (fetchFeedbackList) + durum güncelleme + soft-delete.
// RLS: INSERT authenticated (auth.uid() = created_by); SELECT/UPDATE admin-only
// (mig 20260707100000_member_feedback.sql).
// L10a (mig 20261108120000): üye kendi geçmişini `list_my_feedback_v1` RPC'siyle okur
// (tabloya üye SELECT policy'si EKLENMEDİ); admin "REV'e taşı" için
// `admin_promote_feedback_to_revision_v1`.
//
// 27.09.2026: gevşek istemci şimi (`LooseQuery` + `table(name)`) KALDIRILDI. Eski
// not ("types.ts henüz bu tabloyu içermiyor") ölçümle çürüdü — `member_feedback`
// tipli. Tipli istemciye geçişte `tsc` 0 hata verdi.
//
// DİKKAT: submitFeedback insert'e .select() ZİNCİRLEMEZ — üyenin SELECT policy'si yok,
// returning istenirse RLS'e takılır. Insert `return=minimal` olarak kalmalı.

import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/lib/auth-api";
import { extractRpcErrorText } from "@/lib/rpc-error-text";
import { sanitizeError, validateContent } from "@/lib/security";
import { fetchAllRows } from "./supabase-chunked";

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
  /** Taşındığı revision_requests.id; null = henüz REV'e taşınmadı. */
  promotedRevisionId: string | null;
};

/** Üyenin kendi geçmişi (`list_my_feedback_v1`) — admin alanlarını taşımaz. */
export type MyFeedback = {
  id: string;
  body: string;
  pagePath: string;
  status: FeedbackStatus;
  createdAt: string;
};

export type PromotedRevision = {
  revisionId: string;
  revisionNumber: number | null;
};

type FeedbackRow = {
  id: string;
  body: string;
  page_path: string;
  status: FeedbackStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  promoted_revision_id: string | null;
};

const LEGACY_FEEDBACK_SELECT = "id,body,page_path,status,created_by,created_at,updated_at";
const FEEDBACK_SELECT = `${LEGACY_FEEDBACK_SELECT},promoted_revision_id` as const;

/** RPC hata kodu → Türkçe mesaj. Yeni `feedback_` kodu SQL'e eklenince buraya da eklenir (çift yönlü test kilitler). */
export const FEEDBACK_ERROR_MESSAGES: Record<string, string> = {
  feedback_admin_required: "Bu işlem için yönetici yetkisi gerekiyor.",
  feedback_id_required: "Geri bildirim kimliği eksik.",
  feedback_not_found: "Geri bildirim bulunamadı ya da silinmiş.",
  feedback_already_promoted: "Bu geri bildirim zaten bir REV'e taşındı.",
};

/**
 * ⚠️ Supabase RPC hataları **düz nesnedir, `Error` örneği DEĞİLDİR** — `instanceof Error`
 * ile daraltmak haritayı ölü bırakır (`rpc-error-text.ts`). Bilinmeyen hatada ham sunucu
 * metni değil `fallback` döner.
 */
export function feedbackErrorMessage(error: unknown, fallback: string): string {
  // İlk eşleşme bilinmeyen bir `feedback_*` olabilir; bilinen ilk kodu ara.
  const known = (extractRpcErrorText(error).match(/feedback_[a-z0-9_]+/g) ?? []).find(
    (code) => code in FEEDBACK_ERROR_MESSAGES,
  );
  return known ? FEEDBACK_ERROR_MESSAGES[known] : fallback;
}

// types.ts bu tabloyu tanımadığı için tüm sorgular tek bir gevşek istemci
// arayüzünden geçer (revision-requests.ts deseni).

function mapFeedback(row: FeedbackRow): MemberFeedback {
  return {
    id: row.id,
    body: row.body,
    pagePath: row.page_path,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    promotedRevisionId: row.promoted_revision_id ?? null,
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

/** Üye feedback'i gönderir (created_by = aktif üye; RLS gereği oturum zorunlu). */
export async function submitFeedback(body: string, pagePath: string): Promise<void> {
  const validationError = validateFeedbackBody(body);
  if (validationError) {
    throw new Error(validationError);
  }

  const createdBy = await getCurrentUserId();
  if (!createdBy) {
    throw new Error("Feedback göndermek için giriş yapmalısınız.");
  }

  const { error } = await supabase.from("member_feedback").insert({
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
  // ⚠️ TAM liste (S07c): eksik gösterilen geri bildirim okunmadan kapanır.
  const readAll = (select: typeof FEEDBACK_SELECT | typeof LEGACY_FEEDBACK_SELECT) =>
    fetchAllRows((from, to) =>
      supabase
        .from("member_feedback")
        .select(select)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(from, to),
    );

  let data: unknown[] | null = null;
  let error: unknown = null;
  try {
    try {
      data = await readAll(FEEDBACK_SELECT);
    } catch (caught: unknown) {
      // 42703 = undefined_column: 20261108120000 migration'ı henüz uygulanmadıysa
      // `promoted_revision_id` yoktur; liste yine açılsın (terfi bilgisi olmadan).
      if ((caught as { code?: string } | null)?.code !== "42703") throw caught;
      data = await readAll(LEGACY_FEEDBACK_SELECT);
    }
  } catch (caught: unknown) {
    error = caught;
  }

  if (error) {
    throw new Error(sanitizeError(error, "Geri bildirimler yüklenemedi."));
  }

  return ((data as FeedbackRow[]) ?? []).map(mapFeedback);
}

/** Feedback durumunu günceller (admin; updated_at trigger ile otomatik). */
export async function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
  if (!FEEDBACK_STATUSES.includes(status)) {
    throw new Error("Geçersiz durum.");
  }

  const { error } = await supabase.from("member_feedback").update({ status }).eq("id", id);

  if (error) {
    throw new Error(sanitizeError(error, "Durum güncellenemedi."));
  }
}

/** Feedback'i soft-delete eder (admin). */
export async function deleteFeedback(id: string): Promise<void> {
  const { error } = await supabase
    .from("member_feedback")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(sanitizeError(error, "Geri bildirim silinemedi."));
  }
}

/** Üyenin KENDİ geri bildirimleri (en yeni önce, en çok 50) — `list_my_feedback_v1`. */
export async function fetchMyFeedback(): Promise<MyFeedback[]> {
  const { data, error } = await supabase.rpc("list_my_feedback_v1");

  if (error) {
    throw new Error(feedbackErrorMessage(error, "Geri bildirimleriniz yüklenemedi."));
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    body: row.body,
    pagePath: row.page_path,
    status: row.status as FeedbackStatus,
    createdAt: row.created_at,
  }));
}

/** Admin: geri bildirimi revizyon isteğine (#REV-N) taşır; ikinci terfi reddedilir. */
export async function promoteFeedbackToRevision(feedbackId: string): Promise<PromotedRevision> {
  if (!feedbackId) {
    throw new Error(FEEDBACK_ERROR_MESSAGES.feedback_id_required);
  }

  const { data, error } = await supabase.rpc("admin_promote_feedback_to_revision_v1", {
    p_feedback_id: feedbackId,
  });

  if (error) {
    throw new Error(feedbackErrorMessage(error, "Geri bildirim REV'e taşınamadı."));
  }

  const result = data as unknown as { revision_id?: string; revision_number?: number | null } | null;
  if (!result?.revision_id) {
    throw new Error("Geri bildirim REV'e taşınamadı.");
  }

  return { revisionId: result.revision_id, revisionNumber: result.revision_number ?? null };
}

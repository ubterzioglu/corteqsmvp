// G07 · Kurumsal doğrulama — ADMIN inceleme veri katmanı.
//
// G06b üye tarafını (talep gönderme) yaptı; bu dosya yönetici tarafı: kuyruk
// listeleme + onayla/reddet (sebep) + belge önizleme (imzalı bağlantı).
//
// 🔴 RPC'ler admin-only (`is_admin(auth.uid())` guard, migration 20261003130000).
// ⚠️ types.ts regen BORCU (G12): `admin_list_org_verifications` /
// `review_org_verification_v1` üretilmiş tiplerde YOK — `as never` bilinçli.
// ⚠️ RPC hataları DÜZ NESNE — tip daraltması (instanceof) YASAK (KR03);
// `extractRpcErrorText` tek kaynak.
// 🔴 Belge önizleme YALNIZ createSignedUrl (G06b `openOrgVerificationDocument`);
// herkese açık URL üreten yardımcı YASAK (kova PRIVATE).
import { supabase } from "@/integrations/supabase/client";
import { openOrgVerificationDocument } from "@/lib/org-verification-api";
import { extractRpcErrorText } from "@/lib/rpc-error-text";

/** `admin_list_org_verifications` satırı (inceleme kuyruğu). */
export interface OrgVerificationQueueRow {
  claim_id: string;
  item_id: string;
  item_title: string;
  item_slug: string;
  requested_by_user_id: string;
  requester_name: string;
  note: string | null;
  doc_paths: string[];
  status: string;
  review_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
}

/**
 * İnceleme kuyruğu. `status` verilmezse RPC 'pending' döner (migration default).
 * Admin değilse RPC `org_verification_review_auth_required` fırlatır (düz nesne).
 */
export async function fetchOrgVerificationQueue(
  status: string = "pending",
): Promise<OrgVerificationQueueRow[]> {
  const { data, error } = await supabase.rpc(
    "admin_list_org_verifications" as never,
    { p_status: status } as never,
  );
  if (error) throw new Error(orgVerificationReviewErrorMessage(error));
  return (data ?? []) as OrgVerificationQueueRow[];
}

/**
 * Talebi incele: `approve=true` → verification_status='verified' + claim approved;
 * `approve=false` → claim rejected + reason (ZORUNLU, migration reason_required).
 */
export async function reviewOrgVerification(
  claimId: string,
  approve: boolean,
  reason?: string | null,
): Promise<void> {
  const { error } = await supabase.rpc("review_org_verification_v1" as never, {
    p_claim_id: claimId,
    p_approve: approve,
    p_reason: reason?.trim() ? reason.trim() : null,
  } as never);
  if (error) throw new Error(orgVerificationReviewErrorMessage(error));
}

/**
 * Belge önizleme — G06b `openOrgVerificationDocument` (createSignedUrl, PRIVATE
 * kova). Admin `read_own_or_admin` politikası sayesinde imzalı bağlantı alabilir.
 */
export { openOrgVerificationDocument as openOrgVerificationDocumentUrl };

/**
 * RPC hata kodu → Türkçe mesaj (migration 20261003130000'deki 5 `raise exception`).
 * Sözleşme testi ÇİFT YÖNLÜ kilitler (SQL↔TS).
 */
export const ORG_VERIFICATION_REVIEW_ERROR_MESSAGES: Record<string, string> = {
  org_verification_review_auth_required: "Bu işlem için yönetici yetkisi gerekiyor.",
  org_verification_review_claim_not_found: "Doğrulama talebi bulunamadı.",
  org_verification_review_not_verification: "Bu talep bir kurumsal doğrulama talebi değil.",
  org_verification_review_already_reviewed:
    "Bu talep zaten incelenmiş — yalnız bekleyen talepler incelenebilir.",
  org_verification_review_reason_required: "Ret için bir sebep yazmalısın (talep sahibi görsün).",
};

const ORG_VERIFICATION_REVIEW_GENERIC_ERROR =
  "İnceleme işlemi yapılamadı. Lütfen tekrar deneyin.";

/**
 * ⚠️ Supabase RPC hataları **düz nesnedir, `Error` örneği DEĞİLDİR** — tip
 * daraltması (instanceof) bu haritayı ölü bırakır, kullanıcı `[object Object]` görür.
 */
export function orgVerificationReviewErrorMessage(error: unknown): string {
  const raw = extractRpcErrorText(error);
  const match = raw.match(/org_verification_review_[a-z0-9_]+/);
  if (match && ORG_VERIFICATION_REVIEW_ERROR_MESSAGES[match[0]]) {
    return ORG_VERIFICATION_REVIEW_ERROR_MESSAGES[match[0]];
  }
  return ORG_VERIFICATION_REVIEW_GENERIC_ERROR;
}

// G20 · Sahiplik doğrulama istemcisi (tasarım §3.B) — G13 backend'inin UI yolu.
//
// Akış: "Bu grup sizin mi?" → kod talebi (`group_claim_start_code`, CQ+4 hane,
// TTL ayarlardan) → kullanıcı kodu grup adının SONUNA ekler → "Kontrol et"
// `group-claim-verify` edge'ini çağırır (okuma SUNUCUDA, G08 kural 1) → sonuç:
// verified · not_found (deneme sayaçlı) · exhausted · expired · invalid_link ·
// unknown (son ikisi deneme SAYMAZ, kural 5). Yedek yol: ekran görüntüsü →
// private kova (kendi klasörü) → `group_claim_submit_screenshot` → moderatör
// kuyruğu (claim_pending).
//
// ⚠️ types.ts regen BORCU (G12): `group_claims` üretilmiş tiplerde YOK —
// `as never` deseni bilinçli (emsal: brainstorming-api.ts:347, group-submit.ts).
// ⚠️ RPC hataları DÜZ NESNE — `instanceof Error` daraltması YASAK (KR03).
import { supabase } from "@/integrations/supabase/client";

export type ClaimMethod = "code" | "screenshot";

export interface PendingClaimRow {
  id: string;
  method: ClaimMethod;
  status: string;
  code: string | null;
  code_expires_at: string | null;
  attempt_count: number | null;
}

/** G13 migration'ındaki raise kodları → Türkçe kullanıcı mesajı (çift yönlü kilit testte). */
export const GROUP_CLAIM_ERROR_MESSAGES: Record<string, string> = {
  group_claim_auth_required: "Sahiplik talebi için giriş yapmalısın.",
  group_not_found: "Grup bulunamadı.",
  group_already_verified:
    "Bu grubun sahipliği zaten doğrulanmış. Devir talebi için ekran görüntüsü yolunu kullan; karar moderatörün.",
  group_claim_rate_limited: "Günlük sahiplik talebi sınırına ulaştın. Yarın tekrar dene.",
  group_claim_already_pending: "Bu grup için bekleyen bir talebin zaten var.",
  group_claim_path_forbidden: "Ekran görüntüsü kendi klasörüne yüklenmeli.",
  group_claim_not_found: "Talep bulunamadı.",
  group_claim_not_verifiable: "Bu talep kodla doğrulanamaz.",
  group_claim_invalid_read_result: "Doğrulama sonucu geçersiz.",
};

const mapClaimError = (error: { message?: string } | null, fallback: string) =>
  new Error(GROUP_CLAIM_ERROR_MESSAGES[error?.message ?? ""] ?? fallback);

/** Çağıranın bu gruptaki bekleyen talebi (RLS kendi satırı — migration G13). */
export async function fetchMyPendingClaim(landingDbId: string): Promise<PendingClaimRow | null> {
  const { data, error } = await supabase
    .from("group_claims" as never)
    .select("id, method, status, code, code_expires_at, attempt_count")
    .eq("landing_id", landingDbId)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  if (error) throw mapClaimError(error, "Sahiplik talebi okunamadı.");
  return (data as PendingClaimRow | null) ?? null;
}

export interface ClaimCodeStart {
  claim_id: string;
  code: string;
  expires_at: string;
  reused: boolean;
}

/** Kod talebi başlat (idempotent: aktif kod aynı kullanıcıya aynen döner). */
export async function startClaimCode(landingDbId: string): Promise<ClaimCodeStart> {
  const { data, error } = await supabase.rpc("group_claim_start_code" as never, {
    p_landing_id: landingDbId,
  } as never);

  if (error) throw mapClaimError(error, "Kod talebi başlatılamadı.");
  return data as ClaimCodeStart;
}

export type ClaimVerifyResult =
  | "verified"
  | "not_found"
  | "expired"
  | "invalid_link"
  | "unknown";

export interface ClaimVerifyOutcome {
  result: ClaimVerifyResult;
  attempts_left?: number;
  exhausted?: boolean;
  name_read?: string | null;
  detail?: string;
}

/**
 * "Kontrol et" — okuma SUNUCUDA (edge `group-claim-verify`), istemci yalnız
 * sonucu gösterir. Davet linki bu çağrıya YAZILMAZ (edge onu DB'den okur,
 * G08 kural 1+8).
 */
export async function verifyClaimCode(claimId: string): Promise<ClaimVerifyOutcome> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error(GROUP_CLAIM_ERROR_MESSAGES.group_claim_auth_required);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const response = await fetch(`${supabaseUrl}/functions/v1/group-claim-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ claim_id: claimId }),
  });

  const payload = (await response.json().catch(() => null)) as (ClaimVerifyOutcome & { error?: string }) | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? "Doğrulama çalıştırılamadı. Lütfen tekrar dene.");
  }
  if (!payload?.result) throw new Error("Doğrulama sonucu okunamadı.");
  return payload;
}

/** Tasarım §3.B adım 4-5: sonuç metinleri birebir (kod silme hatırlatması dahil). */
export const CLAIM_VERIFY_RESULT_MESSAGES: Record<ClaimVerifyResult, string> = {
  verified: "Sahiplik doğrulandı — artık bu grubun sahibisin. Kodu artık silebilirsin.",
  not_found: "Kod grup adında bulunamadı.",
  expired: "Kodun süresi doldu. Yeni bir kod isteyebilirsin.",
  invalid_link:
    "Davet linki çalışmıyor görünüyor — bu deneme sayılmadı. Linki kontrol edip tekrar dene.",
  unknown:
    "Davet sayfası okunamadı — bu deneme sayılmadı. Birkaç dakika sonra tekrar dene ya da ekran görüntüsü yolunu kullan.",
};

export const CLAIM_SCREENSHOT_BUCKET = "group-claim-screenshots";

/**
 * Ekran görüntüsü yolu (tasarım §3.B adım 5 yedeği): dosya private kovaya,
 * KULLANICININ KENDİ klasörüne yüklenir (`{uid}/screenshot-…` — storage
 * politikası ve RPC aynı deseni zorunlu kılar), sonra talep RPC'si çağrılır.
 */
export async function submitClaimScreenshot(
  landingDbId: string,
  file: File,
  note?: string,
): Promise<string> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (userError || !uid) throw new Error(GROUP_CLAIM_ERROR_MESSAGES.group_claim_auth_required);

  const safeName = file.name
    .replace(/[^A-Za-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-100) || "kanit";
  const path = `${uid}/screenshot-${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(CLAIM_SCREENSHOT_BUCKET)
    .upload(path, file, { contentType: file.type || "image/png", upsert: false });
  if (uploadError) throw new Error("Ekran görüntüsü yüklenemedi. Lütfen tekrar dene.");

  const { data, error } = await supabase.rpc("group_claim_submit_screenshot" as never, {
    p_landing_id: landingDbId,
    p_screenshot_path: path,
    p_note: note?.trim() ? note.trim().slice(0, 500) : null,
  } as never);
  if (error) throw mapClaimError(error, "Sahiplik talebi gönderilemedi.");
  return data as string;
}

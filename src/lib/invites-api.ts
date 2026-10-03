// M12 · Davet istemcisi — M11 RPC'lerinin UI yolu.
//
// • `get_invite_leaderboard` ANON+AÇIK (M11'de grant ve gövde-auth yokluğu
//   ayrı ayrı kilitlendi) — /liderlik herkese açık sayfa.
// • `get_or_create_my_invite_code` authenticated — InviteCard girişli üyede.
// • Davet taşıyıcısı: `/?davet=KOD` (ana sayfa). Kayıt akışı M13'te
//   `readInviteCodeFromSearch` ile okuyup `redeem_invite_code` çağıracak.
//   Kod alfabesi SAFE_CHARS (M11 aynası) — normalizasyon `referral-qr.ts`'in
//   `normalizeReferralCode`'u yeniden kullanılır (ikinci alfabe UYDURULMAZ).
//
// ⚠️ types.ts regen BORCU (G12): `as never` deseni bilinçli. RPC hataları
// DÜZ NESNE — instanceof Error daraltması YASAK (m75/KR03).
import { supabase } from "@/integrations/supabase/client";
import { reportClientError } from "@/lib/client-error-reports";
import { normalizeReferralCode } from "@/lib/referral-qr";

/** M11 raise kodları → Türkçe (çift yönlü ayna test: user-invites-schema). */
export const INVITE_ERROR_MESSAGES: Record<string, string> = {
  invite_auth_required: "Davet kodu için giriş yapmalısın.",
  invite_code_not_found: "Davet kodu bulunamadı ya da artık geçerli değil.",
  invite_self_not_allowed: "Kendi davet kodunu kullanamazsın.",
};

const mapInviteError = (error: { message?: string } | null, fallback: string) =>
  new Error(INVITE_ERROR_MESSAGES[error?.message ?? ""] ?? fallback);

export interface InviteLeaderboardEntry {
  display_name: string;
  slug: string;
  invite_count: number;
}

export interface InviteLeaderboard {
  entries: InviteLeaderboardEntry[];
  badge_tiers: number[];
}

/** Liderlik tablosu — anonim açık (sayfa RequireAuth'sız). */
export async function fetchInviteLeaderboard(limit?: number): Promise<InviteLeaderboard> {
  const { data, error } = await supabase.rpc("get_invite_leaderboard" as never, {
    p_limit: limit ?? null,
  } as never);

  if (error) throw mapInviteError(error, "Liderlik tablosu okunamadı.");
  const payload = data as InviteLeaderboard | null;
  return {
    entries: Array.isArray(payload?.entries) ? payload!.entries : [],
    badge_tiers: Array.isArray(payload?.badge_tiers) ? payload!.badge_tiers : [],
  };
}

export interface InviteCodeResult {
  code: string;
  created: boolean;
}

/** Üyenin davet kodu (idempotent — M11: üye başına TEK kod). */
export async function getOrCreateMyInviteCode(): Promise<InviteCodeResult> {
  const { data, error } = await supabase.rpc("get_or_create_my_invite_code" as never, {} as never);

  if (error) throw mapInviteError(error, "Davet kodu alınamadı.");
  const payload = data as InviteCodeResult | null;
  if (!payload?.code) throw new Error("Davet kodu alınamadı.");
  return payload;
}

/** Davet taşıyıcısı parametre adı (M13 kayıt akışı bunu okur). */
export const INVITE_QUERY_PARAM = "davet";

export function buildInviteLink(
  code: string,
  baseOrigin = typeof window === "undefined" ? "https://corteqs.net" : window.location.origin,
): string {
  const target = new URL("/", baseOrigin);
  target.searchParams.set(INVITE_QUERY_PARAM, normalizeReferralCode(code));
  return target.toString();
}

/**
 * URL'den davet kodu oku — geçersiz/seçilmiş kod `null` döner (kayıt akışı
 * bonusu düşürmez, M13). Normalizasyon referral-qr ile AYNI (SAFE_CHARS).
 */
export function readInviteCodeFromSearch(search: string): string | null {
  const raw = new URLSearchParams(search).get(INVITE_QUERY_PARAM);
  if (!raw) return null;
  try {
    return normalizeReferralCode(raw);
  } catch {
    return null;
  }
}

// ── M13 · davet taşıyıcısı (OAuth redirect query'yi düşürebilir) ─────────────

/** Taşıyıcı anahtar — OAuth gidiş-dönüşünde kod kaybolmasın diye localStorage. */
export const INVITE_CARRIER_STORAGE_KEY = "corteqs.davetKodu";

/**
 * URL'deki `?davet=` kodunu localStorage'a yakalar (App mount). Kod yoksa
 * mevcut taşıyıcıya DOKUNMAZ — oturumlar arası korunur (kayıt yarım kalıp
 * kullanıcı ertesi gün dönerse davet hâlâ sayılır).
 */
export function captureInviteCarrier(search: string): void {
  const code = readInviteCodeFromSearch(search);
  if (!code) return;
  try {
    window.localStorage.setItem(INVITE_CARRIER_STORAGE_KEY, code);
  } catch {
    // Depolama kapalıysa (gizli sekme kotası vb.) sessiz düş — davet bonus,
    // kayıt akışı asla bloklanmaz.
  }
}

/**
 * Taşıyıcıdaki kodu OKUR VE SİLER (tek kullanımlık). Giriş yoksa null — kod
 * saklı kalır, sonraki oturumda denenir. İdempotans SQL'de (M11: invited_user_id
 * UNIQUE) — istemci tarafı sayaç TUTULMAZ (M03/M04 dersi).
 */
export function takeInviteCarrier(): string | null {
  try {
    const code = window.localStorage.getItem(INVITE_CARRIER_STORAGE_KEY);
    if (code) window.localStorage.removeItem(INVITE_CARRIER_STORAGE_KEY);
    return code ? normalizeReferralCode(code) : null;
  } catch {
    return null;
  }
}

/**
 * Davet kodunu kullanır (M13). 🔴 KAYIT AKIŞININ PARÇASI DEĞİL — bonus:
 * hata FIRLATMAZ, `reportClientError` ile tanılanır ve `false` döner.
 * Geçersiz/silinmiş kod, self-invite ve ikinci kullanım burada sessizce
 * yutulur; kayıt/giriş akışı kesintisiz devam eder.
 */
export async function redeemInviteCodeSafely(code: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("redeem_invite_code" as never, {
      p_code: code,
    } as never);

    if (error) {
      // Bilinen kodlar (geçersiz/kendi kodu/ikinci kullanım) BEKLENEN durumdur —
      // tanılama yine de yazılır (client_error_reports 60sn dedupe içerir).
      reportClientError({
        source: "unhandled",
        context: "redeemInviteCodeSafely",
        error,
      });
      return false;
    }
    return true;
  } catch (error) {
    // Ağ düzeyi reject bile KAYDI DÜŞÜREMEZ — sözleşme: bu fonksiyon ASLA
    // fırlatmaz (M13 tuzağı).
    reportClientError({
      source: "unhandled",
      context: "redeemInviteCodeSafely",
      error,
    });
    return false;
  }
}

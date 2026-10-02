// G24 · M5 Moderatör paneli API katmanı (tasarım §10).
//
// Kuyruk verileri RLS ile okunur (admin select politikaları G13/G16'da hazır —
// istemci tarafı admin kontrolü yalnız arayüz kolaylığıdır, güvenlik DEĞİL;
// KR08 deseni). Kararlar MEVCUT tek kapılardan geçer — yeni karar RPC'si
// UYDURULMAZ: set_group_status_v1 (G12) · admin_review_group_claim (G13) ·
// group_post_review (G16) · admin_record_group_strike (G15). Panelin kendi
// kapıları: group_moderator_summary + admin_set_group_setting (mig 20261002130000).
//
// ⚠️ types.ts regen BORCU: group_claims/group_posts üretilmiş tiplerde YOK —
// `as never` deseni bilinçli. RPC hataları DÜZ NESNE — instanceof Error YASAK (KR03).
import { supabase } from "@/integrations/supabase/client";

/** Panelin çağırdığı TÜM kapıların raise kodları → Türkçe (çift yönlü test kilidi). */
export const GROUP_MODERATION_ERROR_MESSAGES: Record<string, string> = {
  // G24
  group_moderator_forbidden: "Moderatör özeti yalnız yöneticilere açıktır.",
  forbidden: "Bu işlem yalnız yöneticilere açıktır.",
  unknown_setting_key: "Bu ayar anahtarı panelden değiştirilemez (ürün kararı SQL güncellemesi ister).",
  setting_value_must_be_boolean: "Ayar değeri true/false olmalı.",
  // G12 set_group_status_v1
  group_invalid_status: "Geçersiz durum.",
  group_hidden_reason_required: "Gizleme için sebep zorunlu.",
  group_not_found: "Grup bulunamadı.",
  group_illegal_transition: "Bu durum geçişine izin yok.",
  group_forbidden: "Bu durum değişikliği için yetkin yok.",
  group_status_direct_update_forbidden: "Durum doğrudan güncellenemez.",
  // G13 admin_review_group_claim
  group_claim_forbidden: "Sahiplik taleplerini yalnız moderatörler inceler.",
  group_claim_invalid_decision: "Geçersiz karar.",
  group_claim_not_found: "Talep bulunamadı.",
  group_claim_not_reviewable: "Bu talep artık incelenemez (karar verilmiş).",
  // G15 admin_record_group_strike
  group_strike_forbidden: "Uyarı kaydı yalnız yöneticilere açıktır.",
  group_strike_reason_required: "Uyarı gerekçesi zorunlu.",
  group_strike_invalid_redline: "Kırmızı çizgi numarası 1-7 aralığında olmalı.",
  group_already_removed: "Grup zaten listeden kaldırılmış (terminal).",
  // G16 group_post_review
  group_post_auth_required: "Gönderi incelemesi için giriş yapmalısın.",
  group_post_invalid_decision: "Geçersiz karar.",
  group_post_not_found: "Gönderi bulunamadı.",
  group_post_invalid_transition: "Bu gönderi artık bu kararla incelenemez.",
  group_post_forbidden: "Bu gönderiyi inceleme yetkin yok.",
};

const mapModerationError = (error: { message?: string } | null, fallback: string) =>
  new Error(GROUP_MODERATION_ERROR_MESSAGES[error?.message ?? ""] ?? fallback);

export interface TaskRunInfo {
  jobname: string;
  schedule: string;
  last_status: string | null;
  last_end_time: string | null;
}

export interface GroupModeratorSummary {
  pending_groups: number;
  pending_claims: number;
  pending_posts: number;
  pending_reports: number;
  moderated_count: number;
  fast_lane_suggest_threshold: number;
  fast_lane_enabled: boolean;
  task_runs: TaskRunInfo[];
}

export async function fetchGroupModeratorSummary(): Promise<GroupModeratorSummary> {
  const { data, error } = await supabase.rpc("group_moderator_summary" as never, {} as never);
  if (error) throw mapModerationError(error, "Moderatör özeti okunamadı.");
  return data as GroupModeratorSummary;
}

export interface PendingGroupRow {
  id: string;
  slug: string;
  group_name: string;
  category: string;
  country: string;
  city: string;
  short_description: string | null;
  review_flags: string[] | null;
  submitted_as_admin: boolean | null;
  platform: string | null;
  created_at: string;
}

/** Kuyruk 1 — yeni gruplar (`pending_review`). */
export async function fetchPendingGroups(): Promise<PendingGroupRow[]> {
  const { data, error } = await supabase
    .from("whatsapp_landings")
    .select(
      "id, slug, group_name, category, country, city, short_description, review_flags, submitted_as_admin, platform, created_at",
    )
    .eq("listing_status", "pending_review")
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as PendingGroupRow[];
}

export interface PendingClaimRow {
  id: string;
  landing_id: string;
  user_id: string;
  method: string;
  status: string;
  screenshot_path: string | null;
  review_note: string | null;
  is_contested: boolean | null;
  platform_name_read: string | null;
  created_at: string;
  group_name?: string | null;
}

/** Kuyruk 2 — sahiplik talepleri (ekran görüntüsü yöntemi; kod yolu otomatik). */
export async function fetchPendingClaims(): Promise<PendingClaimRow[]> {
  const { data, error } = await supabase
    .from("group_claims" as never)
    .select("id, landing_id, user_id, method, status, screenshot_path, review_note, is_contested, platform_name_read, created_at")
    .eq("status", "pending")
    .eq("method", "screenshot")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw mapModerationError(error, "Sahiplik kuyruğu okunamadı.");
  const rows = (data ?? []) as PendingClaimRow[];

  // Grup adları ayrı sorguda (join view'ı yok; 100 satır için tek IN sorgusu).
  const landingIds = [...new Set(rows.map((row) => row.landing_id))];
  if (landingIds.length > 0) {
    const { data: landings } = await supabase
      .from("whatsapp_landings")
      .select("id, group_name")
      .in("id", landingIds);
    const names = new Map((landings ?? []).map((row) => [row.id, row.group_name]));
    for (const row of rows) row.group_name = names.get(row.landing_id) ?? null;
  }
  return rows;
}

/** Ekran görüntüsü kanıtı: private kova, 5 dk'lık imzalı bağlantı (KR08 deseni). */
export async function createClaimScreenshotUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("group-claim-screenshots")
    .createSignedUrl(path, 300);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error("İmzalı bağlantı üretilemedi.");
  return data.signedUrl;
}

export interface PendingPostRow {
  id: string;
  landing_id: string;
  author_user_id: string;
  body: string;
  post_status: string;
  created_at: string;
  escalate_at: string | null;
  group_name?: string | null;
}

/** Kuyruk 4 — platform gönderi kuyruğu (`pending_platform`). */
export async function fetchPendingPosts(): Promise<PendingPostRow[]> {
  const { data, error } = await supabase
    .from("group_posts" as never)
    .select("id, landing_id, author_user_id, body, post_status, created_at, escalate_at")
    .eq("post_status", "pending_platform")
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw mapModerationError(error, "Gönderi kuyruğu okunamadı.");
  const rows = (data ?? []) as PendingPostRow[];

  const landingIds = [...new Set(rows.map((row) => row.landing_id))];
  if (landingIds.length > 0) {
    const { data: landings } = await supabase
      .from("whatsapp_landings")
      .select("id, group_name")
      .in("id", landingIds);
    const names = new Map((landings ?? []).map((row) => [row.id, row.group_name]));
    for (const row of rows) row.group_name = names.get(row.landing_id) ?? null;
  }
  return rows;
}

/** Karar 1 — yeni grup: yayınla ya da reddet (G12 tek kapı; not = moderatör gerekçesi). */
export async function decidePendingGroup(
  landingDbId: string,
  decision: "approve" | "reject",
  note?: string,
): Promise<void> {
  const { error } = await supabase.rpc("set_group_status_v1" as never, {
    p_landing_id: landingDbId,
    p_to_status: decision === "approve" ? "published" : "rejected",
    p_reason: decision === "approve" ? "published" : "rejected",
    p_note: note?.trim() ? note.trim() : null,
  } as never);
  if (error) throw mapModerationError(error, "Grup kararı kaydedilemedi.");
}

/** Karar 2 — sahiplik talebi (G13): approve → apply_verified zinciri. */
export async function decideClaim(
  claimId: string,
  decision: "approve" | "reject",
  note?: string,
): Promise<void> {
  const { error } = await supabase.rpc("admin_review_group_claim" as never, {
    p_claim_id: claimId,
    p_decision: decision,
    p_note: note?.trim() ? note.trim() : null,
  } as never);
  if (error) throw mapModerationError(error, "Sahiplik kararı kaydedilemedi.");
}

/** Karar 3 — gönderi (G16). */
export async function decidePost(
  postId: string,
  decision: "approve" | "reject",
  note?: string,
): Promise<void> {
  const { error } = await supabase.rpc("group_post_review" as never, {
    p_post_id: postId,
    p_decision: decision,
    p_note: note?.trim() ? note.trim() : null,
  } as never);
  if (error) throw mapModerationError(error, "Gönderi kararı kaydedilemedi.");
}

/** Karar 4 — uyarı ver (G15 strike merdiveni; redline 1-7 opsiyonel). */
export async function recordStrike(
  landingDbId: string,
  reason: string,
  redlineNumber?: number | null,
  note?: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("admin_record_group_strike" as never, {
    p_landing_id: landingDbId,
    p_reason: reason,
    p_redline_number: redlineNumber ?? null,
    p_note: note?.trim() ? note.trim() : null,
  } as never);
  if (error) throw mapModerationError(error, "Uyarı kaydedilemedi.");
  return String((data as { outcome?: string } | null)?.outcome ?? "");
}

/** Üst şerit — hızlı şerit anahtarı (beyaz liste tek anahtar; karar insanın). */
export async function setFastLaneEnabled(enabled: boolean): Promise<void> {
  const { error } = await supabase.rpc("admin_set_group_setting" as never, {
    p_key: "groups.fast_lane_enabled",
    p_value: enabled,
  } as never);
  if (error) throw mapModerationError(error, "Hızlı şerit anahtarı yazılamadı.");
}

/**
 * Reddetme hazır sebep listesi. ⚠️ AJAN İHTİYATI: tasarım §10 "Reddet + hazır
 * sebep listesi" der ama listeyi SAYMAZ — başlıklar politika §4 kırmızı çizgileri
 * ve Grup Sözü dilinden türetildi. Ekip listeyi değiştirirse tek kaynak burası.
 */
export const REJECT_REASON_PRESETS = [
  "Kara liste kelimeleri (vize/oturum/ilan)",
  "Grup Sözü'ne aykırı içerik",
  "Davet linki geçersiz veya ölü",
  "Yanlış kategori / konu dışı",
  "Diğer (not yaz)",
] as const;

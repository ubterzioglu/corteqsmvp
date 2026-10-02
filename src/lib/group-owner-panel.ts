// G21 · S4 Sahip paneli istemcisi (tasarım §11 + §3.C).
//
// Panelin dört işi: skor + eksik adımlar (G17 compute kırılımından) · bilgi
// düzenleme (`group_owner_update_v1`) · onay kuyruğu (G16 `group_post_review`
// — sahip pending_group_admin'de yetkili) · "Grubu listeden kaldır"
// (G12 `set_group_status_v1` owner_request yolu: ANINDA hidden, gerekçe
// SORULMAZ — kabul #9). Yeni kapı uydurulmadı; okuma tek çağrıda
// (`group_owner_panel_state`).
//
// ⚠️ types.ts regen BORCU (G12): RPC'ler üretilmiş tiplerde YOK — `as never`
// deseni bilinçli (emsal: group-submit.ts). RPC hataları DÜZ NESNE,
// `instanceof Error` daraltması YASAK (KR03).
import { supabase } from "@/integrations/supabase/client";

/** `group_owner_panel_state` + `group_owner_update_v1` raise kodları → Türkçe. */
export const GROUP_OWNER_ERROR_MESSAGES: Record<string, string> = {
  group_owner_auth_required: "Sahip paneli için giriş yapmalısın.",
  group_not_found: "Grup bulunamadı.",
  group_owner_forbidden: "Bu panel yalnızca grubun doğrulanmış sahibine açıktır.",
  group_owner_description_too_long: "Kısa açıklama en fazla 160 karakter olabilir.",
  group_owner_category_locked:
    "Aile & Çocuk kategorisi şu anda kapalı — yakında doğrulanmış kuruluşlara açılacak.",
  group_owner_invalid_category: "Geçerli bir kategori seçin.",
  group_owner_country_not_found: "Ülke katalogda bulunamadı — listeden seçin.",
  group_owner_city_required: "Global olmayan grup için şehir zorunludur.",
  group_owner_city_not_found: "Şehir katalogda bulunamadı — listeden seçin.",
  // G16 group_post_review + G12 set_group_status_v1 (panelin çağırdığı mevcut kapılar)
  group_post_auth_required: "Gönderi incelemesi için giriş yapmalısın.",
  group_post_invalid_decision: "Geçersiz karar.",
  group_post_not_found: "Gönderi bulunamadı.",
  group_post_invalid_transition: "Bu gönderi artık bu kararla incelenemez.",
  group_post_forbidden: "Bu gönderiyi inceleme yetkin yok.",
  group_illegal_transition: "Grup bu durumda kaldırılamaz.",
  group_forbidden: "Bu işlem için yetkin yok.",
  group_hidden_reason_required: "Gizleme sebebi gerekli.",
};

const mapOwnerError = (error: { message?: string } | null, fallback: string) =>
  new Error(GROUP_OWNER_ERROR_MESSAGES[error?.message ?? ""] ?? fallback);

export interface OwnerPendingPost {
  id: string;
  body: string;
  author_user_id: string;
  created_at: string;
  escalate_at: string | null;
}

export interface OwnerPanelLanding {
  group_name: string;
  slug: string;
  listing_status: string;
  short_description: string | null;
  rules: string | null;
  category: string;
  country_code: string | null;
  city_id: string | null;
  is_global: boolean;
  hero_image: string | null;
  tagline: string | null;
  group_score: number | null;
  has_approved_badge: boolean;
}

export interface OwnerScoreState {
  score: number | null;
  in_grace: boolean;
  recommendation_count: number;
  components: {
    profile: number;
    rules: number;
    moderation: number;
    link: number;
    recommendations: number;
    reports: number;
  };
}

export type OwnerPanelState =
  | { is_owner: false }
  | {
      is_owner: true;
      landing: OwnerPanelLanding;
      score: OwnerScoreState;
      pending_posts: OwnerPendingPost[];
      pending_count: number;
    };

/** Panelin tek okuma kapısı — sahip değilse `{is_owner:false}` (sızıntı yok). */
export async function fetchOwnerPanelState(landingDbId: string): Promise<OwnerPanelState> {
  const { data, error } = await supabase.rpc("group_owner_panel_state" as never, {
    p_landing_id: landingDbId,
  } as never);

  if (error) throw mapOwnerError(error, "Sahip paneli okunamadı.");
  return data as OwnerPanelState;
}

export interface OwnerUpdateParams {
  landingDbId: string;
  shortDescription?: string | null;
  rules?: string | null;
  category?: string | null;
  countryCode?: string | null;
  cityId?: string | null;
  isGlobal?: boolean | null;
  heroImage?: string | null;
  tagline?: string | null;
}

/** Sahip düzenlemesi — `null` geçen alan DEĞİŞMEZ (RPC eski değeri korur). */
export async function ownerUpdate(params: OwnerUpdateParams): Promise<void> {
  const { error } = await supabase.rpc("group_owner_update_v1" as never, {
    p_landing_id: params.landingDbId,
    p_short_description: params.shortDescription ?? null,
    p_rules: params.rules ?? null,
    p_category: params.category ?? null,
    p_country_code: params.countryCode ?? null,
    p_city_id: params.cityId ?? null,
    p_is_global: params.isGlobal ?? null,
    p_hero_image: params.heroImage ?? null,
    p_tagline: params.tagline ?? null,
  } as never);

  if (error) throw mapOwnerError(error, "Değişiklikler kaydedilemedi.");
}

/** Kuyruk kararı (G16): sahip yalnız kendi grubunun `pending_group_admin` sırasını inceler. */
export async function reviewGroupPost(
  postId: string,
  decision: "approve" | "reject",
  note?: string,
): Promise<void> {
  const { error } = await supabase.rpc("group_post_review" as never, {
    p_post_id: postId,
    p_decision: decision,
    p_note: note?.trim() ? note.trim() : null,
  } as never);

  if (error) throw mapOwnerError(error, "Gönderi incelenemedi.");
}

/**
 * Kabul #9 — "Grubu listeden kaldır": ANINDA `hidden(owner_request)`, gerekçe
 * SORULMAZ (tasarım §3.C). Moderatör 24 saat içinde `removed`'a çevirir.
 * G12 owner aktörüne bu geçişi zaten açıyor — yeni kapı YOK.
 */
export async function requestGroupRemoval(landingDbId: string): Promise<void> {
  const { error } = await supabase.rpc("set_group_status_v1" as never, {
    p_landing_id: landingDbId,
    p_to_status: "hidden",
    p_reason: "owner_request",
    p_note: "Sahip paneli: gruptan kaldırma isteği",
  } as never);

  if (error) throw mapOwnerError(error, "Grup listeden kaldırılamadı.");
}

/**
 * Eksik adım rehberi (tasarım §11: "skor ve eksik adımlar"; KALANLAR G21:
 * "Kurallarını ekle, +15"). Kalem puanları G17 formülünün kendisi — burada
 * eşik UYDURULMAZ, yalnız 0 puanlı kalemin karşılığı yazılır.
 */
export function scoreHints(score: OwnerScoreState): string[] {
  if (score.in_grace || score.score === null) {
    return ["Grup yayında 7 günü doldurduğunda skor hesaplanacak."];
  }

  const hints: string[] = [];
  const c = score.components;
  if (c.profile === 0) hints.push("Profilini tamamla (kısa açıklama + kategori + şehir), +15");
  if (c.rules === 0) hints.push("Kurallarını ekle, +15");
  if (c.moderation === 0) {
    hints.push("Sahiplik doğrulaman eksik ya da onay kuyruğun 48 saati aştı — kuyruğu işle, +15");
  }
  if (c.link === 0) hints.push("Davet linkin çalışmıyor görünüyor — yenile, +15");
  if (c.recommendations < 20) {
    hints.push(
      `Üyelerinden tavsiye topla: şu an ${score.recommendation_count} tavsiye, +${20 - c.recommendations} puan`,
    );
  }
  if (hints.length === 0) hints.push("Tüm skor kalemlerin dolu — rozetini paylaşmayı unutma.");
  return hints;
}

/**
 * "Onaylı Grup" rozet görseli (politika §7: "Instagram'da paylaşılabilir rozet
 * görseli"; tasarım §9 bildirim metni G23'te linkini taşıyacak). İstemcide SVG
 * üretilir — sunucu yükü yok, 1080x1080 (Instagram karesi).
 */
export function buildApprovedBadgeSvg(params: { groupName: string; score: number | null }): string {
  const safeName = params.groupName
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const scoreText = params.score === null ? "" : `${params.score}`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">`,
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0" stop-color="#065f46"/><stop offset="1" stop-color="#0f766e"/>`,
    `</linearGradient></defs>`,
    `<rect width="1080" height="1080" fill="url(#bg)"/>`,
    `<circle cx="540" cy="400" r="190" fill="none" stroke="#fbbf24" stroke-width="18"/>`,
    `<path d="M460 400 l55 55 110 -120" fill="none" stroke="#fbbf24" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<text x="540" y="680" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="76" font-weight="800" fill="#ffffff">Onaylı Grup</text>`,
    `<text x="540" y="760" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="44" fill="#d1fae5">${safeName}</text>`,
    scoreText
      ? `<text x="540" y="840" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="38" fill="#a7f3d0">Grup Sağlık Skoru ${scoreText} / 100</text>`
      : "",
    `<text x="540" y="960" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="34" fill="#99f6e4">corteqs.net</text>`,
    `</svg>`,
  ]
    .filter(Boolean)
    .join("");
}

/** SVG'yi dosya olarak indirir (blob URL — sunucu yok). */
export function downloadBadgeSvg(groupName: string, score: number | null): void {
  const svg = buildApprovedBadgeSvg({ groupName, score });
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "corteqs-onayli-grup-rozeti.svg";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

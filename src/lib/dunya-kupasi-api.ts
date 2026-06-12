// Dünya Kupası işletme kampanyası — API katmanı.
// Okumalar: settings (anon select), public liste RPC'si, kendi başvurusu (RLS own-row).
// Yazma yalnız create_world_cup_registration_v1 RPC'si üzerinden (Cadde kuralı).

import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

import {
  resolveWorldCupErrorMessage,
  WORLD_CUP_CATEGORY_KEYS,
  type BusinessCategoryOption,
  type WorldCupBusinessListing,
  type WorldCupCampaignSettings,
  type WorldCupRegistration,
  type WorldCupRegistrationFormValues,
  type WorldCupRegistrationStatus,
} from "./dunya-kupasi-schemas";

// Generated types (B1) güncel olmadığı için world_cup_* nesneleri typed client ile
// uyuşmaz. Tek izole cast (cadde-internal.ts deseni); B1 çözülünce kaldırılacak.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type RegistrationRow = {
  id: string;
  user_id: string;
  business_name: string;
  category_role_key: string;
  country: string;
  city: string;
  phone: string | null;
  address: string | null;
  image_path: string | null;
  broadcast_confirmed: boolean;
  applicant_note: string | null;
  status: WorldCupRegistrationStatus;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
};

const mapRegistrationRow = (row: RegistrationRow): WorldCupRegistration => ({
  id: row.id,
  userId: row.user_id,
  businessName: row.business_name,
  categoryRoleKey: row.category_role_key,
  country: row.country,
  city: row.city,
  phone: row.phone,
  address: row.address,
  imagePath: row.image_path,
  broadcastConfirmed: row.broadcast_confirmed,
  applicantNote: row.applicant_note,
  status: row.status,
  reviewedAt: row.reviewed_at,
  reviewNote: row.review_note,
  createdAt: row.created_at,
});

/** Kampanya penceresi (singleton id=1). Satır yoksa pasif kabul edilir. */
export async function fetchWorldCupCampaignSettings(): Promise<WorldCupCampaignSettings> {
  if (!isSupabaseConfigured) {
    return { isActive: false, startsAt: null, endsAt: null };
  }

  const { data, error } = await db
    .from("world_cup_campaign_settings")
    .select("is_active, starts_at, ends_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { isActive: false, startsAt: null, endsAt: null };

  const now = Date.now();
  const startsOk = !data.starts_at || new Date(data.starts_at).getTime() <= now;
  const endsOk = !data.ends_at || new Date(data.ends_at).getTime() > now;

  return {
    isActive: Boolean(data.is_active) && startsOk && endsOk,
    startsAt: data.starts_at ?? null,
    endsAt: data.ends_at ?? null,
  };
}

/** Public liste — onaylı işletmeler (anon erişimli RPC; kampanya pasifse boş döner). */
export async function listWorldCupBusinesses(limit = 200): Promise<WorldCupBusinessListing[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await db.rpc("list_world_cup_businesses_v1", { p_limit: limit });
  if (error) throw error;
  return Array.isArray(data) ? (data as WorldCupBusinessListing[]) : [];
}

/**
 * Kullanıcının kendi başvurusu (RLS own-row select).
 * Öncelik: aktif (pending/approved) kayıt; yoksa en son reddedilen; yoksa null.
 */
export async function fetchMyWorldCupRegistration(userId: string): Promise<WorldCupRegistration | null> {
  if (!isSupabaseConfigured || !userId) return null;

  const { data, error } = await db
    .from("world_cup_registrations")
    .select(
      "id, user_id, business_name, category_role_key, country, city, phone, address, image_path, broadcast_confirmed, applicant_note, status, reviewed_at, review_note, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as RegistrationRow[];
  const active = rows.find((row) => row.status === "pending" || row.status === "approved");
  const latest = active ?? rows[0] ?? null;
  return latest ? mapRegistrationRow(latest) : null;
}

/** Başvuru oluştur (create_world_cup_registration_v1). Hata kodları Türkçe mesaja çevrilir. */
export async function createWorldCupRegistration(values: WorldCupRegistrationFormValues): Promise<string> {
  const { data, error } = await db.rpc("create_world_cup_registration_v1", {
    p_business_name: values.businessName,
    p_category_role_key: values.categoryRoleKey,
    p_country: values.country,
    p_city: values.city,
    p_phone: values.phone.trim(),
    p_address: values.address.trim(),
    p_broadcast_confirmed: values.broadcastConfirmed,
    p_note: values.note?.trim() || null,
    p_image_path: values.imagePath?.trim() || null,
  });

  if (error) {
    throw new Error(resolveWorldCupErrorMessage(error));
  }
  return data as string;
}

/** Kart görselleri public bucket'ı (mig 20260613090000; 5MB, jpeg/png/webp). */
export const WORLD_CUP_IMAGE_BUCKET = "world-cup-images";

/**
 * İşletme görselini kullanıcının kendi klasörüne yükler (storage policy:
 * yalnız auth.uid()/ öneki yazılabilir). Dönen path RPC'ye p_image_path olarak geçer.
 */
export async function uploadWorldCupImage(file: File, userId: string): Promise<string> {
  if (!userId) {
    throw new Error("Görsel yüklemek için giriş yapmalısınız.");
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  const safeExt = ext ? `.${ext.toLowerCase()}` : "";
  const path = `${userId}/${crypto.randomUUID()}${safeExt}`;

  const { error } = await supabase.storage.from(WORLD_CUP_IMAGE_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) {
    throw new Error("Görsel yüklenemedi. Lütfen tekrar deneyin.");
  }

  return path;
}

/** Public bucket'taki kart görselinin tarayıcı URL'i (path yoksa null). */
export function getWorldCupImagePublicUrl(path: string | null | undefined): string | null {
  if (!isSupabaseConfigured || !path) return null;
  return supabase.storage.from(WORLD_CUP_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Maç mekânı kategorisi seçenekleri (WORLD_CUP_CATEGORY_KEYS allowlist'i; form login arkasında). */
export async function listBusinessCategoryOptions(): Promise<BusinessCategoryOption[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await db
    .from("roles")
    .select("key, label")
    .in("key", [...WORLD_CUP_CATEGORY_KEYS])
    .eq("is_active", true);
  if (error) throw error;

  const rows = (data ?? []) as Array<{ key: string; label: string }>;
  // Görüntü sırası DB sort_order'ı değil, allowlist sırası.
  return [...rows]
    .sort(
      (a, b) =>
        WORLD_CUP_CATEGORY_KEYS.indexOf(a.key as (typeof WORLD_CUP_CATEGORY_KEYS)[number]) -
        WORLD_CUP_CATEGORY_KEYS.indexOf(b.key as (typeof WORLD_CUP_CATEGORY_KEYS)[number]),
    )
    .map((row) => ({ key: row.key, label: row.label }));
}

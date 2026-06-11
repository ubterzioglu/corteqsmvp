// Dünya Kupası işletme kampanyası — API katmanı.
// Okumalar: settings (anon select), public liste RPC'si, kendi başvurusu (RLS own-row).
// Yazma yalnız create_world_cup_registration_v1 RPC'si üzerinden (Cadde kuralı).

import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

import {
  resolveWorldCupErrorMessage,
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
  address: string | null;
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
  address: row.address,
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
      "id, user_id, business_name, category_role_key, country, city, address, broadcast_confirmed, applicant_note, status, reviewed_at, review_note, created_at",
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
    p_address: values.address?.trim() || null,
    p_broadcast_confirmed: values.broadcastConfirmed,
    p_note: values.note?.trim() || null,
  });

  if (error) {
    throw new Error(resolveWorldCupErrorMessage(error));
  }
  return data as string;
}

/** İşletme kategorisi seçenekleri (25 Business_* flat rolü; form login arkasında). */
export async function listBusinessCategoryOptions(): Promise<BusinessCategoryOption[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await db
    .from("roles")
    .select("key, label, sort_order")
    .like("key", "Business\\_%")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;

  return ((data ?? []) as Array<{ key: string; label: string }>).map((row) => ({
    key: row.key,
    label: row.label,
  }));
}

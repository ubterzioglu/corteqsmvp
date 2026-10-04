// M26 · Haftalık şehir özeti — takip yönetimi (`user_city_follows`, M24 şeması).
//
// 🔴 Şehir `geo_cities`'e FK (`city_id`) — SERBEST METİN YOK (CLAUDE.md Dijital
// Gruplar md.3: şehir/ülke geo_*'tan gelir, cadde_*'tan DEĞİL; metin olsaydı
// Münih/munih üç ayrı takip olurdu ve özet birleştiremezdi).
// 🔴 TAVAN: `CITY_FOLLOWS_MAX_PER_USER` = M24 seed aynası
// (`weekly_city_digest.max_follows_per_user`=10). Eşik KODDA SABİT DEĞİL,
// migration metnine contract testle kilitli (cadde_settings deseni) — kontrol
// YAZMADAN ÖNCE (sıra kilitli: önce count, sonra insert).
// 🔴 Yazma RLS'le kendi satırına; `user_id` İSTEMCİDEN ALINMAZ — auth.getUser()
// ile sunucu kimliğinden konur (RLS with check zaten denetler, çift katman).
// ⚠️ geo_cities 76.992 satır — SUNUCUDA satır başına tarama YASAK (05.08 dersi):
// şehir listesi geo.ts deseniyle ülke bazında SAYFALI çekilir, filtre İSTEMCİDE
// `filterByQuery` (Türkçe katlamalı) ile yapılır. PostgREST 1000 tavanı → range.
// ⚠️ types.ts regen BORCU (G12): user_city_follows üretilmiş tiplerde YOK — `as never`.
import { supabase } from "@/integrations/supabase/client";
import { filterByQuery } from "@/lib/country-city-search";

/** M24 `weekly_city_digest.max_follows_per_user` seed aynası — contract test kilitler. */
export const CITY_FOLLOWS_MAX_PER_USER = 10;

export const CITY_FOLLOWS_ERROR_MESSAGES = {
  auth_required: "Şehir takibi için giriş yapmalısın.",
  max_reached: `En fazla ${CITY_FOLLOWS_MAX_PER_USER} şehir takip edebilirsin.`,
  generic: "Şehir takibi işlenemedi. Lütfen tekrar dene.",
} as const;

export interface CityFollowRow {
  city_id: string;
  created_at: string;
  city_name: string | null;
  country_name: string | null;
}

export interface GeoCityOption {
  id: string;
  name: string;
}

type FollowEmbedRow = {
  city_id: string;
  created_at: string;
  city?: { name?: string; country?: { name?: string } } | null;
};

/** Kendi takiplerim (RLS kendi satırları) — gömülü şehir+ülke adıyla. */
export async function fetchMyCityFollows(): Promise<CityFollowRow[]> {
  const { data, error } = await supabase
    .from("user_city_follows" as never)
    .select("city_id, created_at, city:geo_cities(name, country:geo_countries(name))" as never)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;

  return (((data ?? []) as unknown) as FollowEmbedRow[]).map((row) => ({
    city_id: row.city_id,
    created_at: row.created_at,
    city_name: row.city?.name ?? null,
    country_name: row.city?.country?.name ?? null,
  }));
}

const GEO_PAGE_SIZE = 1000;

/**
 * Ülkenin aktif şehirleri (id+name), geo.ts deseniyle SAYFALI (1000 tavanı).
 * Büyük ülkeler (DE ~7k) birden çok sayfa — react-query cache'i bir kez çektirir.
 */
export async function listCityOptionsForCountry(countryNameOrCode: string): Promise<GeoCityOption[]> {
  const key = countryNameOrCode.trim();
  if (!key) return [];

  const { data: country, error: countryError } = await supabase
    .from("geo_countries" as never)
    .select("id" as never)
    .or(`code.eq.${key},name.eq.${key}` as never)
    .maybeSingle();
  if (countryError) throw countryError;
  const countryId = (country as { id?: string } | null)?.id;
  if (!countryId) return [];

  const options: GeoCityOption[] = [];
  for (let offset = 0; ; offset += GEO_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("geo_cities" as never)
      .select("id, name" as never)
      .eq("country_id" as never, countryId as never)
      .eq("is_active" as never, true as never)
      .order("sort_order" as never, { ascending: true })
      .order("name" as never, { ascending: true })
      .range(offset, offset + GEO_PAGE_SIZE - 1);
    if (error) throw error;

    const page = (((data ?? []) as unknown) as GeoCityOption[]);
    options.push(...page);
    if (page.length < GEO_PAGE_SIZE) break;
  }
  return options;
}

/** İstemci tarafı Türkçe-duyarlı filtre (sunucuda satır başına tarama YASAK). */
export function filterCityOptions(options: GeoCityOption[], query: string): GeoCityOption[] {
  const names = filterByQuery(options.map((option) => option.name), query);
  const allowed = new Set(names);
  return options.filter((option) => allowed.has(option.name));
}

/**
 * Takip ekle. 🔴 SIRA KİLİTLİ: önce tavan kontrolü (count), SONRA insert —
 * tavan aşımında insert HİÇ denenmez. PK çakışması (23505) idempotent yutulur.
 */
export async function addCityFollow(cityId: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (userError || !uid) throw new Error(CITY_FOLLOWS_ERROR_MESSAGES.auth_required);

  const { count, error: countError } = await supabase
    .from("user_city_follows" as never)
    .select("city_id" as never, { count: "exact", head: true } as never);
  if (countError) throw countError;
  if ((count ?? 0) >= CITY_FOLLOWS_MAX_PER_USER) {
    throw new Error(CITY_FOLLOWS_ERROR_MESSAGES.max_reached);
  }

  const { error } = await supabase
    .from("user_city_follows" as never)
    .insert({ user_id: uid, city_id: cityId } as never);
  if (error) {
    if (String((error as { code?: string }).code) === "23505") return; // zaten takipte
    throw error;
  }
}

/** Takip kaldır (RLS yalnız kendi satırını siler). */
export async function removeCityFollow(cityId: string): Promise<void> {
  const { error } = await supabase
    .from("user_city_follows" as never)
    .delete()
    .eq("city_id" as never, cityId as never);
  if (error) throw error;
}

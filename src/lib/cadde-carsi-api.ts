// Çarşı (U2U marketplace) API katmanı — Cadde 3.0 Faz 5.
// D-01 sözleşmesi: Çarşı, Tanıtım/sponsorlu görünürlük (cadde_promotion_*/billboard) ile
// ASLA aynı tablo/panel altında birleşmez; bu modül yalnız carsi_* nesneleriyle konuşur.
// Mutation'lar security-definer RPC'lerden geçer (create/update/delete_carsi_item_v1);
// hatalar resolveCaddeRpcErrorMessage ile Türkçe mesaja çevrilir, okumalar boş sonuçla düşer.

import { isSupabaseConfigured } from "@/integrations/supabase/client";

import {
  FALLBACK_PROFILE_NAME,
  db,
  reportCaddeApiError,
  resolveCityIdsByNames,
  resolveCountryIdsByNames,
} from "./cadde-internal";
import { resolveCaddeRpcErrorMessage } from "./cadde-rules";
import { carsiItemCreateSchema, carsiItemUpdateSchema, parseWithUserError } from "./cadde-schemas";
import type {
  CarsiCategory,
  CarsiCategoryRow,
  CarsiItem,
  CarsiItemCreateInput,
  CarsiItemRow,
  CarsiItemStatus,
} from "./cadde-types";

const ITEM_SELECT_COLUMNS =
  "id, owner_user_id, category_key, title, description, price_amount, price_currency, country_id, city_id, image_urls, contact_mode, status, moderation_status, expires_at, created_at";

export async function listCarsiCategories(): Promise<CarsiCategory[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await db
      .from("carsi_categories")
      .select("key, label_tr, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data as CarsiCategoryRow[]).map((row) => ({ key: row.key, labelTr: row.label_tr, sortOrder: row.sort_order }));
  } catch (error: unknown) {
    reportCaddeApiError("listCarsiCategories", error);
    return [];
  }
}

type ReferenceMaps = {
  countries: Map<string, string>;
  cities: Map<string, string>;
  categories: Map<string, string>;
  owners: Map<string, string>;
};

async function fetchReferenceMaps(rows: CarsiItemRow[]): Promise<ReferenceMaps> {
  const ownerIds = Array.from(new Set(rows.map((row) => row.owner_user_id)));
  const [countriesRes, citiesRes, categoriesRes, ownersRes] = await Promise.all([
    db.from("cadde_countries").select("id, name"),
    db.from("cadde_cities").select("id, name"),
    db.from("carsi_categories").select("key, label_tr"),
    ownerIds.length > 0
      ? db
          .from("user_profile_attributes")
          .select("user_id, value_text, afs_attributes!inner(key)")
          .in("user_id", ownerIds)
          .eq("afs_attributes.key", "full_name")
      : Promise.resolve({ data: [] }),
  ]);
  return {
    countries: new Map(((countriesRes.data ?? []) as Array<{ id: string; name: string }>).map((row) => [row.id, row.name])),
    cities: new Map(((citiesRes.data ?? []) as Array<{ id: string; name: string }>).map((row) => [row.id, row.name])),
    categories: new Map(((categoriesRes.data ?? []) as Array<{ key: string; label_tr: string }>).map((row) => [row.key, row.label_tr])),
    owners: new Map(((ownersRes.data ?? []) as Array<{ user_id: string; value_text: string | null }>).map((row) => [row.user_id, row.value_text ?? FALLBACK_PROFILE_NAME])),
  };
}

function mapItem(row: CarsiItemRow, maps: ReferenceMaps): CarsiItem {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    ownerName: maps.owners.get(row.owner_user_id) ?? FALLBACK_PROFILE_NAME,
    categoryKey: row.category_key,
    categoryLabel: maps.categories.get(row.category_key) ?? row.category_key,
    title: row.title,
    description: row.description,
    priceAmount: row.price_amount,
    priceCurrency: row.price_currency,
    country: row.country_id ? maps.countries.get(row.country_id) ?? null : null,
    city: row.city_id ? maps.cities.get(row.city_id) ?? null : null,
    imageUrls: row.image_urls ?? [],
    contactMode: row.contact_mode,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export type CarsiListFilters = {
  countries: string[];
  cities: string[];
  categoryKey?: string;
  /** Faz 8: diaspora ayrımı (default tr) — bir diaspora'nın ilanı diğerine sızmaz. */
  diasporaKey?: string;
};

/** Yayında + onaylı ilanlar (yeniden eskiye). RLS süresi dolanları sahibi dışında zaten gizler. */
export async function listCarsiItems(filters: CarsiListFilters, limit = 60): Promise<CarsiItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const countryIds = await resolveCountryIdsByNames(filters.countries);
    const cityIds = await resolveCityIdsByNames(filters.cities, countryIds);
    let query = db
      .from("carsi_items")
      .select(ITEM_SELECT_COLUMNS)
      .eq("status", "published")
      .eq("moderation_status", "approved")
      .eq("diaspora_key", filters.diasporaKey ?? "tr")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (filters.categoryKey) query = query.eq("category_key", filters.categoryKey);
    if (countryIds.length > 0) query = query.in("country_id", countryIds);
    if (cityIds.length > 0) query = query.in("city_id", cityIds);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as CarsiItemRow[];
    const maps = await fetchReferenceMaps(rows);
    return rows.map((row) => mapItem(row, maps));
  } catch (error: unknown) {
    reportCaddeApiError("listCarsiItems", error);
    return [];
  }
}

/** Kullanıcının kendi ilanları (her durumda — taslak/pasif/süresi dolmuş dahil). */
export async function listMyCarsiItems(userId: string): Promise<CarsiItem[]> {
  if (!isSupabaseConfigured || !userId) return [];

  try {
    const { data, error } = await db
      .from("carsi_items")
      .select(ITEM_SELECT_COLUMNS)
      .eq("owner_user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as CarsiItemRow[];
    const maps = await fetchReferenceMaps(rows);
    return rows.map((row) => mapItem(row, maps));
  } catch (error: unknown) {
    reportCaddeApiError("listMyCarsiItems", error);
    return [];
  }
}

export async function getCarsiItem(itemId: string): Promise<CarsiItem | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await db.from("carsi_items").select(ITEM_SELECT_COLUMNS).eq("id", itemId).is("deleted_at", null).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as CarsiItemRow;
    const maps = await fetchReferenceMaps([row]);
    return mapItem(row, maps);
  } catch (error: unknown) {
    reportCaddeApiError("getCarsiItem", error);
    return null;
  }
}

export async function createCarsiItem(input: CarsiItemCreateInput): Promise<string> {
  const parsed = parseWithUserError(carsiItemCreateSchema, input);
  const { data, error } = await db.rpc("create_carsi_item_v1", {
    p_category_key: parsed.categoryKey,
    p_title: parsed.title,
    p_description: parsed.description,
    p_price_amount: parsed.priceAmount ?? null,
    p_price_currency: parsed.priceCurrency ?? null,
    p_country: parsed.country ?? "",
    p_city: parsed.city ?? "",
    p_image_urls: parsed.imageUrls ?? [],
    p_contact_mode: parsed.contactMode ?? "platform",
    p_diaspora_key: parsed.diasporaKey ?? "tr",
  });
  if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
  return data as string;
}

/** İlan durumu geçişi (yayına al / pasife al) ve alan güncellemeleri. */
export async function updateCarsiItem(input: { itemId: string; title?: string; description?: string; priceAmount?: number; priceCurrency?: string; status?: CarsiItemStatus }): Promise<void> {
  const parsed = parseWithUserError(carsiItemUpdateSchema, input);
  const { error } = await db.rpc("update_carsi_item_v1", {
    p_item_id: parsed.itemId,
    p_title: parsed.title ?? null,
    p_description: parsed.description ?? null,
    p_price_amount: parsed.priceAmount ?? null,
    p_price_currency: parsed.priceCurrency ?? null,
    p_status: parsed.status ?? null,
  });
  if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
}

export async function deleteCarsiItem(itemId: string): Promise<void> {
  const { error } = await db.rpc("delete_carsi_item_v1", { p_item_id: itemId });
  if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
}

export function formatCarsiPrice(item: Pick<CarsiItem, "priceAmount" | "priceCurrency">): string {
  if (item.priceAmount === null || item.priceAmount === undefined) return "Fiyat belirtilmedi";
  if (item.priceAmount === 0) return "Ücretsiz";
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: item.priceCurrency ?? "EUR",
      maximumFractionDigits: 0,
    }).format(item.priceAmount);
  } catch {
    return `${item.priceAmount} ${item.priceCurrency ?? ""}`.trim();
  }
}

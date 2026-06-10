// Cadde admin CRUD API'si — yalnız /admin/cadde tarafından kullanılır.
// Yetki RLS'deki is_admin_user() policy'lerine dayanır; admin işlemleri kullanıcı
// self-service API'sinden (cadde-api.ts) bilinçli olarak ayrı tutulur.

import {
  db,
  resolveCityIdByName,
  resolveCountryIdByName,
} from "./cadde-internal";
import type {
  CaddeAdminBillboardInput,
  CaddeAdminCafeInput,
  CaddeAdminPostInput,
  CaddeAdminSponsoredInput,
  CaddeBillboardRow,
  CaddeCafeRow,
  CaddePostRow,
  CaddeSponsoredRow,
} from "./cadde-types";

export async function listAdminCaddePosts(): Promise<CaddePostRow[]> {
  const { data, error } = await db.from("cadde_posts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CaddePostRow[];
}

export async function saveAdminCaddePost(id: string | null, payload: CaddeAdminPostInput): Promise<CaddePostRow> {
  const countryId = await resolveCountryIdByName(payload.country_id);
  const cityId = await resolveCityIdByName(payload.city_id, countryId);
  const normalizedPayload = { ...payload, country_id: countryId, city_id: cityId };
  if (id) {
    const { data, error } = await db.from("cadde_posts").update(normalizedPayload).eq("id", id).select("*").single();
    if (error) throw error;
    return data as CaddePostRow;
  }
  const { data, error } = await db.from("cadde_posts").insert(normalizedPayload).select("*").single();
  if (error) throw error;
  return data as CaddePostRow;
}

export async function deleteAdminCaddePost(id: string): Promise<void> {
  const { error } = await db.from("cadde_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function listAdminCaddeCafes(): Promise<CaddeCafeRow[]> {
  const { data, error } = await db.from("cadde_cafes").select("*").order("starts_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CaddeCafeRow[];
}

export async function saveAdminCaddeCafe(id: string | null, payload: CaddeAdminCafeInput): Promise<CaddeCafeRow> {
  const countryId = await resolveCountryIdByName(payload.country_id);
  const cityId = await resolveCityIdByName(payload.city_id, countryId);
  const normalizedPayload = { ...payload, country_id: countryId, city_id: cityId };
  if (id) {
    const { data, error } = await db.from("cadde_cafes").update(normalizedPayload).eq("id", id).select("*").single();
    if (error) throw error;
    return data as CaddeCafeRow;
  }
  const { data, error } = await db.from("cadde_cafes").insert(normalizedPayload).select("*").single();
  if (error) throw error;
  return data as CaddeCafeRow;
}

export async function deleteAdminCaddeCafe(id: string): Promise<void> {
  const { error } = await db.from("cadde_cafes").delete().eq("id", id);
  if (error) throw error;
}

export async function listAdminCaddeBillboardCards(): Promise<CaddeBillboardRow[]> {
  const { data, error } = await db.from("cadde_billboard_cards").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CaddeBillboardRow[];
}

export async function saveAdminCaddeBillboardCard(id: string | null, payload: CaddeAdminBillboardInput): Promise<CaddeBillboardRow> {
  const countryId = await resolveCountryIdByName(payload.country_id);
  const cityId = await resolveCityIdByName(payload.city_id, countryId);
  const normalizedPayload = { ...payload, country_id: countryId, city_id: cityId };
  if (id) {
    const { data, error } = await db.from("cadde_billboard_cards").update(normalizedPayload).eq("id", id).select("*").single();
    if (error) throw error;
    return data as CaddeBillboardRow;
  }
  const { data, error } = await db.from("cadde_billboard_cards").insert(normalizedPayload).select("*").single();
  if (error) throw error;
  return data as CaddeBillboardRow;
}

export async function deleteAdminCaddeBillboardCard(id: string): Promise<void> {
  const { error } = await db.from("cadde_billboard_cards").delete().eq("id", id);
  if (error) throw error;
}

export async function listAdminCaddeSponsoredPlacements(): Promise<CaddeSponsoredRow[]> {
  const { data, error } = await db.from("cadde_sponsored_placements").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CaddeSponsoredRow[];
}

export async function saveAdminCaddeSponsoredPlacement(id: string | null, payload: CaddeAdminSponsoredInput): Promise<CaddeSponsoredRow> {
  const countryId = await resolveCountryIdByName(payload.country_id);
  const cityId = await resolveCityIdByName(payload.city_id, countryId);
  const normalizedPayload = { ...payload, country_id: countryId, city_id: cityId };
  if (id) {
    const { data, error } = await db.from("cadde_sponsored_placements").update(normalizedPayload).eq("id", id).select("*").single();
    if (error) throw error;
    return data as CaddeSponsoredRow;
  }
  const { data, error } = await db.from("cadde_sponsored_placements").insert(normalizedPayload).select("*").single();
  if (error) throw error;
  return data as CaddeSponsoredRow;
}

export async function deleteAdminCaddeSponsoredPlacement(id: string): Promise<void> {
  const { error } = await db.from("cadde_sponsored_placements").delete().eq("id", id);
  if (error) throw error;
}

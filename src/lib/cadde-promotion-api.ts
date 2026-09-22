import { isSupabaseConfigured } from "@/integrations/supabase/client";

import { DEMO_BILLBOARDS, DEMO_SPONSORED } from "./cadde-demo-data";
import { db, reportCaddeApiError, resolveCityIdsByNames, resolveCountryIdsByNames } from "./cadde-internal";
import type { CaddeBillboardCard, CaddeBillboardRow, CaddeFilterState, CaddeSponsoredPlacement, CaddeSponsoredRow } from "./cadde-types";

export function mapCaddeBillboardRow(row: CaddeBillboardRow): CaddeBillboardCard {
  return {
    id: row.id,
    type: row.card_type,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    badgeText: row.badge_text,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    imageUrl: row.image_url,
    isFeatured: row.is_featured,
  };
}

export function mapCaddeSponsoredRow(row: CaddeSponsoredRow): CaddeSponsoredPlacement {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    badgeText: row.badge_text,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    imageUrl: row.image_url,
  };
}

export async function listCaddeBillboardCards(filters: CaddeFilterState): Promise<CaddeBillboardCard[]> {
  if (!isSupabaseConfigured || filters.mode === "demo") return DEMO_BILLBOARDS;

  try {
    const countryIds = await resolveCountryIdsByNames(filters.countries);
    const cityIds = await resolveCityIdsByNames(filters.cities, countryIds);
    let query = db
      .from("cadde_billboard_cards")
      .select("id, card_type, title, subtitle, description, badge_text, cta_label, cta_url, image_url, content_mode, status, country_id, city_id, is_featured, sort_order")
      .eq("content_mode", "real")
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true });
    if (countryIds.length > 0) query = query.or(`country_id.is.null,country_id.in.(${countryIds.join(",")})`);
    if (cityIds.length > 0) query = query.or(`city_id.is.null,city_id.in.(${cityIds.join(",")})`);
    const { data, error } = await query;
    if (error) throw error;
    return (data as CaddeBillboardRow[]).map(mapCaddeBillboardRow);
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeBillboardCards", error);
    return [];
  }
}

export async function getCaddeSponsoredPlacement(filters: CaddeFilterState): Promise<CaddeSponsoredPlacement | null> {
  if (!isSupabaseConfigured || filters.mode === "demo") return DEMO_SPONSORED;

  try {
    const countryIds = await resolveCountryIdsByNames(filters.countries);
    const cityIds = await resolveCityIdsByNames(filters.cities, countryIds);
    let query = db
      .from("cadde_sponsored_placements")
      .select("id, placement_key, title, description, badge_text, cta_label, cta_url, image_url, content_mode, status, country_id, city_id, sort_order")
      .eq("content_mode", "real")
      .eq("status", "published")
      .eq("placement_key", "feed-inline")
      .order("sort_order", { ascending: true })
      .limit(1);
    if (countryIds.length > 0) query = query.or(`country_id.is.null,country_id.in.(${countryIds.join(",")})`);
    if (cityIds.length > 0) query = query.or(`city_id.is.null,city_id.in.(${cityIds.join(",")})`);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapCaddeSponsoredRow(data as CaddeSponsoredRow);
  } catch (error: unknown) {
    reportCaddeApiError("getCaddeSponsoredPlacement", error);
    return null;
  }
}

import { isSupabaseConfigured } from "@/integrations/supabase/client";

import { db, caddeWriteError, reportCaddeApiError } from "./cadde-internal";
import type { CaddeInterest, CaddeInterestRow, CaddeMentionSuggestion, CaddeTrendingHashtag } from "./cadde-types";

export async function searchCaddeMentions(query: string, limit = 8): Promise<CaddeMentionSuggestion[]> {
  if (!isSupabaseConfigured || query.trim().length < 2) return [];
  try {
    const { data, error } = await db.rpc("search_cadde_mentions_v1", { p_query: query, p_limit: limit });
    if (error) throw error;
    return Array.isArray(data) ? (data as CaddeMentionSuggestion[]) : [];
  } catch (error: unknown) {
    reportCaddeApiError("searchCaddeMentions", error);
    return [];
  }
}

export type CaddePersonHit = {
  userId: string;
  fullName: string;
  city: string | null;
  country: string | null;
  hasProfile: boolean;
};

export async function searchCaddePeople(query: string, limit = 12): Promise<CaddePersonHit[]> {
  if (!isSupabaseConfigured || query.trim().length < 2) return [];
  try {
    const { data, error } = await db.rpc("search_cadde_people_v1", { p_query: query, p_limit: limit });
    if (error) throw error;
    if (!Array.isArray(data)) return [];
    return (data as Array<Record<string, unknown>>).map((row) => ({
      userId: String(row.user_id),
      fullName: String(row.full_name ?? ""),
      city: (row.city as string | null) ?? null,
      country: (row.country as string | null) ?? null,
      hasProfile: row.has_profile === true,
    }));
  } catch (error: unknown) {
    reportCaddeApiError("searchCaddePeople", error);
    return [];
  }
}

export async function listTrendingCaddeHashtags(limit = 10): Promise<CaddeTrendingHashtag[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await db.rpc("list_trending_cadde_hashtags_v1", { p_limit: limit });
    if (error) throw error;
    return Array.isArray(data) ? (data as CaddeTrendingHashtag[]) : [];
  } catch (error: unknown) {
    reportCaddeApiError("listTrendingCaddeHashtags", error);
    return [];
  }
}

export async function listCaddeInterestCatalog(): Promise<CaddeInterest[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await db
      .from("cadde_interest_catalog")
      .select("key, label_tr, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data as CaddeInterestRow[]).map((row) => ({ key: row.key, labelTr: row.label_tr, sortOrder: row.sort_order }));
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeInterestCatalog", error);
    return [];
  }
}

export async function listMyCaddeInterests(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured || !userId) return [];
  try {
    const { data, error } = await db.from("user_cadde_interests").select("interest_key").eq("user_id", userId);
    if (error) throw error;
    return ((data ?? []) as Array<{ interest_key: string }>).map((row) => row.interest_key);
  } catch (error: unknown) {
    reportCaddeApiError("listMyCaddeInterests", error);
    return [];
  }
}

export async function saveMyCaddeInterests(userId: string, interestKeys: string[]): Promise<void> {
  if (!userId) throw new Error("Bu işlem için giriş yapın.");
  const desired = Array.from(new Set(interestKeys.map((key) => key.trim()).filter(Boolean)));
  const current = await listMyCaddeInterests(userId);
  const toRemove = current.filter((key) => !desired.includes(key));
  const toAdd = desired.filter((key) => !current.includes(key));

  if (toRemove.length > 0) {
    const { error } = await db.from("user_cadde_interests").delete().eq("user_id", userId).in("interest_key", toRemove);
    if (error) throw caddeWriteError("saveMyCaddeInterests", error);
  }
  if (toAdd.length > 0) {
    const { error } = await db.from("user_cadde_interests").insert(toAdd.map((key) => ({ user_id: userId, interest_key: key })));
    if (error) throw caddeWriteError("saveMyCaddeInterests", error);
  }
}

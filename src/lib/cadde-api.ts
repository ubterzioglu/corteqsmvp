// Cadde public API katmanı: okuma sorguları + kullanıcı mutation'ları.
// Kurallar (Cadde 3.0 Faz 1):
//  - Demo veri yalnız mode==='demo' veya Supabase yapılandırılmamışken döner.
//  - Real moddaki hatalar reportCaddeApiError ile raporlanır ve BOŞ sonuç döner — sessiz demo fallback yok.
//  - Mutation girdileri Zod şemalarından geçer.
// Faz 2'de mutation'lar security-definer RPC'lere taşınacak.

import { isSupabaseConfigured } from "@/integrations/supabase/client";

import {
  DEMO_BILLBOARDS,
  DEMO_CAFES,
  DEMO_CITIES,
  DEMO_COUNTRIES,
  DEMO_POSTS,
  DEMO_SPONSORED,
} from "./cadde-demo-data";
import {
  CADDE_PAGE_SIZE,
  FALLBACK_PROFILE_NAME,
  db,
  reportCaddeApiError,
  resolveCityIdsByNames,
  resolveCountryIdsByNames,
} from "./cadde-internal";
import { resolveCaddeRpcErrorMessage } from "./cadde-rules";
import {
  caddeCafeJoinSchema,
  caddeCommentCreateSchema,
  caddePostCreateSchema,
  caddeReactionSchema,
  parseWithUserError,
} from "./cadde-schemas";
import { validatePostInterests } from "./cadde-targeting";
import type {
  CaddeBillboardCard,
  CaddeBillboardRow,
  CaddeCafe,
  CaddeCafeMemberRow,
  CaddeCafeRow,
  CaddeCity,
  CaddeCityRow,
  CaddeCommentRow,
  CaddeContentMode,
  CaddeCountry,
  CaddeCountryRow,
  CaddeFeedCursor,
  CaddeFeedPage,
  CaddeFeedPageParam,
  CaddeFeedRpcItem,
  CaddeFilterState,
  CaddeInterest,
  CaddeInterestRow,
  CaddePost,
  CaddePostInput,
  CaddeReactionRow,
  CaddeReactionType,
  CaddeSponsoredPlacement,
  CaddeSponsoredRow,
} from "./cadde-types";

const emptyReactions = (): Record<CaddeReactionType, number> => ({ like: 0, support: 0, idea: 0 });

function applyDemoFilters<T extends { country: string | null; city: string | null; isBridge: boolean; mode: CaddeContentMode }>(
  items: T[],
  filters: CaddeFilterState,
): T[] {
  return items.filter((item) => {
    if (item.mode !== filters.mode) return false;
    if (filters.bridge && !item.isBridge) return false;
    if (filters.countries.length && (!item.country || !filters.countries.includes(item.country))) return false;
    if (filters.cities.length && (!item.city || !filters.cities.includes(item.city))) return false;
    return true;
  });
}

export async function listCaddeCountries(): Promise<CaddeCountry[]> {
  if (!isSupabaseConfigured) return DEMO_COUNTRIES;

  try {
    const { data, error } = await db.from("cadde_countries").select("id, code, name, sort_order").eq("is_active", true).order("sort_order", { ascending: true });
    if (error) throw error;
    return (data as CaddeCountryRow[]).map((row) => ({ id: row.id, code: row.code, name: row.name }));
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeCountries", error);
    return [];
  }
}

/** Seçili ülkelerin şehirleri (boş liste = tüm aktif şehirler). Alfabetik (tr) sıralı döner. */
export async function listCaddeCities(countryNames: string[] = []): Promise<CaddeCity[]> {
  const sortAlphabetically = (cities: CaddeCity[]): CaddeCity[] =>
    [...cities].sort((left, right) => left.name.localeCompare(right.name, "tr"));

  if (!isSupabaseConfigured) {
    if (countryNames.length === 0) return sortAlphabetically(DEMO_CITIES);
    const countryIds = new Set(
      DEMO_COUNTRIES.filter((country) => countryNames.includes(country.name)).map((country) => country.id),
    );
    return sortAlphabetically(DEMO_CITIES.filter((city) => countryIds.has(city.countryId)));
  }

  try {
    const countryIds = await resolveCountryIdsByNames(countryNames);
    let query = db.from("cadde_cities").select("id, country_id, name, timezone, sort_order").eq("is_active", true);
    if (countryIds.length > 0) query = query.in("country_id", countryIds);
    const { data, error } = await query;
    if (error) throw error;
    return sortAlphabetically(
      (data as CaddeCityRow[]).map((row) => ({ id: row.id, countryId: row.country_id, name: row.name, timezone: row.timezone })),
    );
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeCities", error);
    return [];
  }
}

/**
 * Feed okuma (Faz 3): real mod list_cadde_feed_v1 RPC'sinden gelir — band/skor/deterministik
 * random ve stabil cursor pagination DB'de hesaplanır (TS aynası: cadde-ranking.ts).
 * Demo mod istemci tarafında sayfa numarasıyla çalışmaya devam eder.
 */
export async function listCaddeFeed(filters: CaddeFilterState, pageParam: CaddeFeedPageParam, currentUserId: string | null): Promise<CaddeFeedPage> {
  if (!isSupabaseConfigured || filters.mode === "demo") {
    const page = typeof pageParam === "number" ? pageParam : 1;
    const filtered = applyDemoFilters(DEMO_POSTS, filters);
    const start = (page - 1) * CADDE_PAGE_SIZE;
    const items = filtered.slice(start, start + CADDE_PAGE_SIZE);
    return { items, nextPage: start + CADDE_PAGE_SIZE < filtered.length ? page + 1 : null };
  }

  try {
    const cursor = pageParam !== null && typeof pageParam === "object" ? pageParam : null;
    const { data, error } = await db.rpc("list_cadde_feed_v1", {
      p_filters: {
        countries: filters.countries,
        cities: filters.cities,
        bridge: filters.bridge,
      },
      p_cursor: cursor,
      p_limit: CADDE_PAGE_SIZE,
    });
    if (error) throw error;

    const payload = (data ?? { items: [], nextCursor: null }) as { items: CaddeFeedRpcItem[]; nextCursor: CaddeFeedCursor | null };
    const rows = payload.items ?? [];
    const [reactions, comments, authorNames] = await Promise.all([
      fetchPostReactions(rows.map((row) => row.id)),
      fetchPostComments(rows.map((row) => row.id)),
      fetchUserNameMap(rows.map((row) => row.author_user_id).filter(Boolean) as string[], currentUserId ? [currentUserId] : []),
    ]);

    const items = rows.map((row) => mapRpcPost(row, reactions, comments, authorNames, currentUserId));
    return { items, nextPage: payload.nextCursor ?? null };
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeFeed", error);
    return { items: [], nextPage: null };
  }
}

async function fetchCountryMap(): Promise<Map<string, string>> {
  const { data } = await db.from("cadde_countries").select("id, name");
  return new Map<string, string>((data ?? []).map((row: { id: string; name: string }) => [row.id, row.name]));
}

async function fetchCityMap(): Promise<Map<string, string>> {
  const { data } = await db.from("cadde_cities").select("id, name");
  return new Map<string, string>((data ?? []).map((row: { id: string; name: string }) => [row.id, row.name]));
}

async function fetchUserNameMap(authorIds: string[], extraUserIds: string[] = []): Promise<Map<string, string>> {
  const allIds = Array.from(new Set([...authorIds, ...extraUserIds].filter(Boolean)));
  if (allIds.length === 0) return new Map<string, string>();
  const { data } = await db
    .from("user_profile_attributes")
    .select("user_id, value_text, afs_attributes!inner(key)")
    .in("user_id", allIds)
    .eq("afs_attributes.key", "full_name");
  const rows = (data ?? []) as Array<{ user_id: string; value_text: string | null }>;
  return new Map<string, string>(rows.map((row) => [row.user_id, row.value_text ?? FALLBACK_PROFILE_NAME]));
}

async function fetchPostReactions(postIds: string[]): Promise<CaddeReactionRow[]> {
  if (postIds.length === 0) return [];
  const { data } = await db.from("cadde_post_reactions").select("id, post_id, user_id, reaction_type").in("post_id", postIds);
  return (data ?? []) as CaddeReactionRow[];
}

type CommentWithAuthor = CaddeCommentRow & { author_name: string };

async function fetchPostComments(postIds: string[]): Promise<CommentWithAuthor[]> {
  if (postIds.length === 0) return [];
  const { data, error } = await db.from("cadde_post_comments").select("id, post_id, user_id, body, created_at").in("post_id", postIds).order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as CaddeCommentRow[];
  const userMap = await fetchUserNameMap(rows.map((row) => row.user_id));
  return rows.map((row) => ({ ...row, author_name: userMap.get(row.user_id) ?? FALLBACK_PROFILE_NAME }));
}

function mapRpcPost(
  row: CaddeFeedRpcItem,
  reactions: CaddeReactionRow[],
  comments: CommentWithAuthor[],
  authorNames: Map<string, string>,
  currentUserId: string | null,
): CaddePost {
  const postReactions = reactions.filter((reaction) => reaction.post_id === row.id);
  const postComments = comments.filter((comment) => comment.post_id === row.id);
  const reactionCounts = emptyReactions();

  for (const reaction of postReactions) {
    reactionCounts[reaction.reaction_type] += 1;
  }

  return {
    id: row.id,
    mode: row.content_mode,
    type: row.post_type,
    title: row.title,
    body: row.body,
    authorName: row.author_name_override ?? (row.author_user_id ? authorNames.get(row.author_user_id) ?? FALLBACK_PROFILE_NAME : FALLBACK_PROFILE_NAME),
    authorRole: row.author_role,
    authorAvatarUrl: row.author_avatar_url,
    authorUserId: row.author_user_id,
    country: row.country_name,
    city: row.city_name,
    isBridge: row.is_bridge,
    pinned: row.pinned,
    createdAt: row.created_at,
    needCategory: row.need_category,
    interests: row.interests ?? [],
    reactionCounts,
    totalReactionCount: reactionCounts.like + reactionCounts.support + reactionCounts.idea,
    commentCount: postComments.length,
    comments: postComments.map((comment) => ({
      id: comment.id,
      postId: comment.post_id,
      userId: comment.user_id,
      body: comment.body,
      authorName: comment.author_name,
      createdAt: comment.created_at,
    })),
    viewerReactions: currentUserId ? postReactions.filter((reaction) => reaction.user_id === currentUserId).map((reaction) => reaction.reaction_type) : [],
  };
}

export async function listCaddeCafes(filters: CaddeFilterState, currentUserId: string | null): Promise<CaddeCafe[]> {
  if (!isSupabaseConfigured || filters.mode === "demo") {
    return applyDemoFilters(DEMO_CAFES, filters);
  }

  try {
    const countryIds = await resolveCountryIdsByNames(filters.countries);
    const cityIds = await resolveCityIdsByNames(filters.cities, countryIds);
    let query = db
      .from("cadde_cafes")
      .select("id, host_user_id, host_name_override, title, summary, country_id, city_id, content_mode, status, is_bridge, is_free, starts_at, ends_at, is_active, created_at")
      .eq("content_mode", "real")
      .eq("status", "published")
      .eq("is_active", true)
      .order("starts_at", { ascending: true });
    if (filters.bridge) query = query.eq("is_bridge", true);
    if (countryIds.length > 0) query = query.in("country_id", countryIds);
    if (cityIds.length > 0) query = query.in("city_id", cityIds);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as CaddeCafeRow[];
    const [countries, cities, members, hosts] = await Promise.all([
      fetchCountryMap(),
      fetchCityMap(),
      fetchCafeMembers(rows.map((row) => row.id)),
      fetchUserNameMap(rows.map((row) => row.host_user_id).filter(Boolean) as string[]),
    ]);
    return rows.map((row) => mapCafe(row, countries, cities, members, hosts, currentUserId));
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeCafes", error);
    return [];
  }
}

async function fetchCafeMembers(cafeIds: string[]): Promise<CaddeCafeMemberRow[]> {
  if (cafeIds.length === 0) return [];
  const { data } = await db.from("cadde_cafe_members").select("id, cafe_id, user_id").in("cafe_id", cafeIds);
  return (data ?? []) as CaddeCafeMemberRow[];
}

function mapCafe(
  row: CaddeCafeRow,
  countries: Map<string, string>,
  cities: Map<string, string>,
  members: CaddeCafeMemberRow[],
  hosts: Map<string, string>,
  currentUserId: string | null,
): CaddeCafe {
  const cafeMembers = members.filter((member) => member.cafe_id === row.id);
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    hostName: row.host_name_override ?? (row.host_user_id ? hosts.get(row.host_user_id) ?? FALLBACK_PROFILE_NAME : FALLBACK_PROFILE_NAME),
    country: row.country_id ? countries.get(row.country_id) ?? null : null,
    city: row.city_id ? cities.get(row.city_id) ?? null : null,
    isBridge: row.is_bridge,
    isFree: row.is_free,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
    memberCount: cafeMembers.length,
    joinedByViewer: currentUserId ? cafeMembers.some((member) => member.user_id === currentUserId) : false,
    mode: row.content_mode,
  };
}

export async function listCaddeBillboardCards(filters: CaddeFilterState): Promise<CaddeBillboardCard[]> {
  if (!isSupabaseConfigured || filters.mode === "demo") {
    return DEMO_BILLBOARDS;
  }

  try {
    const countryIds = await resolveCountryIdsByNames(filters.countries);
    const cityIds = await resolveCityIdsByNames(filters.cities, countryIds);
    let query = db
      .from("cadde_billboard_cards")
      .select("id, card_type, title, subtitle, description, badge_text, cta_label, cta_url, image_url, content_mode, status, country_id, city_id, is_featured, sort_order")
      .eq("content_mode", "real")
      .eq("status", "published")
      .order("sort_order", { ascending: true });
    if (countryIds.length > 0) query = query.or(`country_id.is.null,country_id.in.(${countryIds.join(",")})`);
    if (cityIds.length > 0) query = query.or(`city_id.is.null,city_id.in.(${cityIds.join(",")})`);
    const { data, error } = await query;
    if (error) throw error;
    return (data as CaddeBillboardRow[]).map((row) => ({
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
    }));
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeBillboardCards", error);
    return [];
  }
}

export async function getCaddeSponsoredPlacement(filters: CaddeFilterState): Promise<CaddeSponsoredPlacement | null> {
  if (!isSupabaseConfigured || filters.mode === "demo") {
    return DEMO_SPONSORED;
  }

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
    const row = data as CaddeSponsoredRow;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      badgeText: row.badge_text,
      ctaLabel: row.cta_label,
      ctaUrl: row.cta_url,
      imageUrl: row.image_url,
    };
  } catch (error: unknown) {
    reportCaddeApiError("getCaddeSponsoredPlacement", error);
    return null;
  }
}

/**
 * Post oluşturma artık security-definer RPC üzerinden yapılır (Faz 2);
 * profil kapısı, Köprü ve TR kapsam kuralları DB'de enforce edilir.
 * Direct insert RLS'de kapalıdır.
 */
export async function createCaddePost(input: CaddePostInput): Promise<string> {
  const parsed = parseWithUserError(caddePostCreateSchema, input);
  const interests = validatePostInterests(parsed.interests ?? []);
  const needCategory = parsed.needCategory?.trim() || interests[0] || null;
  const { data, error } = await db.rpc("create_cadde_post_v1", {
    p_post_type: parsed.type,
    p_title: parsed.title?.trim() || null,
    p_body: parsed.body,
    p_country: parsed.countryId ?? "",
    p_city: parsed.cityId ?? "",
    p_is_bridge: parsed.isBridge,
    p_need_category: needCategory,
    p_interests: interests,
  });
  if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
  return data as string;
}

// ── İlgi alanları (Faz 3 / spec §12) ─────────────────────────────────────────

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

/** Kullanıcının ilgi alanı setini hedef listeyle eşitler (eksikleri ekler, fazlaları siler). */
export async function saveMyCaddeInterests(userId: string, interestKeys: string[]): Promise<void> {
  if (!userId) throw new Error("Bu işlem için giriş yapın.");
  const desired = Array.from(new Set(interestKeys.map((key) => key.trim()).filter(Boolean)));

  const current = await listMyCaddeInterests(userId);
  const toRemove = current.filter((key) => !desired.includes(key));
  const toAdd = desired.filter((key) => !current.includes(key));

  if (toRemove.length > 0) {
    const { error } = await db.from("user_cadde_interests").delete().eq("user_id", userId).in("interest_key", toRemove);
    if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
  }

  if (toAdd.length > 0) {
    const { error } = await db.from("user_cadde_interests").insert(toAdd.map((key) => ({ user_id: userId, interest_key: key })));
    if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
  }
}

export async function toggleCaddeReaction(postId: string, userId: string, reactionType: CaddeReactionType, currentlyActive: boolean): Promise<void> {
  const parsed = parseWithUserError(caddeReactionSchema, { postId, reactionType });
  if (currentlyActive) {
    const { error } = await db.from("cadde_post_reactions").delete().eq("post_id", parsed.postId).eq("user_id", userId).eq("reaction_type", parsed.reactionType);
    if (error) throw error;
    return;
  }

  const { error } = await db.from("cadde_post_reactions").insert({
    post_id: parsed.postId,
    user_id: userId,
    reaction_type: parsed.reactionType,
  });
  if (error) throw error;
}

export async function createCaddeComment(postId: string, userId: string, body: string): Promise<void> {
  const parsed = parseWithUserError(caddeCommentCreateSchema, { postId, body });
  const { error } = await db.from("cadde_post_comments").insert({
    post_id: parsed.postId,
    user_id: userId,
    body: parsed.body,
  });
  if (error) throw error;
}

export async function joinCaddeCafe(cafeId: string, userId: string): Promise<void> {
  const parsed = parseWithUserError(caddeCafeJoinSchema, { cafeId });
  const { error } = await db.from("cadde_cafe_members").upsert(
    { cafe_id: parsed.cafeId, user_id: userId },
    { onConflict: "cafe_id,user_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

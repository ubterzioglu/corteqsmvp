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
  resolveCityIdByName,
  resolveCountryIdByName,
} from "./cadde-internal";
import {
  caddeCafeJoinSchema,
  caddeCommentCreateSchema,
  caddePostCreateSchema,
  caddeReactionSchema,
  parseWithUserError,
} from "./cadde-schemas";
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
  CaddeFeedPage,
  CaddeFilterState,
  CaddePost,
  CaddePostInput,
  CaddePostRow,
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
    if (filters.country && item.country !== filters.country) return false;
    if (filters.city && item.city !== filters.city) return false;
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

export async function listCaddeCities(countryName = ""): Promise<CaddeCity[]> {
  if (!isSupabaseConfigured) {
    if (!countryName) return DEMO_CITIES;
    const match = DEMO_COUNTRIES.find((country) => country.name === countryName);
    return match ? DEMO_CITIES.filter((city) => city.countryId === match.id) : [];
  }

  try {
    const countryId = await resolveCountryIdByName(countryName);
    let query = db.from("cadde_cities").select("id, country_id, name, timezone, sort_order").eq("is_active", true).order("sort_order", { ascending: true });
    if (countryId) query = query.eq("country_id", countryId);
    const { data, error } = await query;
    if (error) throw error;
    return (data as CaddeCityRow[]).map((row) => ({ id: row.id, countryId: row.country_id, name: row.name, timezone: row.timezone }));
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeCities", error);
    return [];
  }
}

export async function listCaddeFeed(filters: CaddeFilterState, page: number, currentUserId: string | null): Promise<CaddeFeedPage> {
  if (!isSupabaseConfigured || filters.mode === "demo") {
    const filtered = applyDemoFilters(DEMO_POSTS, filters);
    const start = (page - 1) * CADDE_PAGE_SIZE;
    const items = filtered.slice(start, start + CADDE_PAGE_SIZE);
    return { items, nextPage: start + CADDE_PAGE_SIZE < filtered.length ? page + 1 : null };
  }

  try {
    const countryId = await resolveCountryIdByName(filters.country);
    const cityId = await resolveCityIdByName(filters.city, countryId);
    let query = db
      .from("cadde_posts")
      .select("id, author_user_id, author_name_override, author_role, author_avatar_url, content_mode, status, post_type, title, body, country_id, city_id, is_bridge, pinned, created_at")
      .eq("status", "published")
      .eq("content_mode", "real")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .range((page - 1) * CADDE_PAGE_SIZE, page * CADDE_PAGE_SIZE - 1);

    if (filters.bridge) query = query.eq("is_bridge", true);
    if (countryId) query = query.eq("country_id", countryId);
    if (cityId) query = query.eq("city_id", cityId);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as CaddePostRow[];
    const [countries, cities, reactions, comments, authorNames] = await Promise.all([
      fetchCountryMap(),
      fetchCityMap(),
      fetchPostReactions(rows.map((row) => row.id)),
      fetchPostComments(rows.map((row) => row.id)),
      fetchUserNameMap(rows.map((row) => row.author_user_id).filter(Boolean) as string[], currentUserId ? [currentUserId] : []),
    ]);

    const items = rows.map((row) => mapPost(row, countries, cities, reactions, comments, authorNames, currentUserId));
    return { items, nextPage: rows.length === CADDE_PAGE_SIZE ? page + 1 : null };
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

function mapPost(
  row: CaddePostRow,
  countries: Map<string, string>,
  cities: Map<string, string>,
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
    country: row.country_id ? countries.get(row.country_id) ?? null : null,
    city: row.city_id ? cities.get(row.city_id) ?? null : null,
    isBridge: row.is_bridge,
    pinned: row.pinned,
    createdAt: row.created_at,
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
    const countryId = await resolveCountryIdByName(filters.country);
    const cityId = await resolveCityIdByName(filters.city, countryId);
    let query = db
      .from("cadde_cafes")
      .select("id, host_user_id, host_name_override, title, summary, country_id, city_id, content_mode, status, is_bridge, is_free, starts_at, ends_at, is_active, created_at")
      .eq("content_mode", "real")
      .eq("status", "published")
      .eq("is_active", true)
      .order("starts_at", { ascending: true });
    if (filters.bridge) query = query.eq("is_bridge", true);
    if (countryId) query = query.eq("country_id", countryId);
    if (cityId) query = query.eq("city_id", cityId);
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
    const countryId = await resolveCountryIdByName(filters.country);
    const cityId = await resolveCityIdByName(filters.city, countryId);
    let query = db
      .from("cadde_billboard_cards")
      .select("id, card_type, title, subtitle, description, badge_text, cta_label, cta_url, image_url, content_mode, status, country_id, city_id, is_featured, sort_order")
      .eq("content_mode", "real")
      .eq("status", "published")
      .order("sort_order", { ascending: true });
    if (countryId) query = query.or(`country_id.is.null,country_id.eq.${countryId}`);
    if (cityId) query = query.or(`city_id.is.null,city_id.eq.${cityId}`);
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
    const countryId = await resolveCountryIdByName(filters.country);
    const cityId = await resolveCityIdByName(filters.city, countryId);
    let query = db
      .from("cadde_sponsored_placements")
      .select("id, placement_key, title, description, badge_text, cta_label, cta_url, image_url, content_mode, status, country_id, city_id, sort_order")
      .eq("content_mode", "real")
      .eq("status", "published")
      .eq("placement_key", "feed-inline")
      .order("sort_order", { ascending: true })
      .limit(1);
    if (countryId) query = query.or(`country_id.is.null,country_id.eq.${countryId}`);
    if (cityId) query = query.or(`city_id.is.null,city_id.eq.${cityId}`);
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

export async function createCaddePost(input: CaddePostInput, userId: string): Promise<void> {
  const parsed = parseWithUserError(caddePostCreateSchema, input);
  const countryId = await resolveCountryIdByName(parsed.countryId ?? "");
  const cityId = await resolveCityIdByName(parsed.cityId ?? "", countryId);
  const payload = {
    author_user_id: userId,
    content_mode: "real" as const,
    status: "published" as const,
    post_type: parsed.type,
    title: parsed.title?.trim() || null,
    body: parsed.body,
    country_id: countryId,
    city_id: cityId,
    is_bridge: parsed.isBridge,
  };
  const { error } = await db.from("cadde_posts").insert(payload);
  if (error) throw error;
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

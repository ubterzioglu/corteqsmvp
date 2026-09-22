import { isSupabaseConfigured } from "@/integrations/supabase/client";

import { DEMO_CITIES, DEMO_COUNTRIES, DEMO_POSTS } from "./cadde-demo-data";
import {
  CADDE_PAGE_SIZE,
  FALLBACK_PROFILE_NAME,
  db,
  caddeReadError,
  reportCaddeApiError,
  resolveCountryIdsByNames,
} from "./cadde-internal";
import { normalizeCaddeMedia } from "./cadde-media";
import { CADDE_REACTION_TYPES } from "./cadde-types";
import type {
  CaddeCity,
  CaddeCityRow,
  CaddeContentMode,
  CaddeCountry,
  CaddeCountryRow,
  CaddeFeedCursor,
  CaddeFeedPage,
  CaddeFeedPageParam,
  CaddeFeedRpcItem,
  CaddeFilterState,
  CaddeHashtag,
  CaddeMentionTargetType,
  CaddePost,
  CaddePostMention,
  CaddeReactionRow,
  CaddeReactionType,
} from "./cadde-types";

const emptyReactions = (): Record<CaddeReactionType, number> =>
  Object.fromEntries(CADDE_REACTION_TYPES.map((reactionType) => [reactionType, 0])) as Record<CaddeReactionType, number>;

function stripEagerComments(post: CaddePost): CaddePost {
  return { ...post, commentCount: post.commentCount, shareCount: post.shareCount, comments: [] };
}

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

export async function listCaddeCities(countryNames: string[] = []): Promise<CaddeCity[]> {
  const sortAlphabetically = (cities: CaddeCity[]): CaddeCity[] => [...cities].sort((left, right) => left.name.localeCompare(right.name, "tr"));

  if (!isSupabaseConfigured) {
    if (countryNames.length === 0) return sortAlphabetically(DEMO_CITIES);
    const countryIds = new Set(DEMO_COUNTRIES.filter((country) => countryNames.includes(country.name)).map((country) => country.id));
    return sortAlphabetically(DEMO_CITIES.filter((city) => countryIds.has(city.countryId)));
  }

  try {
    const countryIds = await resolveCountryIdsByNames(countryNames);
    let query = db.from("cadde_cities").select("id, country_id, name, timezone, sort_order").eq("is_active", true);
    if (countryIds.length > 0) query = query.in("country_id", countryIds);
    const { data, error } = await query;
    if (error) throw error;
    return sortAlphabetically((data as CaddeCityRow[]).map((row) => ({ id: row.id, countryId: row.country_id, name: row.name, timezone: row.timezone })));
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeCities", error);
    return [];
  }
}

export async function listCaddeFeed(filters: CaddeFilterState, pageParam: CaddeFeedPageParam, currentUserId: string | null, diasporaKey = "tr"): Promise<CaddeFeedPage> {
  if (!isSupabaseConfigured || filters.mode === "demo") {
    const page = typeof pageParam === "number" ? pageParam : 1;
    const filtered = applyDemoFilters(DEMO_POSTS, filters);
    const start = (page - 1) * CADDE_PAGE_SIZE;
    const items = filtered.slice(start, start + CADDE_PAGE_SIZE).map(stripEagerComments);
    return { items, nextPage: start + CADDE_PAGE_SIZE < filtered.length ? page + 1 : null };
  }

  try {
    const cursor = pageParam !== null && typeof pageParam === "object" ? pageParam : null;
    const { data, error } = await db.rpc("list_cadde_feed_v1", {
      p_filters: { countries: filters.countries, cities: filters.cities, bridge: filters.bridge, diaspora: diasporaKey, hashtag: filters.hashtag, scope: filters.scope },
      p_cursor: cursor,
      p_limit: CADDE_PAGE_SIZE,
    });
    if (error) throw error;

    const payload = (data ?? { items: [], nextCursor: null }) as { items: CaddeFeedRpcItem[]; nextCursor: CaddeFeedCursor | null };
    const rows = payload.items ?? [];
    const postIds = rows.map((row) => row.id);
    const [reactions, shareCounts, authorNames] = await Promise.all([
      fetchPostReactions(postIds),
      fetchPostShareCounts(postIds),
      fetchUserNameMap(rows.map((row) => row.author_user_id).filter(Boolean) as string[], currentUserId ? [currentUserId] : []),
    ]);
    return { items: rows.map((row) => mapRpcPost(row, reactions, shareCounts, authorNames, currentUserId)), nextPage: payload.nextCursor ?? null };
  } catch (error: unknown) {
    throw caddeReadError("listCaddeFeed", error);
  }
}

async function fetchPostShareCounts(postIds: string[]): Promise<Map<string, number>> {
  if (postIds.length === 0) return new Map();
  const { data } = await db.from("cadde_posts").select("id, share_count").in("id", postIds);
  return new Map<string, number>(((data ?? []) as Array<{ id: string; share_count: number | null }>).map((row) => [row.id, row.share_count ?? 0]));
}

async function fetchUserNameMap(authorIds: string[], extraUserIds: string[] = []): Promise<Map<string, string>> {
  const allIds = Array.from(new Set([...authorIds, ...extraUserIds].filter(Boolean)));
  if (allIds.length === 0) return new Map<string, string>();
  const { data } = await db.from("user_profile_attributes").select("user_id, value_text, afs_attributes!inner(key)").in("user_id", allIds).eq("afs_attributes.key", "full_name");
  const rows = (data ?? []) as Array<{ user_id: string; value_text: string | null }>;
  return new Map<string, string>(rows.map((row) => [row.user_id, row.value_text ?? FALLBACK_PROFILE_NAME]));
}

async function fetchPostReactions(postIds: string[]): Promise<CaddeReactionRow[]> {
  if (postIds.length === 0) return [];
  const { data } = await db.from("cadde_post_reactions").select("id, post_id, user_id, reaction_type").in("post_id", postIds);
  return (data ?? []) as CaddeReactionRow[];
}

export function normalizeCaddeHashtagRows(raw: unknown): CaddeHashtag[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (entry === null || typeof entry !== "object") return [];
    const value = entry as Record<string, unknown>;
    return typeof value.tag === "string" && value.tag ? [{ tag: value.tag, displayTag: typeof value.displayTag === "string" ? value.displayTag : value.tag }] : [];
  });
}

export function normalizeCaddeMentionRows(raw: unknown): CaddePostMention[] {
  if (!Array.isArray(raw)) return [];
  const allowed: CaddeMentionTargetType[] = ["user", "catalog_item", "cafe", "carsi_item"];
  return raw.flatMap((entry) => {
    if (entry === null || typeof entry !== "object") return [];
    const value = entry as Record<string, unknown>;
    const type = value.type as CaddeMentionTargetType;
    return allowed.includes(type) && typeof value.id === "string" ? [{ type, id: value.id, label: typeof value.label === "string" ? value.label : null }] : [];
  });
}

function mapRpcPost(row: CaddeFeedRpcItem, reactions: CaddeReactionRow[], shareCounts: Map<string, number>, authorNames: Map<string, string>, currentUserId: string | null): CaddePost {
  const postReactions = reactions.filter((reaction) => reaction.post_id === row.id);
  const reactionCounts = emptyReactions();
  for (const reaction of postReactions) reactionCounts[reaction.reaction_type] += 1;
  return {
    id: row.id, mode: row.content_mode, type: row.post_type, title: row.title, body: row.body,
    authorName: row.author_name_override ?? (row.author_user_id ? authorNames.get(row.author_user_id) ?? FALLBACK_PROFILE_NAME : FALLBACK_PROFILE_NAME),
    authorRole: row.author_role, authorAvatarUrl: row.author_avatar_url, authorUserId: row.author_user_id,
    country: row.country_name, city: row.city_name, isBridge: row.is_bridge, pinned: row.pinned, createdAt: row.created_at,
    needCategory: row.need_category, interests: row.interests ?? [], hashtags: normalizeCaddeHashtagRows(row.hashtags), mentions: normalizeCaddeMentionRows(row.mentions), media: normalizeCaddeMedia(row.media),
    reactionCounts, totalReactionCount: CADDE_REACTION_TYPES.reduce((sum, reactionType) => sum + reactionCounts[reactionType], 0),
    commentCount: row.comment_count ?? 0, shareCount: shareCounts.get(row.id) ?? row.share_count ?? 0, comments: [],
    viewerReactions: currentUserId ? postReactions.filter((reaction) => reaction.user_id === currentUserId).map((reaction) => reaction.reaction_type) : [],
  };
}

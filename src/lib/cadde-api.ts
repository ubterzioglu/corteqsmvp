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
import { normalizeCaddeMedia } from "./cadde-media";
import { moderateCaddeCafeName, resolveCaddeRpcErrorMessage } from "./cadde-rules";
import {
  caddeCafeCreateSchema,
  caddeCafeJoinInputSchema,
  caddeCommentCreateSchema,
  caddePostCreateSchema,
  caddeReactionSchema,
  caddeShareSchema,
  parseWithUserError,
} from "./cadde-schemas";
import { validatePostInterests } from "./cadde-targeting";
import { CADDE_REACTION_TYPES } from "./cadde-types";
import type {
  CaddeBillboardCard,
  CaddeBillboardRow,
  CaddeCafe,
  CaddeCafeCreateInput,
  CaddeCafeJoinResult,
  CaddeCafeMember,
  CaddeCafeMemberRow,
  CaddeCafeRow,
  CaddeCity,
  CaddeCityRow,
  CaddeComment,
  CaddeCommentCursor,
  CaddeCommentPage,
  CaddeCommentRow,
  CaddeContentMode,
  CaddeCountry,
  CaddeCountryRow,
  CaddeFeedCursor,
  CaddeFeedPage,
  CaddeFeedPageParam,
  CaddeFeedRpcItem,
  CaddeFilterState,
  CaddeHashtag,
  CaddeInterest,
  CaddeInterestRow,
  CaddeMentionSuggestion,
  CaddeMentionTargetType,
  CaddePost,
  CaddePostInput,
  CaddePostMention,
  CaddeTrendingHashtag,
  CaddeReactionRow,
  CaddeReactionType,
  CaddeSponsoredPlacement,
  CaddeSponsoredRow,
} from "./cadde-types";

const emptyReactions = (): Record<CaddeReactionType, number> =>
  Object.fromEntries(CADDE_REACTION_TYPES.map((reactionType) => [reactionType, 0])) as Record<CaddeReactionType, number>;

function stripEagerComments(post: CaddePost): CaddePost {
  return {
    ...post,
    commentCount: post.commentCount,
    shareCount: post.shareCount,
    comments: [],
  };
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
      p_filters: {
        countries: filters.countries,
        cities: filters.cities,
        bridge: filters.bridge,
        diaspora: diasporaKey,
        hashtag: filters.hashtag,
        scope: filters.scope,
      },
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

    const items = rows.map((row) => mapRpcPost(row, reactions, new Map(), shareCounts, [], authorNames, currentUserId));
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

async function fetchPostShareCounts(postIds: string[]): Promise<Map<string, number>> {
  if (postIds.length === 0) return new Map();
  const { data } = await db.from("cadde_posts").select("id, share_count").in("id", postIds);
  return new Map<string, number>(
    ((data ?? []) as Array<{ id: string; share_count: number | null }>).map((row) => [row.id, row.share_count ?? 0]),
  );
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

function countCommentsByPost(comments: Array<{ post_id: string }>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const comment of comments) {
    counts.set(comment.post_id, (counts.get(comment.post_id) ?? 0) + 1);
  }
  return counts;
}

async function fetchPostComments(postIds: string[]): Promise<CommentWithAuthor[]> {
  if (postIds.length === 0) return [];
  const { data, error } = await db.from("cadde_post_comments").select("id, post_id, user_id, body, created_at").in("post_id", postIds).order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as CaddeCommentRow[];
  const userMap = await fetchUserNameMap(rows.map((row) => row.user_id));
  return rows.map((row) => ({ ...row, author_name: userMap.get(row.user_id) ?? FALLBACK_PROFILE_NAME }));
}

/** RPC'den gelen hashtag jsonb'sini güvenli daraltır — bozuk kayıt kartı düşürmemeli. */
function normalizeHashtagRows(raw: unknown): CaddeHashtag[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (entry === null || typeof entry !== "object") return [];
    const value = entry as Record<string, unknown>;
    if (typeof value.tag !== "string" || !value.tag) return [];
    return [{ tag: value.tag, displayTag: typeof value.displayTag === "string" ? value.displayTag : value.tag }];
  });
}

function normalizeMentionRows(raw: unknown): CaddePostMention[] {
  if (!Array.isArray(raw)) return [];
  const allowed: CaddeMentionTargetType[] = ["user", "catalog_item", "cafe", "carsi_item"];
  return raw.flatMap((entry) => {
    if (entry === null || typeof entry !== "object") return [];
    const value = entry as Record<string, unknown>;
    const type = value.type as CaddeMentionTargetType;
    if (!allowed.includes(type) || typeof value.id !== "string") return [];
    return [{ type, id: value.id, label: typeof value.label === "string" ? value.label : null }];
  });
}

function mapRpcPost(
  row: CaddeFeedRpcItem,
  reactions: CaddeReactionRow[],
  commentCounts: Map<string, number>,
  shareCounts: Map<string, number>,
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
    hashtags: normalizeHashtagRows(row.hashtags),
    mentions: normalizeMentionRows(row.mentions),
    media: normalizeCaddeMedia(row.media),
    reactionCounts,
    totalReactionCount: CADDE_REACTION_TYPES.reduce((sum, reactionType) => sum + reactionCounts[reactionType], 0),
    commentCount: row.comment_count ?? commentCounts.get(row.id) ?? postComments.length,
    shareCount: shareCounts.get(row.id) ?? row.share_count ?? 0,
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

const CAFE_SELECT_COLUMNS =
  "id, host_user_id, host_name_override, title, summary, country_id, city_id, content_mode, status, is_bridge, is_free, starts_at, ends_at, is_active, created_at, slug, theme_key, entry_mode, entry_question, capacity, external_links, archived_at";

export async function listCaddeCafes(filters: CaddeFilterState, currentUserId: string | null, diasporaKey = "tr"): Promise<CaddeCafe[]> {
  if (!isSupabaseConfigured || filters.mode === "demo") {
    return applyDemoFilters(DEMO_CAFES, filters);
  }

  try {
    const countryIds = await resolveCountryIdsByNames(filters.countries);
    const cityIds = await resolveCityIdsByNames(filters.cities, countryIds);
    let query = db
      .from("cadde_cafes")
      .select(CAFE_SELECT_COLUMNS)
      .eq("content_mode", "real")
      .eq("status", "published")
      .eq("is_active", true)
      .eq("diaspora_key", diasporaKey)
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
  const { data } = await db.from("cadde_cafe_members").select("id, cafe_id, user_id, status, answer, joined_at").in("cafe_id", cafeIds);
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
  const viewerMember = currentUserId ? cafeMembers.find((member) => member.user_id === currentUserId) ?? null : null;
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
    memberCount: cafeMembers.filter((member) => member.status === "approved").length,
    joinedByViewer: viewerMember?.status === "approved",
    mode: row.content_mode,
    slug: row.slug,
    themeKey: row.theme_key,
    entryMode: row.entry_mode,
    entryQuestion: row.entry_question,
    capacity: row.capacity,
    archivedAt: row.archived_at,
    hostUserId: row.host_user_id,
    viewerMemberStatus: viewerMember?.status ?? null,
  };
}

/** Tek cafe detayı — arşivlenmiş cafe de döner (read-only arşiv görünümü, spec §13.4). */
export async function getCaddeCafe(cafeId: string, currentUserId: string | null): Promise<CaddeCafe | null> {
  if (!isSupabaseConfigured) {
    return DEMO_CAFES.find((cafe) => cafe.id === cafeId) ?? null;
  }

  try {
    const { data, error } = await db.from("cadde_cafes").select(CAFE_SELECT_COLUMNS).eq("id", cafeId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as CaddeCafeRow;
    const [countries, cities, members, hosts] = await Promise.all([
      fetchCountryMap(),
      fetchCityMap(),
      fetchCafeMembers([row.id]),
      fetchUserNameMap(row.host_user_id ? [row.host_user_id] : []),
    ]);
    return mapCafe(row, countries, cities, members, hosts, currentUserId);
  } catch (error: unknown) {
    reportCaddeApiError("getCaddeCafe", error);
    return null;
  }
}

/** Kullanıcının host olduğu aktif cafe'ler (profil paneli parity, spec §13.5). */
export async function listMyCaddeCafes(userId: string): Promise<CaddeCafe[]> {
  if (!isSupabaseConfigured || !userId) return [];

  try {
    const { data, error } = await db
      .from("cadde_cafes")
      .select(CAFE_SELECT_COLUMNS)
      .eq("host_user_id", userId)
      .eq("content_mode", "real")
      .order("starts_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    const rows = (data ?? []) as CaddeCafeRow[];
    const [countries, cities, members] = await Promise.all([
      fetchCountryMap(),
      fetchCityMap(),
      fetchCafeMembers(rows.map((row) => row.id)),
    ]);
    return rows.map((row) => mapCafe(row, countries, cities, members, new Map(), userId));
  } catch (error: unknown) {
    reportCaddeApiError("listMyCaddeCafes", error);
    return [];
  }
}

/** Cafe üye listesi (owner onay paneli) — adlarla birlikte. */
export async function listCaddeCafeMembers(cafeId: string): Promise<CaddeCafeMember[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await db
      .from("cadde_cafe_members")
      .select("id, cafe_id, user_id, status, answer, joined_at")
      .eq("cafe_id", cafeId)
      .order("joined_at", { ascending: true });
    if (error) throw error;
    const rows = (data ?? []) as CaddeCafeMemberRow[];
    const names = await fetchUserNameMap(rows.map((row) => row.user_id));
    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      status: row.status,
      answer: row.answer,
      joinedAt: row.joined_at,
      displayName: names.get(row.user_id) ?? FALLBACK_PROFILE_NAME,
    }));
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeCafeMembers", error);
    return [];
  }
}

/** Cafe-içi feed: visibility='cafe' postları (yeniden eskiye). Arşivde read-only görünür. */
export async function listCaddeCafeFeed(cafeId: string, currentUserId: string | null): Promise<CaddePost[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await db
      .from("cadde_posts")
      .select("id, author_user_id, author_name_override, author_role, author_avatar_url, content_mode, status, post_type, title, body, country_id, city_id, is_bridge, pinned, created_at, need_category, engagement_score, published_at, media, share_count")
      .eq("cafe_id", cafeId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    const rows = (data ?? []) as Array<CaddeFeedRpcItem>;
    const postIds = rows.map((row) => row.id);
    const [countries, cities, reactions, comments, shareCounts, authorNames, interestRows] = await Promise.all([
      fetchCountryMap(),
      fetchCityMap(),
      fetchPostReactions(postIds),
      fetchPostComments(postIds),
      fetchPostShareCounts(postIds),
      fetchUserNameMap(rows.map((row) => row.author_user_id).filter(Boolean) as string[], currentUserId ? [currentUserId] : []),
      postIds.length > 0 ? db.from("cadde_post_interests").select("post_id, interest_key").in("post_id", postIds) : Promise.resolve({ data: [] }),
    ]);
    const commentCounts = countCommentsByPost(comments);
    const interestsByPost = new Map<string, string[]>();
    for (const item of ((interestRows.data ?? []) as Array<{ post_id: string; interest_key: string }>)) {
      interestsByPost.set(item.post_id, [...(interestsByPost.get(item.post_id) ?? []), item.interest_key]);
    }
    return rows.map((row) =>
      mapRpcPost(
        {
          ...row,
          country_name: row.country_id ? countries.get(row.country_id) ?? null : null,
          city_name: row.city_id ? cities.get(row.city_id) ?? null : null,
          interests: interestsByPost.get(row.id) ?? [],
          band: 0,
          score: 0,
          rand: 0,
        },
        reactions,
        commentCounts,
        shareCounts,
        comments,
        authorNames,
        currentUserId,
      ),
    );
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeCafeFeed", error);
    return [];
  }
}

export async function listCaddePostComments(postId: string, limit = 5, cursor: CaddeCommentCursor = null): Promise<CaddeCommentPage> {
  if (!postId) return { items: [], nextCursor: null };

  const pageSize = Math.max(1, limit);

  if (!isSupabaseConfigured) {
    const post = DEMO_POSTS.find((item) => item.id === postId);
    const sorted = [...(post?.comments ?? [])].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    const afterCursor = cursor ? sorted.filter((comment) => comment.createdAt > cursor) : sorted;
    const page = afterCursor.slice(0, pageSize);
    return {
      items: page,
      nextCursor: afterCursor.length > pageSize ? page[page.length - 1]?.createdAt ?? null : null,
    };
  }

  try {
    let query = db
      .from("cadde_post_comments")
      .select("id, post_id, user_id, body, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(pageSize + 1);
    if (cursor) query = query.gt("created_at", cursor);

    const { data, error } = await query;
    if (error) throw error;

    const rows = ((data ?? []) as CaddeCommentRow[]).slice(0, pageSize);
    const authorNames = await fetchUserNameMap(rows.map((row) => row.user_id));
    const items: CaddeComment[] = rows.map((row) => ({
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      body: row.body,
      authorName: authorNames.get(row.user_id) ?? FALLBACK_PROFILE_NAME,
      createdAt: row.created_at,
    }));

    return {
      items,
      nextCursor: (data ?? []).length > pageSize ? items[items.length - 1]?.createdAt ?? null : null,
    };
  } catch (error: unknown) {
    reportCaddeApiError("listCaddePostComments", error);
    return { items: [], nextCursor: null };
  }
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
      // m42/m44: featured seçimi MANUEL (admin Featured anahtarı) ve öne çıkanlar
      // listenin tepesinde gelir; eşitlikte panelde girilen sort_order karar verir.
      .order("is_featured", { ascending: false })
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
  const legacyTarget = { country: parsed.countryId ?? "", city: parsed.cityId ?? "" };
  const targets = (parsed.targets?.length ? parsed.targets : [legacyTarget]).map((target) => ({
    country: target.country.trim(),
    city: target.city?.trim() ?? "",
  }));
  const rpcName = parsed.cafeId ? "create_cadde_post_v1" : "create_cadde_post_v2";
  const rpcPayload = {
    p_post_type: parsed.type,
    p_title: parsed.title?.trim() || null,
    p_body: parsed.body,
    p_country: parsed.countryId ?? "",
    p_city: parsed.cityId ?? "",
    p_is_bridge: parsed.isBridge,
    p_need_category: needCategory,
    p_interests: interests,
    p_cafe_id: parsed.cafeId ?? null,
    p_diaspora_key: parsed.diasporaKey ?? "tr",
    p_media: parsed.media ?? [],
    p_mentions: parsed.mentions ?? [],
  };
  const { data, error } = await db.rpc(
    rpcName,
    parsed.cafeId ? rpcPayload : { ...rpcPayload, p_targets: targets },
  );
  if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
  return data as string;
}

/**
 * Composer'daki @mention önerileri (üye / işletme / cafe / çarşı ilanı).
 * Görünürlük kuralları DB'de: yalnız public profil, yayında katalog/cafe/ilan döner.
 */
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

/** search_cadde_people_v1 satırı — "İnsanları Keşfet" araması (workshop m38). */
export type CaddePersonHit = {
  userId: string;
  fullName: string;
  city: string | null;
  country: string | null;
  /** true = açık profil (tıklanabilir); false = ad-onaylı kapalı üye (yalnız isim+şehir). */
  hasProfile: boolean;
};

/**
 * Kişi araması (m38, kapsam kararı 2026-08-02): açık profiller tam satır, ad-onaylı
 * kapalı üyeler yalnız isim(+public şehir). Admin/Moderatör DB tarafında dışlanır.
 */
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

/** Sağ kolondaki "Şu an konuşulanlar" kartı. */
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

/**
 * Reaksiyon toggle'ı (Faz 7): ban + rate limit + bildirim üretimi DB'de
 * (toggle_cadde_reaction_v1); direct insert RLS'de kapalıdır. true=eklendi, false=kaldırıldı.
 */
export async function toggleCaddeReaction(postId: string, reactionType: CaddeReactionType): Promise<boolean> {
  const parsed = parseWithUserError(caddeReactionSchema, { postId, reactionType });
  const { data, error } = await db.rpc("toggle_cadde_reaction_v1", {
    p_post_id: parsed.postId,
    p_reaction_type: parsed.reactionType,
  });
  if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
  return Boolean(data);
}

/** Yorum oluşturma (Faz 7): ban + rate limit + bildirim üretimi DB'de (create_cadde_comment_v1). */
export async function createCaddeComment(postId: string, body: string): Promise<void> {
  const parsed = parseWithUserError(caddeCommentCreateSchema, { postId, body });
  const { error } = await db.rpc("create_cadde_comment_v1", {
    p_post_id: parsed.postId,
    p_body: parsed.body,
  });
  if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
}

/** Paylaşım kaydı (m12): link paylaşımı/kopyalama sonrası sayaç DB'de artar. */
export async function recordCaddeShare(postId: string, channel: "web_share" | "copy_link"): Promise<void> {
  const parsed = parseWithUserError(caddeShareSchema, { postId, channel });
  const { error } = await db.rpc("record_cadde_share_v1", {
    p_post_id: parsed.postId,
    p_channel: parsed.channel,
  });
  if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
}

/** İçerik şikayeti (spec §18): report → moderasyon kuyruğu (rate limit DB'de). */
export async function reportCaddeEntity(entityType: "post" | "comment" | "cafe" | "carsi_item", entityId: string, reason: string, details?: string): Promise<void> {
  const { error } = await db.rpc("report_cadde_entity_v1", {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_reason: reason,
    p_details: details?.trim() || null,
  });
  if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
}

/**
 * "Yeni post" chip'i için hafif sayım (spec §17.3: post stream'i açılmaz; chip + invalidate).
 * Yalnız ana akışta görünen (public) yayınlanmış real postları sayar.
 */
export async function countCaddePostsSince(isoTimestamp: string): Promise<number> {
  if (!isSupabaseConfigured || !isoTimestamp) return 0;

  try {
    const { count, error } = await db
      .from("cadde_posts")
      .select("id", { count: "exact", head: true })
      .eq("content_mode", "real")
      .eq("status", "published")
      .eq("visibility", "public")
      .gt("created_at", isoTimestamp);
    if (error) throw error;
    return count ?? 0;
  } catch (error: unknown) {
    // Chip dekoratiftir; sayım hatası feed'i etkilemesin diye yalnız console'a düşer.
    console.error("[cadde_api_error] countCaddePostsSince", error);
    return 0;
  }
}

/**
 * Cafe katılımı (Faz 4): entry policy (§7.3) + giriş tipi (open/approval/referral)
 * security-definer RPC'de enforce edilir; direct insert RLS'de kapalıdır.
 */
export async function joinCaddeCafe(input: { cafeId: string; referralCode?: string; answer?: string }): Promise<CaddeCafeJoinResult> {
  const parsed = parseWithUserError(caddeCafeJoinInputSchema, input);
  const { data, error } = await db.rpc("join_cadde_cafe_v1", {
    p_cafe_id: parsed.cafeId,
    p_referral_code: parsed.referralCode?.trim() || null,
    p_answer: parsed.answer?.trim() || null,
  });
  if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
  const payload = (data ?? {}) as { memberId?: string; status?: string };
  return {
    memberId: payload.memberId ?? "",
    status: (payload.status as CaddeCafeJoinResult["status"]) ?? "approved",
  };
}

/** Cafe oluşturma (Faz 4): tek form + RPC; ad moderasyonu frontend ilk hattıdır (R-05). */
export async function createCaddeCafe(input: CaddeCafeCreateInput): Promise<string> {
  const parsed = parseWithUserError(caddeCafeCreateSchema, input);
  const moderation = moderateCaddeCafeName(parsed.title);
  if (moderation.ok === false) throw new Error(moderation.reason);

  const { data, error } = await db.rpc("create_cadde_cafe_v1", {
    p_title: parsed.title,
    p_summary: parsed.summary,
    p_theme_key: parsed.themeKey,
    p_country: parsed.country ?? "",
    p_city: parsed.city ?? "",
    p_is_bridge: parsed.isBridge,
    p_entry_mode: parsed.entryMode,
    p_referral_code: parsed.referralCode?.trim() || null,
    p_entry_question: parsed.entryQuestion?.trim() || null,
    p_starts_at: parsed.startsAt ?? null,
    p_ends_at: parsed.endsAt ?? null,
    p_capacity: parsed.capacity ?? null,
    p_external_links: parsed.externalLinks ?? [],
    p_diaspora_key: parsed.diasporaKey ?? "tr",
  });
  if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
  return data as string;
}

export async function approveCaddeCafeMember(memberId: string, approve: boolean): Promise<void> {
  const { error } = await db.rpc("approve_cadde_cafe_member_v1", {
    p_member_id: memberId,
    p_approve: approve,
  });
  if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
}

export async function archiveCaddeCafe(cafeId: string): Promise<void> {
  const { error } = await db.rpc("archive_cadde_cafe_v1", { p_cafe_id: cafeId });
  if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
}

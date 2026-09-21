// Cadde public API katmanı: okuma sorguları + kullanıcı mutation'ları.
// Kurallar (Cadde 3.0 Faz 1):
//  - Demo veri yalnız mode==='demo' veya Supabase yapılandırılmamışken döner.
//  - Real moddaki hatalar raporlanır; sessiz demo fallback yok.
//    · BİRİNCİL yüzeyler (feed) `caddeReadError` ile FIRLATIR — çağıran hata kartı çizer.
//    · İKİNCİL yüzeyler (yan panel, rozet) reportCaddeApiError + boş sonuç kalıbında kalır.
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
  CADDE_CAFE_LIST_LIMIT,
  CADDE_PAGE_SIZE,
  FALLBACK_PROFILE_NAME,
  db,
  caddeReadError,
  caddeWriteError,
  reportCaddeApiError,
  resolveCityIdsByNames,
  resolveCountryIdsByNames,
} from "./cadde-internal";
import { normalizeCaddeMedia } from "./cadde-media";
import type { CaddeFeedReach } from "./cadde-reach";
import { mapActorContext, moderateCaddeCafeName, type CaddeActorContext } from "./cadde-rules";
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
export { listCaddeCities, listCaddeCountries, listCaddeFeed } from "./cadde-feed-location-api";
export {
  countCaddePostsSince,
  createCaddeComment,
  recordCaddeShare,
  reportCaddeEntity,
  toggleCaddeReaction,
} from "./cadde-engagement-api";
export { getCaddeSponsoredPlacement, listCaddeBillboardCards } from "./cadde-promotion-api";
export {
  listCaddeInterestCatalog,
  listMyCaddeInterests,
  listTrendingCaddeHashtags,
  saveMyCaddeInterests,
  searchCaddeMentions,
  searchCaddePeople,
} from "./cadde-search-interests-api";
export type { CaddePersonHit } from "./cadde-search-interests-api";
export { approveCaddeCafeMember, archiveCaddeCafe, createCaddeCafe, joinCaddeCafe } from "./cadde-cafe-api";
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

export async function getCaddeActorContext(): Promise<CaddeActorContext | null> {
  const { data, error } = await db.rpc("get_cadde_actor_context" as never);
  if (error) throw error;
  return mapActorContext(data);
}

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
      .order("starts_at", { ascending: true })
      // Açık tavan: sorgu sınırsızdı ve PostgREST 1000 satırda sessizce keserdi.
      .limit(CADDE_CAFE_LIST_LIMIT);
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

type CaddeCafeJoinRequestRow = {
  member_id: string;
  user_id: string;
  status: CaddeCafeMember["status"];
  answer: string | null;
  joined_at: string;
  display_name: string | null;
  country: string | null;
  city: string | null;
  role_key: string | null;
  role_label: string | null;
  short_bio: string | null;
  has_public_profile: boolean;
};

/** RPC satırını istemcideki sınırlı, iletişim bilgisi içermeyen özete çevirir. */
export function mapCaddeCafeJoinRequestRow(row: CaddeCafeJoinRequestRow): CaddeCafeMember {
  return {
    id: row.member_id,
    userId: row.user_id,
    status: row.status,
    answer: row.answer,
    joinedAt: row.joined_at,
    displayName: row.display_name?.trim() || FALLBACK_PROFILE_NAME,
    country: row.country,
    city: row.city,
    roleKey: row.role_key,
    roleLabel: row.role_label,
    shortBio: row.short_bio,
    hasPublicProfile: row.has_public_profile === true,
  };
}

/** Cafe katılım talepleri — yalnız host/admin/mod için güvenli RPC özeti. */
export async function listCaddeCafeMembers(cafeId: string): Promise<CaddeCafeMember[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await db.rpc("list_cadde_cafe_join_requests_v1", { p_cafe_id: cafeId });
    if (error) throw error;
    return ((data ?? []) as CaddeCafeJoinRequestRow[]).map(mapCaddeCafeJoinRequestRow);
  } catch (error: unknown) {
    throw caddeReadError("listCaddeCafeMembers", error);
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
  if (error) throw caddeWriteError("createCaddePost", error);
  return data as string;
}

// ── Akış erişimi (CaddeReachCard) ────────────────────────────────────────────

/**
 * "Akışın nasıl şekilleniyor?" kartının verisi: izleyicinin çözülmüş konumu,
 * paylaşımının potansiyel erişimi ve global eşikler (RPC get_cadde_feed_reach_v1).
 *
 * İKİNCİL yüzey kalıbı: hata FIRLATMAZ, raporlar ve null döner — yan panelde bir
 * hata kartı çizmek yerine kart hiç görünmez, akışın kendisi etkilenmez.
 */
export async function getCaddeFeedReach(): Promise<CaddeFeedReach | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await db.rpc("get_cadde_feed_reach_v1");
    if (error) throw error;

    const payload = (data ?? null) as CaddeFeedReach | null;
    if (!payload || payload.signedIn !== true) return null;
    return payload;
  } catch (error: unknown) {
    reportCaddeApiError("getCaddeFeedReach", error);
    return null;
  }
}

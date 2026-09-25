// Cafe tema kataloğu ve korumalı marka listesi.
// İkisi de DB'de tutulur (kod içinde sabit liste YOK) — ürün kararı SQL/panel işidir.

import { isSupabaseConfigured } from "@/integrations/supabase/client";

import { DEMO_CAFES } from "./cadde-demo-data";
import { fetchCaddeCityNameMap, fetchCaddeCountryNameMap, fetchCaddeUserNameMap } from "./cadde-api-support";
import { db, caddeReadError, caddeWriteError, reportCaddeApiError } from "./cadde-internal";
import { normalizeCaddeMedia } from "./cadde-media";
import { moderateCaddeCafeName, type CaddeProtectedBrand } from "./cadde-rules";
import { caddeCafeCreateSchema, caddeCafeJoinInputSchema, parseWithUserError } from "./cadde-schemas";
import { CADDE_REACTION_TYPES } from "./cadde-types";
import type {
  CaddeCafe,
  CaddeCafeCreateInput,
  CaddeCafeJoinResult,
  CaddeCafeMember,
  CaddeCafeMemberRow,
  CaddeCafeRow,
  CaddeCommentRow,
  CaddeFeedRpcItem,
  CaddeFilterState,
  CaddeHashtag,
  CaddeMentionTargetType,
  CaddePost,
  CaddePostMention,
  CaddeReactionRow,
  CaddeReactionType,
} from "./cadde-types";
import { CADDE_CAFE_LIST_LIMIT, FALLBACK_PROFILE_NAME, resolveCityIdsByNames, resolveCountryIdsByNames } from "./cadde-internal";

export type CaddeCafeTheme = {
  key: string;
  labelTr: string;
  iconKey: string | null;
  sortOrder: number;
};

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

export async function listCaddeCafeThemes(): Promise<CaddeCafeTheme[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await db
      .from("cadde_cafe_themes")
      .select("key, label_tr, icon_key, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as Array<{ key: string; label_tr: string; icon_key: string | null; sort_order: number }>).map(
      (row) => ({ key: row.key, labelTr: row.label_tr, iconKey: row.icon_key, sortOrder: row.sort_order }),
    );
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeCafeThemes", error);
    return [];
  }
}

/** Form'un anında uyarı verebilmesi için marka listesi; gerçek enforce RPC'de. */
export async function listCaddeProtectedBrands(): Promise<CaddeProtectedBrand[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await db
      .from("cadde_protected_brands")
      .select("brand_name, match_pattern")
      .eq("is_active", true);
    if (error) throw error;
    return ((data ?? []) as Array<{ brand_name: string; match_pattern: string }>).map((row) => ({
      brandName: row.brand_name,
      matchPattern: row.match_pattern,
    }));
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeProtectedBrands", error);
    return [];
  }
}

// ── Admin: marka yönetimi ───────────────────────────────────────────────────

export type CaddeProtectedBrandRow = CaddeProtectedBrand & {
  id: string;
  isActive: boolean;
  note: string | null;
};

export async function listCaddeProtectedBrandsForAdmin(): Promise<CaddeProtectedBrandRow[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await db
      .from("cadde_protected_brands")
      .select("id, brand_name, match_pattern, is_active, note")
      .order("brand_name", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as Array<{ id: string; brand_name: string; match_pattern: string; is_active: boolean; note: string | null }>).map(
      (row) => ({
        id: row.id,
        brandName: row.brand_name,
        matchPattern: row.match_pattern,
        isActive: row.is_active,
        note: row.note,
      }),
    );
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeProtectedBrandsForAdmin", error);
    return [];
  }
}

export async function createCaddeProtectedBrand(input: { brandName: string; matchPattern: string; note?: string }): Promise<void> {
  const brandName = input.brandName.trim();
  const matchPattern = input.matchPattern.trim().toLowerCase();
  if (brandName.length < 2) throw new Error("Marka adı en az 2 karakter olmalı.");
  if (matchPattern.length < 2) throw new Error("Eşleşme anahtarı en az 2 karakter olmalı.");

  const { error } = await db
    .from("cadde_protected_brands")
    .insert({ brand_name: brandName, match_pattern: matchPattern, note: input.note?.trim() || null });
  if (error) {
    throw new Error(error.code === "23505" ? "Bu eşleşme anahtarı zaten kayıtlı." : "Marka eklenemedi.");
  }
}

export async function setCaddeProtectedBrandActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await db.from("cadde_protected_brands").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error("Marka güncellenemedi.");
}

export async function deleteCaddeProtectedBrand(id: string): Promise<void> {
  const { error } = await db.from("cadde_protected_brands").delete().eq("id", id);
  if (error) throw new Error("Marka silinemedi.");
}

/** Cafe katılımı: giriş politikası security-definer RPC'de uygulanır. */
export async function joinCaddeCafe(input: { cafeId: string; referralCode?: string; answer?: string }): Promise<CaddeCafeJoinResult> {
  const parsed = parseWithUserError(caddeCafeJoinInputSchema, input);
  const { data, error } = await db.rpc("join_cadde_cafe_v1", {
    p_cafe_id: parsed.cafeId,
    p_referral_code: parsed.referralCode?.trim() || null,
    p_answer: parsed.answer?.trim() || null,
  });
  if (error) throw caddeWriteError("joinCaddeCafe", error);
  const payload = (data ?? {}) as { memberId?: string; status?: string };
  return { memberId: payload.memberId ?? "", status: (payload.status as CaddeCafeJoinResult["status"]) ?? "approved" };
}

/** Cafe oluşturma: ad moderasyonu istemci ilk hattı, yetkilendirme RPC'dedir. */
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
  if (error) throw caddeWriteError("createCaddeCafe", error);
  return data as string;
}

export async function approveCaddeCafeMember(memberId: string, approve: boolean): Promise<void> {
  const { error } = await db.rpc("approve_cadde_cafe_member_v1", { p_member_id: memberId, p_approve: approve });
  if (error) throw caddeWriteError("approveCaddeCafeMember", error);
}

export async function archiveCaddeCafe(cafeId: string): Promise<void> {
  const { error } = await db.rpc("archive_cadde_cafe_v1", { p_cafe_id: cafeId });
  if (error) throw caddeWriteError("archiveCaddeCafe", error);
}

const CAFE_SELECT_COLUMNS =
  "id, host_user_id, host_name_override, title, summary, country_id, city_id, content_mode, status, is_bridge, is_free, starts_at, ends_at, is_active, created_at, slug, theme_key, entry_mode, entry_question, capacity, external_links, archived_at, logo_url";

function filterDemoCafes(items: CaddeCafe[], filters: CaddeFilterState): CaddeCafe[] {
  return items.filter((item) =>
    item.mode === filters.mode &&
    (!filters.bridge || item.isBridge) &&
    (!filters.countries.length || (item.country !== null && filters.countries.includes(item.country))) &&
    (!filters.cities.length || (item.city !== null && filters.cities.includes(item.city))),
  );
}

async function fetchCafeMembers(cafeIds: string[]): Promise<CaddeCafeMemberRow[]> {
  if (cafeIds.length === 0) return [];
  const { data } = await db.from("cadde_cafe_members").select("id, cafe_id, user_id, status, answer, joined_at").in("cafe_id", cafeIds);
  return (data ?? []) as CaddeCafeMemberRow[];
}

function mapCafe(row: CaddeCafeRow, countries: Map<string, string>, cities: Map<string, string>, members: CaddeCafeMemberRow[], hosts: Map<string, string>, currentUserId: string | null): CaddeCafe {
  const cafeMembers = members.filter((member) => member.cafe_id === row.id);
  const viewerMember = currentUserId ? cafeMembers.find((member) => member.user_id === currentUserId) ?? null : null;
  return {
    id: row.id, title: row.title, summary: row.summary,
    hostName: row.host_name_override ?? (row.host_user_id ? hosts.get(row.host_user_id) ?? FALLBACK_PROFILE_NAME : FALLBACK_PROFILE_NAME),
    country: row.country_id ? countries.get(row.country_id) ?? null : null,
    city: row.city_id ? cities.get(row.city_id) ?? null : null,
    isBridge: row.is_bridge, isFree: row.is_free, startsAt: row.starts_at, endsAt: row.ends_at, isActive: row.is_active,
    memberCount: cafeMembers.filter((member) => member.status === "approved").length,
    joinedByViewer: viewerMember?.status === "approved", mode: row.content_mode, slug: row.slug, themeKey: row.theme_key,
    entryMode: row.entry_mode, entryQuestion: row.entry_question, capacity: row.capacity, archivedAt: row.archived_at,
    hostUserId: row.host_user_id, viewerMemberStatus: viewerMember?.status ?? null,
    // m135: Kafe logosu
    logoUrl: row.logo_url ?? null,
  };
}

export async function listCaddeCafes(filters: CaddeFilterState, currentUserId: string | null, diasporaKey = "tr"): Promise<CaddeCafe[]> {
  if (!isSupabaseConfigured || filters.mode === "demo") return filterDemoCafes(DEMO_CAFES, filters);
  try {
    const countryIds = await resolveCountryIdsByNames(filters.countries);
    const cityIds = await resolveCityIdsByNames(filters.cities, countryIds);
    let query = db.from("cadde_cafes").select(CAFE_SELECT_COLUMNS).eq("content_mode", "real").eq("status", "published").eq("is_active", true).eq("diaspora_key", diasporaKey).order("starts_at", { ascending: true }).limit(CADDE_CAFE_LIST_LIMIT);
    if (filters.bridge) query = query.eq("is_bridge", true);
    if (countryIds.length > 0) query = query.in("country_id", countryIds);
    if (cityIds.length > 0) query = query.in("city_id", cityIds);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as CaddeCafeRow[];
    const [countries, cities, members, hosts] = await Promise.all([fetchCaddeCountryNameMap(), fetchCaddeCityNameMap(), fetchCafeMembers(rows.map((row) => row.id)), fetchCaddeUserNameMap(rows.map((row) => row.host_user_id).filter(Boolean) as string[])]);
    return rows.map((row) => mapCafe(row, countries, cities, members, hosts, currentUserId));
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeCafes", error);
    return [];
  }
}

export async function getCaddeCafe(cafeId: string, currentUserId: string | null): Promise<CaddeCafe | null> {
  if (!isSupabaseConfigured) return DEMO_CAFES.find((cafe) => cafe.id === cafeId) ?? null;
  try {
    const { data, error } = await db.from("cadde_cafes").select(CAFE_SELECT_COLUMNS).eq("id", cafeId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as CaddeCafeRow;
    const [countries, cities, members, hosts] = await Promise.all([fetchCaddeCountryNameMap(), fetchCaddeCityNameMap(), fetchCafeMembers([row.id]), fetchCaddeUserNameMap(row.host_user_id ? [row.host_user_id] : [])]);
    return mapCafe(row, countries, cities, members, hosts, currentUserId);
  } catch (error: unknown) {
    reportCaddeApiError("getCaddeCafe", error);
    return null;
  }
}

export async function listMyCaddeCafes(userId: string): Promise<CaddeCafe[]> {
  if (!isSupabaseConfigured || !userId) return [];
  try {
    const { data, error } = await db.from("cadde_cafes").select(CAFE_SELECT_COLUMNS).eq("host_user_id", userId).eq("content_mode", "real").order("starts_at", { ascending: false }).limit(20);
    if (error) throw error;
    const rows = (data ?? []) as CaddeCafeRow[];
    const [countries, cities, members] = await Promise.all([fetchCaddeCountryNameMap(), fetchCaddeCityNameMap(), fetchCafeMembers(rows.map((row) => row.id))]);
    return rows.map((row) => mapCafe(row, countries, cities, members, new Map(), userId));
  } catch (error: unknown) {
    reportCaddeApiError("listMyCaddeCafes", error);
    return [];
  }
}

const emptyReactions = (): Record<CaddeReactionType, number> =>
  Object.fromEntries(CADDE_REACTION_TYPES.map((reactionType) => [reactionType, 0])) as Record<CaddeReactionType, number>;

async function fetchPostShareCounts(postIds: string[]): Promise<Map<string, number>> {
  if (postIds.length === 0) return new Map();
  const { data } = await db.from("cadde_posts").select("id, share_count").in("id", postIds);
  return new Map<string, number>(
    ((data ?? []) as Array<{ id: string; share_count: number | null }>).map((row) => [row.id, row.share_count ?? 0]),
  );
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
  const { data, error } = await db
    .from("cadde_post_comments")
    .select("id, post_id, user_id, body, created_at")
    .in("post_id", postIds)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as CaddeCommentRow[];
  const userMap = await fetchCaddeUserNameMap(rows.map((row) => row.user_id));
  return rows.map((row) => ({ ...row, author_name: userMap.get(row.user_id) ?? FALLBACK_PROFILE_NAME }));
}

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

function mapCafeFeedPost(
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
    authorName:
      row.author_name_override ??
      (row.author_user_id ? authorNames.get(row.author_user_id) ?? FALLBACK_PROFILE_NAME : FALLBACK_PROFILE_NAME),
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
    viewerReactions: currentUserId
      ? postReactions.filter((reaction) => reaction.user_id === currentUserId).map((reaction) => reaction.reaction_type)
      : [],
  };
}

/** Cafe-içi feed: visibility='cafe' postları (yeniden eskiye). Arşivde read-only görünür. */
export async function listCaddeCafeFeed(cafeId: string, currentUserId: string | null): Promise<CaddePost[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await db
      .from("cadde_posts")
      .select(
        "id, author_user_id, author_name_override, author_role, author_avatar_url, content_mode, status, post_type, title, body, country_id, city_id, is_bridge, pinned, created_at, need_category, engagement_score, published_at, media, share_count",
      )
      .eq("cafe_id", cafeId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    const rows = (data ?? []) as CaddeFeedRpcItem[];
    const postIds = rows.map((row) => row.id);
    const [countries, cities, reactions, comments, shareCounts, authorNames, interestRows] = await Promise.all([
      fetchCaddeCountryNameMap(),
      fetchCaddeCityNameMap(),
      fetchPostReactions(postIds),
      fetchPostComments(postIds),
      fetchPostShareCounts(postIds),
      fetchCaddeUserNameMap(
        rows.map((row) => row.author_user_id).filter(Boolean) as string[],
        currentUserId ? [currentUserId] : [],
      ),
      postIds.length > 0
        ? db.from("cadde_post_interests").select("post_id, interest_key").in("post_id", postIds)
        : Promise.resolve({ data: [] }),
    ]);
    const commentCounts = countCommentsByPost(comments);
    const interestsByPost = new Map<string, string[]>();
    for (const item of (interestRows.data ?? []) as Array<{ post_id: string; interest_key: string }>) {
      interestsByPost.set(item.post_id, [...(interestsByPost.get(item.post_id) ?? []), item.interest_key]);
    }
    return rows.map((row) =>
      mapCafeFeedPost(
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

/** m135: Kafe logosu güncelleme — yalnız host/admin/mod yetkisi. */
export async function updateCaddeCafeLogo(cafeId: string, logoUrl: string | null): Promise<void> {
  const { error } = await db.rpc("update_cadde_cafe_logo_v1", {
    p_cafe_id: cafeId,
    p_logo_url: logoUrl ?? "",
  });
  if (error) throw caddeWriteError("updateCaddeCafeLogo", error);
}

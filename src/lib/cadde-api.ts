// Cadde public API katmanı: okuma sorguları + kullanıcı mutation'ları.
// Kurallar (Cadde 3.0 Faz 1):
//  - Demo veri yalnız mode==='demo' veya Supabase yapılandırılmamışken döner.
//  - Real moddaki hatalar raporlanır; sessiz demo fallback yok.
//    · BİRİNCİL yüzeyler (feed) `caddeReadError` ile FIRLATIR — çağıran hata kartı çizer.
//    · İKİNCİL yüzeyler (yan panel, rozet) reportCaddeApiError + boş sonuç kalıbında kalır.
//  - Mutation girdileri Zod şemalarından geçer.
// Faz 2'de mutation'lar security-definer RPC'lere taşınacak.

import { isSupabaseConfigured } from "@/integrations/supabase/client";

import { DEMO_POSTS } from "./cadde-demo-data";
import {
  FALLBACK_PROFILE_NAME,
  db,
  caddeReadError,
  caddeWriteError,
  reportCaddeApiError,
} from "./cadde-internal";
import { fetchCaddeUserNameMap as fetchUserNameMap } from "./cadde-api-support";
import type { CaddeFeedReach } from "./cadde-reach";
import { mapActorContext, type CaddeActorContext } from "./cadde-rules";
import {
  caddeCommentCreateSchema,
  caddePostCreateSchema,
  caddeReactionSchema,
  caddeShareSchema,
  parseWithUserError,
} from "./cadde-schemas";
import { validatePostInterests } from "./cadde-targeting";
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
export {
  getCaddeCafe,
  listCaddeCafeFeed,
  listCaddeCafeMembers,
  listCaddeCafes,
  listMyCaddeCafes,
  mapCaddeCafeJoinRequestRow,
} from "./cadde-cafe-api";
import type {
  CaddeComment,
  CaddeCommentCursor,
  CaddeCommentPage,
  CaddeCommentRow,
  CaddePostInput,
} from "./cadde-types";

export async function getCaddeActorContext(): Promise<CaddeActorContext | null> {
  const { data, error } = await db.rpc("get_cadde_actor_context" as never);
  if (error) throw error;
  return mapActorContext(data);
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

import { isSupabaseConfigured } from "@/integrations/supabase/client";

import { db, caddeWriteError, reportCaddeApiError } from "./cadde-internal";
import {
  caddeCommentCreateSchema,
  caddeReactionSchema,
  caddeShareSchema,
  parseWithUserError,
} from "./cadde-schemas";
import type { CaddeReactionType } from "./cadde-types";

export function normalizeCaddeReportDetails(details?: string): string | null {
  return details?.trim() || null;
}

/** Reaksiyon toggle'ı: ban, oran sınırı ve bildirim RPC'de uygulanır. */
export async function toggleCaddeReaction(postId: string, reactionType: CaddeReactionType): Promise<boolean> {
  const parsed = parseWithUserError(caddeReactionSchema, { postId, reactionType });
  const { data, error } = await db.rpc("toggle_cadde_reaction_v1", {
    p_post_id: parsed.postId,
    p_reaction_type: parsed.reactionType,
  });
  if (error) throw caddeWriteError("toggleCaddeReaction", error);
  return Boolean(data);
}

/** Yorum oluşturma: ban, oran sınırı ve bildirim RPC'de uygulanır. */
export async function createCaddeComment(postId: string, body: string): Promise<void> {
  const parsed = parseWithUserError(caddeCommentCreateSchema, { postId, body });
  const { error } = await db.rpc("create_cadde_comment_v1", {
    p_post_id: parsed.postId,
    p_body: parsed.body,
  });
  if (error) throw caddeWriteError("createCaddeComment", error);
}

/** Link paylaşımı veya kopyalama sonrasında sayaç RPC'de artar. */
export async function recordCaddeShare(postId: string, channel: "web_share" | "copy_link"): Promise<void> {
  const parsed = parseWithUserError(caddeShareSchema, { postId, channel });
  const { error } = await db.rpc("record_cadde_share_v1", {
    p_post_id: parsed.postId,
    p_channel: parsed.channel,
  });
  if (error) throw caddeWriteError("recordCaddeShare", error);
}

/** İçerik şikayeti moderasyon kuyruğuna RPC aracılığıyla eklenir. */
export async function reportCaddeEntity(entityType: "post" | "comment" | "cafe" | "carsi_item", entityId: string, reason: string, details?: string): Promise<void> {
  const { error } = await db.rpc("report_cadde_entity_v1", {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_reason: reason,
    // normalizeCaddeReportDetails sözleşmesi toBeNull() testiyle kilitli (string|null).
    // SQL doğrulaması (27.09, S01a): report_cadde_entity_v1 p_details'i DEFAULT NULL +
    // nullif(trim(coalesce(...,''))) ile karşılıyor → null ≡ atla; çağrı yerinde daraltılır.
    p_details: normalizeCaddeReportDetails(details) ?? undefined,
  });
  if (error) throw caddeWriteError("reportCaddeEntity", error);
}

/** Ana akıştaki yeni paylaşım chip'i için hafif public-post sayımı. */
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
    // İkincil yüzey (chip sayacı): boş sonuç kalıbı bilinçli, ama hata artık
    // kalıcı kayda düşüyor — ham console.error teşhis edilmiyordu (S03c).
    reportCaddeApiError("countCaddePostsSince", error);
    return 0;
  }
}

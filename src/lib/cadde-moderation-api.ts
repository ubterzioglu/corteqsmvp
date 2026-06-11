// Cadde moderasyon admin API'si — Faz 7 (spec §18.4).
// Kuyruk okuma RLS ile admin'e açık; aksiyonlar admin_moderate_cadde_entity_v1 RPC'sinden
// (audit: resolved_by + resolution_note). Kullanıcı tarafı şikayet fonksiyonu cadde-api'de.

import { isSupabaseConfigured } from "@/integrations/supabase/client";

import { db, reportCaddeApiError } from "./cadde-internal";
import { resolveCaddeRpcErrorMessage } from "./cadde-rules";

export type CaddeModerationEntityType = "post" | "comment" | "cafe" | "carsi_item";
export type CaddeModerationAction = "dismiss" | "hide" | "publish" | "ban_owner" | "unban_owner";

export type CaddeModerationQueueItem = {
  id: string;
  entityType: CaddeModerationEntityType;
  entityId: string;
  reason: string;
  status: "open" | "resolved";
  reportCount: number;
  createdAt: string;
  resolutionNote: string | null;
};

export const CADDE_MODERATION_ENTITY_LABELS: Record<CaddeModerationEntityType, string> = {
  post: "Paylaşım",
  comment: "Yorum",
  cafe: "Cafe",
  carsi_item: "Çarşı İlanı",
};

export async function listModerationQueue(status: "open" | "resolved" = "open"): Promise<CaddeModerationQueueItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await db
      .from("cadde_moderation_queue")
      .select("id, entity_type, entity_id, reason, status, report_count, created_at, resolution_note")
      .eq("status", status)
      .order("created_at", { ascending: status === "open" })
      .limit(100);
    if (error) throw error;
    return ((data ?? []) as Array<{
      id: string;
      entity_type: CaddeModerationEntityType;
      entity_id: string;
      reason: string;
      status: "open" | "resolved";
      report_count: number;
      created_at: string;
      resolution_note: string | null;
    }>).map((row) => ({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      reason: row.reason,
      status: row.status,
      reportCount: row.report_count,
      createdAt: row.created_at,
      resolutionNote: row.resolution_note,
    }));
  } catch (error: unknown) {
    reportCaddeApiError("listModerationQueue", error);
    return [];
  }
}

export async function moderateCaddeEntity(input: {
  entityType: CaddeModerationEntityType;
  entityId: string;
  action: CaddeModerationAction;
  note?: string;
  banDays?: number;
}): Promise<void> {
  const { error } = await db.rpc("admin_moderate_cadde_entity_v1", {
    p_entity_type: input.entityType,
    p_entity_id: input.entityId,
    p_action: input.action,
    p_note: input.note?.trim() || null,
    p_ban_days: input.banDays ?? 7,
  });
  if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
}

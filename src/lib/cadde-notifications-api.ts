// Cadde bildirim API'si — Faz 7 (spec §17).
// Okuma/işaretleme direct table (RLS: alıcı yalnız kendi satırlarını görür/günceller);
// ÜRETİM yalnız DB'deki security-definer producer'lardan (cadde_notify) — gevşek insert
// policy R-03 ile kaldırıldı. Realtime aboneliği yalnız alıcının kanalı (user_id=eq.<uid>).

import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

import { db, reportCaddeApiError } from "./cadde-internal";

export type CaddeNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  related_id: string | null;
  entity_type: string | null;
  is_read: boolean;
  created_at: string;
};

export async function listMyNotifications(userId: string, limit = 20): Promise<CaddeNotification[]> {
  if (!isSupabaseConfigured || !userId) return [];

  try {
    const { data, error } = await db
      .from("notifications")
      .select("id, type, title, message, related_id, entity_type, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return ((data ?? []) as NotificationRow[]).map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      entityType: row.entity_type,
      entityId: row.related_id,
      isRead: row.is_read,
      createdAt: row.created_at,
    }));
  } catch (error: unknown) {
    reportCaddeApiError("listMyNotifications", error);
    return [];
  }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await db.from("notifications").update({ is_read: true }).eq("id", notificationId);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await db.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  if (error) throw error;
}

/** Bildirim tipi → deep link (spec §17.2). Bilinmeyen tipler Cadde köküne düşer. */
export function notificationDeepLink(notification: Pick<CaddeNotification, "type" | "entityType" | "entityId">): string {
  if (notification.entityType === "cafe" && notification.entityId) return `/cadde/cafe/${notification.entityId}`;
  if (notification.entityType === "carsi_item" && notification.entityId) return `/cadde/carsi/${notification.entityId}`;
  if (notification.entityType === "promotion") return "/profile";
  if (notification.entityType === "post") return "/cadde";
  return "/cadde";
}

/**
 * Realtime aboneliği: YALNIZ alıcının satırları dinlenir (spec §17.3 — global stream yok).
 * Dönen fonksiyon aboneliği kapatır; component unmount'ta çağrılmalıdır.
 */
export function subscribeToMyNotifications(userId: string, onChange: () => void): () => void {
  if (!isSupabaseConfigured || !userId) return () => undefined;

  const channel = supabase
    .channel(`cadde-notifications-${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

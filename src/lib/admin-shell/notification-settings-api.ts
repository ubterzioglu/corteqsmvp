// Bildirim E-postaları — API katmanı.
// /admin/notifications sayfasının veri katmanı. İki bildirim türünü yönetir:
//   new_member   → siteye yeni üye kaydolduğunda
//   admin_update → admin-updates.ts'e yeni kayıt girildiğinde
//
// Erişim modeli: notification_settings / admin_notification_subscriptions /
// notification_email_outbox tabloları client'a TAMAMEN kapalıdır (RLS deny-all + grant
// revoke). Tüm okuma/yazma security-definer RPC'ler üzerinden yapılır (mig 20260729100000).
//
// types.ts henüz bu RPC'leri içermiyor → `as never` cast'i kullanılır
// (CLAUDE.md B1; revision-requests.ts ile aynı yaklaşım).

import { supabase } from "@/integrations/supabase/client";

/** Global anahtar adları — DB tarafındaki allowlist ile birebir aynı olmalı. */
export const NOTIFICATION_SETTING_KEYS = {
  newMember: "email.new_member.enabled",
  adminUpdate: "email.admin_update.enabled",
} as const;

export type NotificationSettingKey =
  (typeof NOTIFICATION_SETTING_KEYS)[keyof typeof NOTIFICATION_SETTING_KEYS];

export const OUTBOX_STATUSES = ["pending", "sent", "failed", "skipped"] as const;
export type OutboxStatus = (typeof OUTBOX_STATUSES)[number];

export const OUTBOX_STATUS_LABELS: Record<OutboxStatus, string> = {
  pending: "Bekliyor",
  sent: "Gönderildi",
  failed: "Başarısız",
  skipped: "Atlandı",
};

export type NotificationEventType = "new_member" | "admin_update";

export const NOTIFICATION_EVENT_LABELS: Record<NotificationEventType, string> = {
  new_member: "Yeni üye",
  admin_update: "Güncelleme",
};

export type OutboxEntry = {
  id: string;
  eventType: NotificationEventType;
  status: OutboxStatus;
  recipientCount: number | null;
  lastError: string | null;
  createdAt: string;
  sentAt: string | null;
  /** Listede gösterilen kısa özet: yeni üyenin e-postası ya da güncellemenin başlığı. */
  summary: string;
};

export type AdminNotificationState = {
  isAdmin: boolean;
  newMemberEnabled: boolean;
  adminUpdateEnabled: boolean;
  myNewMemberEmail: boolean;
  myAdminUpdateEmail: boolean;
  pendingCount: number;
  recent: OutboxEntry[];
};

type RawOutboxRow = {
  id?: unknown;
  event_type?: unknown;
  status?: unknown;
  recipient_count?: unknown;
  last_error?: unknown;
  created_at?: unknown;
  sent_at?: unknown;
  payload?: unknown;
};

type RawState = {
  isAdmin?: unknown;
  newMemberEnabled?: unknown;
  adminUpdateEnabled?: unknown;
  myNewMemberEmail?: unknown;
  myAdminUpdateEmail?: unknown;
  pendingCount?: unknown;
  recent?: unknown;
};

function toBoolean(value: unknown): boolean {
  return value === true;
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

function isEventType(value: unknown): value is NotificationEventType {
  return value === "new_member" || value === "admin_update";
}

function isStatus(value: unknown): value is OutboxStatus {
  return OUTBOX_STATUSES.includes(value as OutboxStatus);
}

/** payload'dan listede gösterilecek tek satırlık özeti çıkarır. */
function buildSummary(eventType: NotificationEventType, payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "-";
  }

  const record = payload as Record<string, unknown>;
  const field = eventType === "new_member" ? record.email : record.title;
  return typeof field === "string" && field !== "" ? field : "-";
}

export function mapOutboxEntry(row: RawOutboxRow): OutboxEntry | null {
  const id = row?.id;
  if (typeof id !== "string" || !isEventType(row?.event_type) || !isStatus(row?.status)) {
    return null;
  }

  const recipientCount = row.recipient_count;

  return {
    id,
    eventType: row.event_type,
    status: row.status,
    recipientCount: typeof recipientCount === "number" ? recipientCount : null,
    lastError: toNullableString(row.last_error),
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    sentAt: toNullableString(row.sent_at),
    summary: buildSummary(row.event_type, row.payload),
  };
}

/** RPC'nin jsonb çıktısını UI tipine çevirir; eksik/bozuk alanlar güvenli varsayılana düşer. */
export function mapNotificationState(raw: unknown): AdminNotificationState {
  const state = (raw ?? {}) as RawState;
  const recent = Array.isArray(state.recent) ? state.recent : [];
  const pendingCount = Number(state.pendingCount);

  return {
    isAdmin: toBoolean(state.isAdmin),
    newMemberEnabled: toBoolean(state.newMemberEnabled),
    adminUpdateEnabled: toBoolean(state.adminUpdateEnabled),
    myNewMemberEmail: toBoolean(state.myNewMemberEmail),
    myAdminUpdateEmail: toBoolean(state.myAdminUpdateEmail),
    pendingCount: Number.isFinite(pendingCount) ? pendingCount : 0,
    recent: recent
      .map((row) => mapOutboxEntry(row as RawOutboxRow))
      .filter((entry): entry is OutboxEntry => entry !== null),
  };
}

/** Sayfanın tamamını tek çağrıda doldurur (moderator gate'li). */
export async function fetchAdminNotificationState(): Promise<AdminNotificationState> {
  const { data, error } = await supabase.rpc("get_admin_notification_state" as never);
  if (error) {
    throw new Error(error.message);
  }
  return mapNotificationState(data);
}

/** Global anahtar — yalnız admin. DB tarafında p_key allowlist'lidir. */
export async function setNotificationSetting(
  key: NotificationSettingKey,
  enabled: boolean,
): Promise<void> {
  const { error } = await supabase.rpc("set_notification_setting" as never, {
    p_key: key,
    p_enabled: enabled,
  } as never);
  if (error) {
    throw new Error(error.message);
  }
}

/** Kişisel abonelik — çağıran yalnız kendi satırını yazar (user_id parametresi yoktur). */
export async function setMyNotificationSubscription(input: {
  newMemberEmail: boolean;
  adminUpdateEmail: boolean;
}): Promise<void> {
  const { error } = await supabase.rpc("set_my_notification_subscription" as never, {
    p_new_member: input.newMemberEmail,
    p_admin_update: input.adminUpdateEmail,
  } as never);
  if (error) {
    throw new Error(error.message);
  }
}

export type DispatchResult = {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
};

/**
 * Bekleyen kuyruğu elle boşaltır (pg_net/pg_cron yoksa ya da takılan kayıt varsa).
 * Edge Function admin JWT'sini getUser + is_admin ile doğrular.
 */
export async function dispatchPendingNotifications(): Promise<DispatchResult> {
  const { data, error } = await supabase.functions.invoke("send-notification-emails", {
    body: { source: "admin-panel" },
  });
  if (error) {
    throw new Error(error.message);
  }

  const result = (data ?? {}) as Partial<DispatchResult>;
  return {
    processed: Number(result.processed) || 0,
    sent: Number(result.sent) || 0,
    skipped: Number(result.skipped) || 0,
    failed: Number(result.failed) || 0,
  };
}

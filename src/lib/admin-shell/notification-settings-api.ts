// Bildirim E-postaları — API katmanı.
// /admin/notifications sayfasının veri katmanı. Dört bildirim türünü yönetir:
//   new_member       → siteye yeni üye kaydolduğunda        → alıcı: abone admin/moderator'lar
//   admin_update     → admin-updates.ts'e yeni kayıt girildiğinde → alıcı: abone admin/moderator'lar
//   member_welcome   → üye e-postasını doğruladığında       → alıcı: ÜYENİN KENDİSİ
//   revision_request → yeni revizyon isteği açıldığında     → alıcı: abone admin/moderator'lar
//
// member_welcome'ın kişisel abonelik karşılığı YOKTUR: mail üyeye gider, admin abone olmaz.
// Bu yüzden yalnız genel anahtarı vardır.
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
  memberWelcome: "email.member_welcome.enabled",
  revisionRequest: "email.revision_request.enabled",
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

export type NotificationEventType =
  | "new_member"
  | "admin_update"
  | "member_welcome"
  | "revision_request";

export const NOTIFICATION_EVENT_LABELS: Record<NotificationEventType, string> = {
  new_member: "Yeni üye",
  admin_update: "Güncelleme",
  member_welcome: "Hoş geldin",
  revision_request: "Revizyon isteği",
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
  memberWelcomeEnabled: boolean;
  revisionRequestEnabled: boolean;
  myNewMemberEmail: boolean;
  myAdminUpdateEmail: boolean;
  myRevisionRequestEmail: boolean;
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
  memberWelcomeEnabled?: unknown;
  revisionRequestEnabled?: unknown;
  myNewMemberEmail?: unknown;
  myAdminUpdateEmail?: unknown;
  myRevisionRequestEmail?: unknown;
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
  return (
    value === "new_member" ||
    value === "admin_update" ||
    value === "member_welcome" ||
    value === "revision_request"
  );
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
  // Üye tarafındaki iki olayda konu üyenin adresi; güncelleme ve revizyon isteğinde başlıktır.
  const usesTitle = eventType === "admin_update" || eventType === "revision_request";
  const field = usesTitle ? record.title : record.email;
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
    memberWelcomeEnabled: toBoolean(state.memberWelcomeEnabled),
    revisionRequestEnabled: toBoolean(state.revisionRequestEnabled),
    myNewMemberEmail: toBoolean(state.myNewMemberEmail),
    myAdminUpdateEmail: toBoolean(state.myAdminUpdateEmail),
    myRevisionRequestEmail: toBoolean(state.myRevisionRequestEmail),
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
  revisionRequestEmail: boolean;
}): Promise<void> {
  const { error } = await supabase.rpc("set_my_notification_subscription" as never, {
    p_new_member: input.newMemberEmail,
    p_admin_update: input.adminUpdateEmail,
    p_revision_request: input.revisionRequestEmail,
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
 *
 * force: admin_update kayıtları normalde 18:00 (Europe/Berlin) özetini bekler
 * (mig 20260730230000); "Şimdi gönder" bu bekleyenleri de erken ve TEK özet mail
 * olarak boşaltır — butonun adının vaadi budur.
 */
export async function dispatchPendingNotifications(): Promise<DispatchResult> {
  const { data, error } = await supabase.functions.invoke("send-notification-emails", {
    body: { source: "admin-panel", force: true },
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

/**
 * Hoş geldin mailinin bir örneğini çağıran admin'in KENDİ adresine gönderir.
 * Kuyruğa hiç dokunmaz ve genel anahtar kapalıyken de çalışır — amacı yayına almadan önce
 * gerçek gelen kutusunda (Gmail/Outlook) görünümü doğrulamaktır; tarayıcı önizlemesi
 * bu istemcilerin stil kırpmasını göstermez.
 *
 * @returns mailin gönderildiği adres
 */
export async function sendWelcomeEmailPreview(): Promise<string> {
  const { data, error } = await supabase.functions.invoke("send-notification-emails", {
    body: { action: "preview" },
  });
  if (error) {
    throw new Error(error.message);
  }

  const result = (data ?? {}) as { sentTo?: unknown; error?: unknown };
  if (typeof result.error === "string") {
    throw new Error(result.error);
  }

  return typeof result.sentTo === "string" ? result.sentTo : "";
}

import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpcMock, invokeMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  invokeMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: rpcMock,
    functions: { invoke: invokeMock },
  },
}));

import {
  NOTIFICATION_SETTING_KEYS,
  dispatchPendingNotifications,
  fetchAdminNotificationState,
  mapNotificationState,
  mapOutboxEntry,
  sendWelcomeEmailPreview,
  setMyNotificationSubscription,
  setNotificationSetting,
} from "@/lib/admin-shell/notification-settings-api";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("mapOutboxEntry", () => {
  it("yeni üye kaydında özet olarak e-postayı kullanır", () => {
    const entry = mapOutboxEntry({
      id: "row-1",
      event_type: "new_member",
      status: "sent",
      recipient_count: 3,
      last_error: null,
      created_at: "2026-07-29T10:00:00.000Z",
      sent_at: "2026-07-29T10:00:05.000Z",
      payload: { email: "yeni@corteqs.net", provider: "email" },
    });

    expect(entry).toEqual({
      id: "row-1",
      eventType: "new_member",
      status: "sent",
      recipientCount: 3,
      lastError: null,
      createdAt: "2026-07-29T10:00:00.000Z",
      sentAt: "2026-07-29T10:00:05.000Z",
      summary: "yeni@corteqs.net",
    });
  });

  it("güncelleme kaydında özet olarak başlığı kullanır", () => {
    const entry = mapOutboxEntry({
      id: "row-2",
      event_type: "admin_update",
      status: "skipped",
      recipient_count: null,
      last_error: "no_subscribers",
      created_at: "2026-07-29T09:00:00.000Z",
      sent_at: null,
      payload: { title: "Bütçe sekmesi yayında", items: ["a", "b"] },
    });

    expect(entry?.summary).toBe("Bütçe sekmesi yayında");
    expect(entry?.recipientCount).toBeNull();
    expect(entry?.lastError).toBe("no_subscribers");
  });

  it("hoş geldin kaydında özet olarak üyenin e-postasını kullanır", () => {
    const entry = mapOutboxEntry({
      id: "row-6",
      event_type: "member_welcome",
      status: "sent",
      recipient_count: 1,
      last_error: null,
      created_at: "2026-07-29T10:00:00.000Z",
      sent_at: "2026-07-29T10:00:04.000Z",
      payload: { email: "yeni@corteqs.net", full_name: "Ada Lovelace" },
    });

    expect(entry?.eventType).toBe("member_welcome");
    expect(entry?.summary).toBe("yeni@corteqs.net");
    expect(entry?.recipientCount).toBe(1);
  });

  it("revizyon isteği kaydında özet olarak başlığı kullanır", () => {
    const entry = mapOutboxEntry({
      id: "row-7",
      event_type: "revision_request",
      status: "sent",
      recipient_count: 2,
      last_error: null,
      created_at: "2026-08-04T10:00:00.000Z",
      sent_at: "2026-08-04T10:00:03.000Z",
      payload: { title: "Üsküdar başlığı düzeltilsin", priority: 8, status: "acik" },
    });

    expect(entry?.eventType).toBe("revision_request");
    expect(entry?.summary).toBe("Üsküdar başlığı düzeltilsin");
    expect(entry?.recipientCount).toBe(2);
  });

  it("bilinmeyen tür/durum içeren satırı eler", () => {
    expect(mapOutboxEntry({ id: "row-3", event_type: "unknown", status: "sent" })).toBeNull();
    expect(mapOutboxEntry({ id: "row-4", event_type: "new_member", status: "queued" })).toBeNull();
    expect(mapOutboxEntry({ event_type: "new_member", status: "sent" })).toBeNull();
  });

  it("payload eksikse özet '-' olur", () => {
    const entry = mapOutboxEntry({
      id: "row-5",
      event_type: "new_member",
      status: "pending",
      created_at: "2026-07-29T09:00:00.000Z",
    });

    expect(entry?.summary).toBe("-");
  });
});

describe("mapNotificationState", () => {
  it("RPC çıktısını UI tipine çevirir ve bozuk satırları eler", () => {
    const state = mapNotificationState({
      isAdmin: true,
      newMemberEnabled: true,
      adminUpdateEnabled: false,
      myNewMemberEmail: true,
      myAdminUpdateEmail: false,
      pendingCount: 2,
      recent: [
        {
          id: "row-1",
          event_type: "new_member",
          status: "sent",
          recipient_count: 1,
          created_at: "2026-07-29T10:00:00.000Z",
          payload: { email: "a@b.c" },
        },
        { id: "bozuk", event_type: "nope", status: "sent" },
      ],
    });

    expect(state.isAdmin).toBe(true);
    expect(state.newMemberEnabled).toBe(true);
    expect(state.adminUpdateEnabled).toBe(false);
    expect(state.pendingCount).toBe(2);
    expect(state.recent).toHaveLength(1);
  });

  it("boş/eksik yanıtta güvenli varsayılanlara düşer", () => {
    const state = mapNotificationState(null);

    expect(state).toEqual({
      isAdmin: false,
      newMemberEnabled: false,
      adminUpdateEnabled: false,
      memberWelcomeEnabled: false,
      revisionRequestEnabled: false,
      myNewMemberEmail: false,
      myAdminUpdateEmail: false,
      myRevisionRequestEmail: false,
      pendingCount: 0,
      recent: [],
    });
  });

  it("revizyon isteği anahtarlarını da okur", () => {
    const state = mapNotificationState({
      revisionRequestEnabled: true,
      myRevisionRequestEmail: true,
    });

    expect(state.revisionRequestEnabled).toBe(true);
    expect(state.myRevisionRequestEmail).toBe(true);
  });

  it("boolean olmayan doğruluk değerlerini true saymaz", () => {
    const state = mapNotificationState({ isAdmin: "true", newMemberEnabled: 1 });

    expect(state.isAdmin).toBe(false);
    expect(state.newMemberEnabled).toBe(false);
  });
});

describe("fetchAdminNotificationState", () => {
  it("get_admin_notification_state RPC'sini çağırır", async () => {
    rpcMock.mockResolvedValue({ data: { isAdmin: true, pendingCount: 0, recent: [] }, error: null });

    const state = await fetchAdminNotificationState();

    expect(rpcMock).toHaveBeenCalledWith("get_admin_notification_state");
    expect(state.isAdmin).toBe(true);
  });

  it("RPC hatasını yukarı fırlatır", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "forbidden" } });

    await expect(fetchAdminNotificationState()).rejects.toThrow("forbidden");
  });
});

describe("setNotificationSetting", () => {
  it("anahtar ve değeri RPC'ye iletir", async () => {
    rpcMock.mockResolvedValue({ data: true, error: null });

    await setNotificationSetting(NOTIFICATION_SETTING_KEYS.newMember, true);

    expect(rpcMock).toHaveBeenCalledWith("set_notification_setting", {
      p_key: "email.new_member.enabled",
      p_enabled: true,
    });
  });

  it("hata durumunda fırlatır", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "forbidden" } });

    await expect(
      setNotificationSetting(NOTIFICATION_SETTING_KEYS.adminUpdate, false),
    ).rejects.toThrow("forbidden");
  });
});

describe("setMyNotificationSubscription", () => {
  it("üç tercihi birlikte gönderir (user_id parametresi yoktur)", async () => {
    rpcMock.mockResolvedValue({ data: {}, error: null });

    await setMyNotificationSubscription({
      newMemberEmail: true,
      adminUpdateEmail: false,
      revisionRequestEmail: true,
    });

    expect(rpcMock).toHaveBeenCalledWith("set_my_notification_subscription", {
      p_new_member: true,
      p_admin_update: false,
      p_revision_request: true,
    });
  });
});

describe("dispatchPendingNotifications", () => {
  it("Edge Function sonucunu sayısal alanlara normalize eder", async () => {
    invokeMock.mockResolvedValue({
      data: { processed: 3, sent: 2, skipped: 1, failed: 0 },
      error: null,
    });

    const result = await dispatchPendingNotifications();

    // force: buton, 18:00 özetini bekleyen admin_update satırlarını da erken boşaltır
    // (mig 20260730230000 — günlük özet kararı).
    expect(invokeMock).toHaveBeenCalledWith("send-notification-emails", {
      body: { source: "admin-panel", force: true },
    });
    expect(result).toEqual({ processed: 3, sent: 2, skipped: 1, failed: 0 });
  });

  it("eksik alanları sıfırlar", async () => {
    invokeMock.mockResolvedValue({ data: { sent: 2 }, error: null });

    await expect(dispatchPendingNotifications()).resolves.toEqual({
      processed: 0,
      sent: 2,
      skipped: 0,
      failed: 0,
    });
  });

  it("Edge Function hatasını fırlatır", async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: "unauthorized" } });

    await expect(dispatchPendingNotifications()).rejects.toThrow("unauthorized");
  });
});

describe("sendWelcomeEmailPreview", () => {
  it("preview aksiyonunu gönderir ve alıcı adresini döndürür", async () => {
    invokeMock.mockResolvedValue({ data: { preview: true, sentTo: "admin@corteqs.net" }, error: null });

    await expect(sendWelcomeEmailPreview()).resolves.toBe("admin@corteqs.net");

    // Kuyruk drenajından farklı bir gövde: bu çağrı outbox'a DOKUNMAMALI.
    expect(invokeMock).toHaveBeenCalledWith("send-notification-emails", {
      body: { action: "preview" },
    });
  });

  it("gövdedeki hata alanını da hata sayar (Edge Function 200 dönse bile)", async () => {
    invokeMock.mockResolvedValue({ data: { error: "preview_requires_admin_session" }, error: null });

    await expect(sendWelcomeEmailPreview()).rejects.toThrow("preview_requires_admin_session");
  });

  it("aktarım hatasını fırlatır", async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: "unauthorized" } });

    await expect(sendWelcomeEmailPreview()).rejects.toThrow("unauthorized");
  });
});

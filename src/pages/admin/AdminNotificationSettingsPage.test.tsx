import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminNotificationSettingsPage from "@/pages/admin/AdminNotificationSettingsPage";
import type { AdminNotificationState } from "@/lib/admin-shell/notification-settings-api";

const fetchStateMock = vi.fn();
const setSettingMock = vi.fn();
const setSubscriptionMock = vi.fn();
const dispatchMock = vi.fn();
const welcomePreviewMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/admin-shell/notification-settings-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin-shell/notification-settings-api")>(
    "@/lib/admin-shell/notification-settings-api",
  );
  return {
    ...actual,
    fetchAdminNotificationState: () => fetchStateMock(),
    setNotificationSetting: (...args: unknown[]) => setSettingMock(...args),
    setMyNotificationSubscription: (...args: unknown[]) => setSubscriptionMock(...args),
    dispatchPendingNotifications: (...args: unknown[]) => dispatchMock(...args),
    sendWelcomeEmailPreview: (...args: unknown[]) => welcomePreviewMock(...args),
  };
});

const makeState = (overrides: Partial<AdminNotificationState> = {}): AdminNotificationState => ({
  isAdmin: true,
  newMemberEnabled: true,
  adminUpdateEnabled: true,
  memberWelcomeEnabled: false,
  revisionRequestEnabled: true,
  myNewMemberEmail: false,
  myAdminUpdateEmail: false,
  myRevisionRequestEmail: false,
  pendingCount: 0,
  recent: [],
  ...overrides,
});

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminNotificationSettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("AdminNotificationSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSettingMock.mockResolvedValue(undefined);
    setSubscriptionMock.mockResolvedValue(undefined);
    dispatchMock.mockResolvedValue({ processed: 0, sent: 0, skipped: 0, failed: 0 });
    welcomePreviewMock.mockResolvedValue("admin@corteqs.net");
  });

  it("yedi anahtarı da gösterir", async () => {
    fetchStateMock.mockResolvedValue(makeState());

    renderPage();

    expect(await screen.findByLabelText("Yeni üye bildirimleri açık")).toBeInTheDocument();
    expect(screen.getByLabelText("Güncelleme bildirimleri açık")).toBeInTheDocument();
    expect(screen.getByLabelText("Hoş geldin maili açık")).toBeInTheDocument();
    expect(screen.getByLabelText("Revizyon isteği bildirimleri açık")).toBeInTheDocument();
    expect(screen.getByLabelText("Yeni üye kaydolduğunda bana mail gelsin")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Yeni güncelleme yayınlandığında bana mail gelsin"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Yeni revizyon isteği açıldığında bana mail gelsin"),
    ).toBeInTheDocument();
  });

  it("hoş geldin anahtarı üyeye giden maili yönetir ve kişisel abonelik karşılığı yoktur", async () => {
    fetchStateMock.mockResolvedValue(makeState({ memberWelcomeEnabled: false }));

    renderPage();
    await userEvent.click(await screen.findByLabelText("Hoş geldin maili açık"));

    await waitFor(() =>
      expect(setSettingMock).toHaveBeenCalledWith("email.member_welcome.enabled", true),
    );
    // Mail üyeye gider; admin bu bildirime abone olamaz.
    expect(screen.queryByLabelText(/Hoş geldin.*bana mail gelsin/i)).not.toBeInTheDocument();
  });

  it("örnek mail butonu preview gönderimini tetikler", async () => {
    fetchStateMock.mockResolvedValue(makeState());
    welcomePreviewMock.mockResolvedValue("admin@corteqs.net");

    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /örnek hoş geldin maili/i }));

    await waitFor(() => expect(welcomePreviewMock).toHaveBeenCalledTimes(1));
    // Önizleme kuyruğa dokunmamalı.
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it("admin olmayan kullanıcıya örnek mail butonu gösterilmez", async () => {
    fetchStateMock.mockResolvedValue(makeState({ isAdmin: false }));

    renderPage();
    await screen.findByLabelText("Yeni üye bildirimleri açık");

    expect(
      screen.queryByRole("button", { name: /örnek hoş geldin maili/i }),
    ).not.toBeInTheDocument();
  });

  it("genel anahtarı çevirince set_notification_setting çağrılır", async () => {
    fetchStateMock.mockResolvedValue(makeState({ newMemberEnabled: false }));

    renderPage();
    await userEvent.click(await screen.findByLabelText("Yeni üye bildirimleri açık"));

    await waitFor(() =>
      expect(setSettingMock).toHaveBeenCalledWith("email.new_member.enabled", true),
    );
  });

  it("kişisel abonelikte diğer tercihleri korur", async () => {
    fetchStateMock.mockResolvedValue(
      makeState({
        myNewMemberEmail: false,
        myAdminUpdateEmail: true,
        myRevisionRequestEmail: true,
      }),
    );

    renderPage();
    await userEvent.click(
      await screen.findByLabelText("Yeni üye kaydolduğunda bana mail gelsin"),
    );

    // React Query mutationFn'e ikinci argüman olarak context geçer; yalnız payload denetlenir.
    await waitFor(() => expect(setSubscriptionMock).toHaveBeenCalledTimes(1));
    expect(setSubscriptionMock.mock.calls[0][0]).toEqual({
      newMemberEmail: true,
      adminUpdateEmail: true,
      revisionRequestEmail: true,
    });
  });

  it("revizyon isteği genel anahtarını çevirince doğru ayar yazılır", async () => {
    fetchStateMock.mockResolvedValue(makeState({ revisionRequestEnabled: false }));

    renderPage();
    await userEvent.click(await screen.findByLabelText("Revizyon isteği bildirimleri açık"));

    await waitFor(() =>
      expect(setSettingMock).toHaveBeenCalledWith("email.revision_request.enabled", true),
    );
  });

  it("revizyon isteği aboneliğini açarken diğer tercihleri korur", async () => {
    fetchStateMock.mockResolvedValue(
      makeState({ myRevisionRequestEmail: false, myAdminUpdateEmail: true }),
    );

    renderPage();
    await userEvent.click(
      await screen.findByLabelText("Yeni revizyon isteği açıldığında bana mail gelsin"),
    );

    await waitFor(() => expect(setSubscriptionMock).toHaveBeenCalledTimes(1));
    expect(setSubscriptionMock.mock.calls[0][0]).toEqual({
      newMemberEmail: false,
      adminUpdateEmail: true,
      revisionRequestEmail: true,
    });
  });

  it("admin olmayan kullanıcıda genel anahtarlar kilitli, kişisel abonelik açıktır", async () => {
    fetchStateMock.mockResolvedValue(makeState({ isAdmin: false }));

    renderPage();

    expect(await screen.findByLabelText("Yeni üye bildirimleri açık")).toBeDisabled();
    expect(screen.getByLabelText("Güncelleme bildirimleri açık")).toBeDisabled();
    expect(screen.getByLabelText("Yeni üye kaydolduğunda bana mail gelsin")).toBeEnabled();
    expect(screen.queryByRole("button", { name: /şimdi gönder/i })).not.toBeInTheDocument();
  });

  it("kişisel tercih açık ama genel anahtar kapalıysa uyarı gösterir", async () => {
    fetchStateMock.mockResolvedValue(
      makeState({ newMemberEnabled: false, myNewMemberEmail: true }),
    );

    renderPage();

    expect(
      await screen.findByText(/Genel anahtar kapalı olduğu için yeni üye bildirimleri kimseye/),
    ).toBeInTheDocument();
  });

  it("bekleyen kayıt varsa gönderim butonu dispatcher'ı tetikler", async () => {
    fetchStateMock.mockResolvedValue(makeState({ pendingCount: 4 }));

    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /Bekleyen 4 kaydı/ }));

    await waitFor(() => expect(dispatchMock).toHaveBeenCalledTimes(1));
  });

  it("bekleyen kayıt yokken gönderim butonu kilitlidir", async () => {
    fetchStateMock.mockResolvedValue(makeState({ pendingCount: 0 }));

    renderPage();

    expect(await screen.findByRole("button", { name: "Bekleyen kayıt yok" })).toBeDisabled();
  });

  it("son gönderimleri durum ve alıcı sayısıyla listeler", async () => {
    fetchStateMock.mockResolvedValue(
      makeState({
        recent: [
          {
            id: "row-1",
            eventType: "new_member",
            status: "sent",
            recipientCount: 2,
            lastError: null,
            createdAt: "2026-07-29T10:00:00.000Z",
            sentAt: "2026-07-29T10:00:05.000Z",
            summary: "yeni@corteqs.net",
          },
          {
            id: "row-2",
            eventType: "admin_update",
            status: "skipped",
            recipientCount: 0,
            lastError: "no_subscribers",
            createdAt: "2026-07-29T09:00:00.000Z",
            sentAt: null,
            summary: "Bütçe sekmesi yayında",
          },
        ],
      }),
    );

    renderPage();

    expect(await screen.findByText("yeni@corteqs.net")).toBeInTheDocument();
    expect(screen.getByText("Gönderildi")).toBeInTheDocument();
    expect(screen.getByText("Bütçe sekmesi yayında")).toBeInTheDocument();
    expect(screen.getByText("Atlandı")).toBeInTheDocument();
    expect(screen.getByText("no_subscribers")).toBeInTheDocument();
  });

  it("gönderim yoksa boş durum gösterir", async () => {
    fetchStateMock.mockResolvedValue(makeState());

    renderPage();

    expect(await screen.findByText("Henüz gönderim yok")).toBeInTheDocument();
  });

  it("RPC hata verirse hata durumu gösterir", async () => {
    fetchStateMock.mockRejectedValue(new Error("forbidden"));

    renderPage();

    expect(await screen.findByText("forbidden")).toBeInTheDocument();
  });
});

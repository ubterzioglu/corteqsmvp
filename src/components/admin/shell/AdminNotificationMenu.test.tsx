import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminNotificationMenu from "@/components/admin/shell/AdminNotificationMenu";
import type { AdminNotificationState } from "@/lib/admin-shell/notification-settings-api";

const fetchStateMock = vi.fn();
const setSettingMock = vi.fn();
const setSubscriptionMock = vi.fn();

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
    dispatchPendingNotifications: vi.fn(),
  };
});

const makeState = (overrides: Partial<AdminNotificationState> = {}): AdminNotificationState => ({
  isAdmin: true,
  newMemberEnabled: true,
  adminUpdateEnabled: true,
  myNewMemberEmail: false,
  myAdminUpdateEmail: false,
  pendingCount: 0,
  recent: [],
  ...overrides,
});

const renderMenu = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminNotificationMenu />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const openMenu = async () => {
  await userEvent.click(await screen.findByRole("button", { name: "Bildirim e-postaları" }));
};

describe("AdminNotificationMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSettingMock.mockResolvedValue(undefined);
    setSubscriptionMock.mockResolvedValue(undefined);
  });

  it("dört anahtarı da menüde gösterir", async () => {
    fetchStateMock.mockResolvedValue(makeState());

    renderMenu();
    await openMenu();

    expect(await screen.findByLabelText("Yeni üye kaydolduğunda bana mail gelsin")).toBeInTheDocument();
    expect(screen.getByLabelText("Yeni güncelleme yayınlandığında bana mail gelsin")).toBeInTheDocument();
    expect(screen.getByLabelText("Yeni üye bildirimleri açık")).toBeInTheDocument();
    expect(screen.getByLabelText("Güncelleme bildirimleri açık")).toBeInTheDocument();
  });

  it("kişisel aboneliği çevirince diğer tercihi korur", async () => {
    fetchStateMock.mockResolvedValue(makeState({ myNewMemberEmail: false, myAdminUpdateEmail: true }));

    renderMenu();
    await openMenu();
    await userEvent.click(await screen.findByLabelText("Yeni üye kaydolduğunda bana mail gelsin"));

    await waitFor(() => expect(setSubscriptionMock).toHaveBeenCalledTimes(1));
    expect(setSubscriptionMock.mock.calls[0][0]).toEqual({
      newMemberEmail: true,
      adminUpdateEmail: true,
    });
  });

  it("genel anahtarı çevirince RPC'yi doğru anahtarla çağırır", async () => {
    fetchStateMock.mockResolvedValue(makeState({ adminUpdateEnabled: false }));

    renderMenu();
    await openMenu();
    await userEvent.click(await screen.findByLabelText("Güncelleme bildirimleri açık"));

    await waitFor(() =>
      expect(setSettingMock).toHaveBeenCalledWith("email.admin_update.enabled", true),
    );
  });

  it("admin olmayanda genel anahtarlar kilitli, kişisel abonelik açıktır", async () => {
    fetchStateMock.mockResolvedValue(makeState({ isAdmin: false }));

    renderMenu();
    await openMenu();

    expect(await screen.findByLabelText("Yeni üye bildirimleri açık")).toBeDisabled();
    expect(screen.getByLabelText("Güncelleme bildirimleri açık")).toBeDisabled();
    expect(screen.getByLabelText("Yeni üye kaydolduğunda bana mail gelsin")).toBeEnabled();
  });

  it("fiilen mail alıyorsa ikonda yeşil nokta gösterir", async () => {
    fetchStateMock.mockResolvedValue(makeState({ myNewMemberEmail: true, newMemberEnabled: true }));

    const { container } = renderMenu();
    await screen.findByRole("button", { name: "Bildirim e-postaları" });

    await waitFor(() => expect(container.querySelector(".bg-emerald-500")).toBeInTheDocument());
  });

  it("kişisel tercih açık ama genel anahtar kapalıysa nokta göstermez ve uyarır", async () => {
    fetchStateMock.mockResolvedValue(makeState({ myNewMemberEmail: true, newMemberEnabled: false }));

    const { container } = renderMenu();
    await openMenu();

    expect(container.querySelector(".bg-emerald-500")).not.toBeInTheDocument();
    expect(await screen.findByRole("status")).toHaveTextContent(
      /Genel anahtar kapalı: yeni üye bildirimi kimseye gitmiyor/,
    );
  });

  it("yetkisiz kullanıcıda (RPC forbidden) hiç render edilmez", async () => {
    fetchStateMock.mockRejectedValue(new Error("forbidden"));

    const { container } = renderMenu();

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});

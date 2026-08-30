import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import VipInvitationPage from "@/pages/VipInvitationPage";

const mocks = vi.hoisted(() => ({
  resolve: vi.fn(),
  redeem: vi.fn(),
  user: { id: "user-1" } as { id: string } | null,
}));

vi.mock("@/lib/vip-invitations", () => ({
  resolveVipInvitation: mocks.resolve,
  redeemVipInvitation: mocks.redeem,
}));

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => ({ user: mocks.user, isLoading: false }),
}));

const renderPage = () => render(
  <MemoryRouter initialEntries={["/vip/vip_test_token"]}>
    <Routes><Route path="/vip/:token" element={<VipInvitationPage />} /></Routes>
  </MemoryRouter>,
);

describe("VipInvitationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: "user-1" };
    mocks.resolve.mockResolvedValue({
      status: "valid",
      invitationId: "inv-1",
      invitationType: "founding_vip",
      title: "Kurucu VIP Daveti",
      recipientName: "Ayşe",
      message: "Seni aramızda görmek istiyoruz.",
      expiresAt: "2026-09-29T12:00:00.000Z",
    });
    mocks.redeem.mockResolvedValue({ status: "redeemed", invitationId: "inv-1" });
  });

  it("renders safe invitation fields and applies noindex,nofollow", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Kurucu VIP Daveti" })).toBeInTheDocument();
    expect(screen.getByText("Merhaba Ayşe,")).toBeInTheDocument();
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  });

  it("redeems once for an authenticated user", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Daveti kabul et" }));
    expect(mocks.redeem).toHaveBeenCalledWith("vip_test_token");
    expect(await screen.findByRole("heading", { name: "VIP davetin kabul edildi" })).toBeInTheDocument();
  });

  it.each([
    ["expired", "Davetin süresi doldu"],
    ["revoked", "Davet iptal edildi"],
    ["used", "Davet daha önce kullanıldı"],
    ["invalid", "Davet bulunamadı"],
  ])("shows the %s terminal state", async (status, heading) => {
    mocks.resolve.mockResolvedValue({ status });
    renderPage();
    expect(await screen.findByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("preserves the token route while sending anonymous users to login", async () => {
    mocks.user = null;
    renderPage();

    const link = await screen.findByRole("link", { name: /Giriş yap ve kabul et/ });
    expect(link).toHaveAttribute("href", "/login?next=%2Fvip%2Fvip_test_token");
    await waitFor(() => expect(mocks.resolve).toHaveBeenCalledWith("vip_test_token"));
  });
});

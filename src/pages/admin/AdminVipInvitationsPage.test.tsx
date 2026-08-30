import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminVipInvitationsPage from "@/pages/admin/AdminVipInvitationsPage";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  revoke: vi.fn(),
}));

vi.mock("@/lib/vip-invitations", () => ({
  listVipInvitations: mocks.list,
  createVipInvitation: mocks.create,
  revokeVipInvitation: mocks.revoke,
}));

describe("AdminVipInvitationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.list.mockResolvedValue([]);
    mocks.create.mockResolvedValue({
      invitationId: "inv-1",
      token: "vip_secret_once",
      expiresAt: "2026-09-29T12:00:00.000Z",
    });
  });

  it("creates a 30-day invitation and shows the raw link only in the creation result", async () => {
    const user = userEvent.setup();
    render(<AdminVipInvitationsPage />);

    await screen.findByText("Henüz VIP daveti yok.");
    await user.type(screen.getByLabelText("Alıcı adı"), "Ayşe");
    await user.click(screen.getByRole("button", { name: "Davet oluştur" }));

    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ recipientName: "Ayşe", validDays: 30 }));
    const linkInput = await screen.findByLabelText("Oluşturulan VIP bağlantısı");
    expect((linkInput as HTMLInputElement).value).toContain("/vip/vip_secret_once");
  });
});

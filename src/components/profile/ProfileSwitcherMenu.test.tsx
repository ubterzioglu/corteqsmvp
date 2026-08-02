import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useQueryMock, dialogSpy, navigateSpy } = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
  dialogSpy: vi.fn(),
  navigateSpy: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateSpy,
}));

vi.mock("@/lib/member-catalog", () => ({
  getMyEditableCatalogItems: vi.fn(),
}));

vi.mock("@/hooks/useMemberCatalogSlug", () => ({
  memberCatalogItemsKeys: { mine: ["member-catalog-items", "mine"] },
}));

vi.mock("@/lib/profile-routing", () => ({
  profileEditorPathFor: () => "/profile",
}));

vi.mock("@/components/profile/RequestNewProfileDialog", () => ({
  default: (props: { open: boolean }) => {
    dialogSpy(props);
    return props.open ? <div data-testid="request-dialog" /> : null;
  },
}));

import ProfileSwitcherMenu from "@/components/profile/ProfileSwitcherMenu";

describe("ProfileSwitcherMenu — yeni profil talebi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
    window.HTMLElement.prototype.setPointerCapture = vi.fn();
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();
    useQueryMock.mockReturnValue({
      data: [
        { itemId: "a", itemType: "member", roleKey: "bireysel", title: "Bireysel" },
        { itemId: "b", itemType: "member", roleKey: "Consultant_HealthcareDoctor", title: "Danışman" },
      ],
      isLoading: false,
    });
  });

  it("shows a '+ Yeni Profil' menu item that opens the request dialog", async () => {
    const user = userEvent.setup();
    render(<ProfileSwitcherMenu currentItemId="a" />);

    await user.click(screen.getByRole("button", { name: /Diğer Profiller/i }));
    await user.click(await screen.findByText("+ Yeni Profil"));

    await waitFor(() =>
      expect(dialogSpy).toHaveBeenCalledWith(expect.objectContaining({ open: true })),
    );
  });

  it("opens the Cadde promotion panel from the profile menu", async () => {
    const user = userEvent.setup();
    render(<ProfileSwitcherMenu currentItemId="a" />);

    await user.click(screen.getByRole("button", { name: /Diğer Profiller/i }));
    await user.click(await screen.findByText("Caddeye reklam ver"));

    expect(navigateSpy).toHaveBeenCalledWith("/profile#cadde-tanitim");
  });
});

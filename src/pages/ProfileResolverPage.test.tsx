import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ProfileResolverPage from "@/pages/ProfileResolverPage";

const useAuthMock = vi.fn();
const getCurrentMemberCatalogProfileMock = vi.fn();
const getMyEditableCatalogItemsMock = vi.fn();

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/member-catalog", () => ({
  getCurrentMemberCatalogProfile: () => getCurrentMemberCatalogProfileMock(),
  getMyEditableCatalogItems: () => getMyEditableCatalogItemsMock(),
}));

const memberItem = (overrides: Record<string, unknown> = {}) => ({
  itemId: "item-1",
  slug: "member-abc",
  title: "Test User",
  itemType: "member",
  roleKey: "Consultant_PracticalLife",
  accessLevel: "owner",
  isPrimaryOwner: true,
  createdAt: null,
  legacyProfileType: "danisman",
  ...overrides,
});

const authedUser = () => {
  useAuthMock.mockReturnValue({
    user: { id: "u-1", email: "user@test.com", user_metadata: {} },
    isLoading: false,
  });
};

describe("ProfileResolverPage", () => {
  it("redirects flat-role member item to its mapped UI category", async () => {
    authedUser();
    getCurrentMemberCatalogProfileMock.mockResolvedValue(null);
    getMyEditableCatalogItemsMock.mockResolvedValue([memberItem()]);

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<ProfileResolverPage />} />
          <Route path="/profile/danisman" element={<div>Danisman Profil</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Danisman Profil")).toBeInTheDocument();
  });

  it("redirects to default category when user has no editable items", async () => {
    authedUser();
    getCurrentMemberCatalogProfileMock.mockResolvedValue(null);
    getMyEditableCatalogItemsMock.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<ProfileResolverPage />} />
          <Route path="/profile/bireysel" element={<div>Bireysel Profil</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Bireysel Profil")).toBeInTheDocument();
  });

  it("maps current profile flat role key when there is no member item", async () => {
    authedUser();
    getCurrentMemberCatalogProfileMock.mockResolvedValue({
      itemId: "item-9",
      userId: "u-1",
      fullName: "Test User",
      profileType: "Organization_AssociationFoundation",
      createdAt: null,
    });
    getMyEditableCatalogItemsMock.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<ProfileResolverPage />} />
          <Route path="/profile/kurulus-dernek" element={<div>Kurulus Profil</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Kurulus Profil")).toBeInTheDocument();
  });

  it("shows the selector when user has multiple editable items", async () => {
    authedUser();
    getCurrentMemberCatalogProfileMock.mockResolvedValue(null);
    getMyEditableCatalogItemsMock.mockResolvedValue([
      memberItem(),
      memberItem({ itemId: "item-2", slug: "isletme-xyz", title: "Test Business", itemType: "business", roleKey: "Business_RestaurantCafe", legacyProfileType: "isletme" }),
    ]);

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<ProfileResolverPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Düzenlemek istediğin profili seç/i)).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("Test Business")).toBeInTheDocument();
  });
});

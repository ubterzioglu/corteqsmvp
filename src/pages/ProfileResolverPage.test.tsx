import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ProfileResolverPage from "@/pages/ProfileResolverPage";

const useAuthMock = vi.fn();
const rpcMock = vi.fn();
const getCurrentMemberCatalogProfileMock = vi.fn();

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/member-catalog", () => ({
  getCurrentMemberCatalogProfile: () => getCurrentMemberCatalogProfileMock(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

describe("ProfileResolverPage", () => {
  it("redirects to assigned profile type", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "u-1", email: "user@test.com", user_metadata: {} },
      isLoading: false,
    });

    getCurrentMemberCatalogProfileMock.mockResolvedValue({ profileType: "danisman" });

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

  it("lets user pick type and continues", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "u-1", email: "user@test.com", user_metadata: {} },
      isLoading: false,
    });

    getCurrentMemberCatalogProfileMock.mockResolvedValue(null);
    rpcMock.mockResolvedValue({ error: null });

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<ProfileResolverPage />} />
          <Route path="/profile/isletme" element={<div>Isletme Profil</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /İşletme/i }));
    fireEvent.click(screen.getByRole("button", { name: /Devam Et/i }));

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("set_current_member_catalog_role", {
        p_role_key: "isletme",
      });
    });
    expect(await screen.findByText("Isletme Profil")).toBeInTheDocument();
  });
});

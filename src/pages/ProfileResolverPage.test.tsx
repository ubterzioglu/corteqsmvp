import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ProfileResolverPage from "@/pages/ProfileResolverPage";

const useAuthMock = vi.fn();
const maybeSingleMock = vi.fn();
const upsertMock = vi.fn();
const eqMock = vi.fn();
const selectMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

describe("ProfileResolverPage", () => {
  it("redirects to assigned profile type", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "u-1", email: "user@test.com", user_metadata: {} },
      isLoading: false,
    });

    maybeSingleMock.mockResolvedValue({ data: { profile_type: "danisman" }, error: null });
    eqMock.mockReturnValue({ maybeSingle: maybeSingleMock });
    selectMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ select: selectMock });

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

    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    eqMock.mockReturnValue({ maybeSingle: maybeSingleMock });
    selectMock.mockReturnValue({ eq: eqMock });
    upsertMock.mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ select: selectMock, upsert: upsertMock });

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
      expect(upsertMock).toHaveBeenCalled();
    });
    expect(await screen.findByText("Isletme Profil")).toBeInTheDocument();
  });
});

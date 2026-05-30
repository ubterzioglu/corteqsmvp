import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import CaddePage from "@/pages/CaddePage";

const useAuthMock = vi.fn();
const listCaddeFeedMock = vi.fn();
const listCaddeCountriesMock = vi.fn();
const listCaddeCitiesMock = vi.fn();
const listCaddeCafesMock = vi.fn();
const listCaddeBillboardsMock = vi.fn();
const getCaddeSponsoredMock = vi.fn();

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/cadde", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cadde")>("@/lib/cadde");
  return {
    ...actual,
    listCaddeCountries: (...args: unknown[]) => listCaddeCountriesMock(...args),
    listCaddeCities: (...args: unknown[]) => listCaddeCitiesMock(...args),
    listCaddeFeed: (...args: unknown[]) => listCaddeFeedMock(...args),
    listCaddeCafes: (...args: unknown[]) => listCaddeCafesMock(...args),
    listCaddeBillboardCards: (...args: unknown[]) => listCaddeBillboardsMock(...args),
    getCaddeSponsoredPlacement: (...args: unknown[]) => getCaddeSponsoredMock(...args),
  };
});

const renderPage = (entry = "/cadde") => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <CaddePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("CaddePage", () => {
  it("shows a login-gated composer for visitors", async () => {
    useAuthMock.mockReturnValue({ session: null, user: null, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([{ id: "country-de", code: "DE", name: "Almanya" }]);
    listCaddeCitiesMock.mockResolvedValue([{ id: "city-berlin", countryId: "country-de", name: "Berlin", timezone: "Europe/Berlin" }]);
    listCaddeFeedMock.mockResolvedValue({ items: [], nextPage: null });
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);

    renderPage();

    expect(await screen.findByText(/Paylasim ve reaksiyonlar icin giris gerekli/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /giris yap/i }).length).toBeGreaterThan(0);
  });

  it("lets authenticated users switch to real mode from the URL state", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([{ id: "country-de", code: "DE", name: "Almanya" }]);
    listCaddeCitiesMock.mockResolvedValue([{ id: "city-berlin", countryId: "country-de", name: "Berlin", timezone: "Europe/Berlin" }]);
    listCaddeFeedMock.mockResolvedValue({ items: [], nextPage: null });
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);

    renderPage("/cadde?mode=demo");

    expect(await screen.findByText(/Cadde icin sehir bazli paylasim ekleyebilirsin/i)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("switch")[0]);

    await waitFor(() => {
      expect(listCaddeFeedMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ mode: "real" }),
        1,
        "user-1",
      );
    });
  });
});

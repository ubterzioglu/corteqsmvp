import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CaddePage from "@/pages/cadde/CaddePage";
import type { CaddeActorContext } from "@/lib/cadde-rules";

const useAuthMock = vi.fn();
const actorContextMock = vi.fn();

const makeActorContext = (overrides: Partial<CaddeActorContext> = {}): CaddeActorContext => ({
  userId: "user-1",
  roleKey: "User_Standard",
  featureKeys: new Set(["cadde.access", "cadde.post.create"]),
  country: "Almanya",
  city: "Berlin",
  phoneE164: null,
  phoneVerifiedAt: null,
  isPhoneVerified: false,
  phoneRequired: false,
  isTRResident: false,
  isDiasporaResident: true,
  indivRelocating: false,
  digitalCommunityEnabled: false,
  profilePublic: true,
  missingGateFields: [],
  canEnterCadde: true,
  canPostCadde: true,
  canPostKopru: true,
  ...overrides,
});
const listCaddeFeedMock = vi.fn();
const listCaddeCountriesMock = vi.fn();
const listCaddeCitiesMock = vi.fn();
const listCaddeCafesMock = vi.fn();
const listCaddeBillboardsMock = vi.fn();
const getCaddeSponsoredMock = vi.fn();

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/hooks/cadde/useCaddeActorContext", () => ({
  useCaddeActorContext: () => actorContextMock(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/cadde-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cadde-api")>("@/lib/cadde-api");
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
  beforeEach(() => {
    actorContextMock.mockReturnValue({ data: makeActorContext(), isLoading: false });
  });

  it("shows the profile gate with missing fields when the actor context is incomplete", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    actorContextMock.mockReturnValue({
      data: makeActorContext({ country: null, city: null, missingGateFields: ["country", "city"], canEnterCadde: false, canPostCadde: false }),
      isLoading: false,
    });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeFeedMock.mockResolvedValue({ items: [], nextPage: null });
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);

    renderPage();

    expect(await screen.findByText(/Caddeye çıkmak için profilini tamamla/i)).toBeInTheDocument();
    const missingItems = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(missingItems).toEqual(expect.arrayContaining(["Ülke", "Şehir"]));
    expect(screen.getByRole("link", { name: /Profil Ayarlarını Tamamla/i })).toHaveAttribute("href", "/profile?tab=settings");
  });

  it("renders the page normally when the context cannot be loaded (fail-open, DB enforces)", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    actorContextMock.mockReturnValue({ data: null, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeFeedMock.mockResolvedValue({ items: [], nextPage: null });
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);

    renderPage();

    expect(await screen.findByText(/Cadde için şehir bazlı paylaşım ekleyebilirsin/i)).toBeInTheDocument();
    expect(screen.queryByText(/Caddeye çıkmak için profilini tamamla/i)).not.toBeInTheDocument();
  });

  it("shows a login-gated composer for visitors", async () => {
    useAuthMock.mockReturnValue({ session: null, user: null, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([{ id: "country-de", code: "DE", name: "Almanya" }]);
    listCaddeCitiesMock.mockResolvedValue([{ id: "city-berlin", countryId: "country-de", name: "Berlin", timezone: "Europe/Berlin" }]);
    listCaddeFeedMock.mockResolvedValue({ items: [], nextPage: null });
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);

    renderPage();

    expect(await screen.findByText(/Paylaşım ve reaksiyonlar için giriş gerekli/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /giriş yap/i }).length).toBeGreaterThan(0);
  });

  it("defaults to the real feed when no mode param is present (R-01)", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeFeedMock.mockResolvedValue({ items: [], nextPage: null });
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);

    renderPage("/cadde");

    await waitFor(() => {
      expect(listCaddeFeedMock).toHaveBeenCalledWith(
        expect.objectContaining({ mode: "real" }),
        null,
        "user-1",
      );
    });
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

    expect(await screen.findByText(/Cadde için şehir bazlı paylaşım ekleyebilirsin/i)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("switch")[0]);

    await waitFor(() => {
      expect(listCaddeFeedMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ mode: "real" }),
        null,
        "user-1",
      );
    });
  });
});

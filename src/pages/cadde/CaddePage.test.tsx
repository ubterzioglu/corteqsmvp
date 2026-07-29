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
const countCaddePostsSinceMock = vi.fn();
const listCaddePromotionsMock = vi.fn();

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
    countCaddePostsSince: (...args: unknown[]) => countCaddePostsSinceMock(...args),
  };
});

vi.mock("@/lib/cadde-tanitim-api", () => ({
  listCaddePromotions: (...args: unknown[]) => listCaddePromotionsMock(...args),
}));

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
    countCaddePostsSinceMock.mockResolvedValue(0);
    listCaddePromotionsMock.mockResolvedValue([]);
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

    // Composer artık tek kutu: başlıklı kart yerine aria-label'lı metin alanı.
    expect(await screen.findByLabelText("Paylaşım metni")).toBeInTheDocument();
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

    expect(await screen.findByText(/Ziyaretçiler akışı görebilir/i)).toBeInTheDocument();
    // Girişsiz ziyaretçiye paylaşım kutusu hiç render edilmez.
    expect(screen.queryByLabelText("Paylaşım metni")).not.toBeInTheDocument();
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
        "tr",
      );
    });
  });

  it("hides the demo/real toggle from the public UI (sosyal akış yalnız gerçek)", async () => {
    // Ürün kararı (2026-06-15): Gerçek/Demo switch'i public Cadde'den kaldırıldı.
    // ?mode=demo URL'i hâlâ parse edilir (admin/QA için) ama UI'da toggle yok ve
    // composer normal şekilde görünür.
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([{ id: "country-de", code: "DE", name: "Almanya" }]);
    listCaddeCitiesMock.mockResolvedValue([{ id: "city-berlin", countryId: "country-de", name: "Berlin", timezone: "Europe/Berlin" }]);
    listCaddeFeedMock.mockResolvedValue({ items: [], nextPage: null });
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);

    renderPage("/cadde");

    // Composer artık tek kutu: başlıklı kart yerine aria-label'lı metin alanı.
    expect(await screen.findByLabelText("Paylaşım metni")).toBeInTheDocument();
    // "Gerçek / Demo" etiketi artık public UI'da görünmemeli.
    expect(screen.queryByText(/Gerçek \/ Demo/i)).not.toBeInTheDocument();
  });

  it("keeps comment composer collapsed by default and expands only for the selected post", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);
    listCaddeFeedMock.mockResolvedValue({
      items: [
        {
          id: "post-1",
          mode: "real",
          type: "text",
          title: "Berlin'de yeni bir başlangıç",
          body: "İlk paylaşım gövdesi",
          authorName: "Ayşe",
          authorRole: "Üye",
          authorAvatarUrl: null,
          authorUserId: "user-2",
          country: "Almanya",
          city: "Berlin",
          isBridge: false,
          pinned: false,
          createdAt: "2026-06-23T10:00:00Z",
          needCategory: null,
          interests: [],
          hashtags: [],
          mentions: [],
          media: [],
          reactionCounts: { like: 1, support: 0, idea: 0 },
          totalReactionCount: 1,
          commentCount: 3,
          comments: [
            { id: "comment-1", postId: "post-1", userId: "u1", body: "İlk yorum", authorName: "Zeynep", createdAt: "2026-06-23T10:01:00Z" },
            { id: "comment-2", postId: "post-1", userId: "u2", body: "İkinci yorum", authorName: "Mert", createdAt: "2026-06-23T10:02:00Z" },
            { id: "comment-3", postId: "post-1", userId: "u3", body: "Üçüncü yorum", authorName: "Deniz", createdAt: "2026-06-23T10:03:00Z" },
          ],
          viewerReactions: [],
        },
      ],
      nextPage: null,
    });

    renderPage();

    expect(await screen.findByText("Berlin'de yeni bir başlangıç")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Yorum yaz")).not.toBeInTheDocument();
    expect(screen.queryByText("Üçüncü yorum")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("cadde-comment-toggle"));

    expect(await screen.findByPlaceholderText("Yorum yaz")).toBeInTheDocument();
    expect(screen.getByText("Üçüncü yorum")).toBeInTheDocument();
  });

  it("shows invitation-style empty states when cafes, promotions and billboards are empty", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeFeedMock.mockResolvedValue({ items: [], nextPage: null });
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);

    renderPage();

    expect(await screen.findByTestId("cadde-feed-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("cadde-cafes-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("cadde-promotions-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("cadde-billboards-empty-state")).toBeInTheDocument();
  });

  it("shows a compact login CTA in the comment panel for visitors", async () => {
    useAuthMock.mockReturnValue({ session: null, user: null, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);
    listCaddeFeedMock.mockResolvedValue({
      items: [
        {
          id: "post-visitor",
          mode: "real",
          type: "question",
          title: null,
          body: "Burası ziyaretçi testi",
          authorName: "Elif",
          authorRole: null,
          authorAvatarUrl: null,
          authorUserId: null,
          country: null,
          city: null,
          isBridge: false,
          pinned: false,
          createdAt: "2026-06-23T10:00:00Z",
          needCategory: null,
          interests: [],
          hashtags: [],
          mentions: [],
          media: [],
          reactionCounts: { like: 0, support: 0, idea: 0 },
          totalReactionCount: 0,
          commentCount: 0,
          comments: [],
          viewerReactions: [],
        },
      ],
      nextPage: null,
    });

    renderPage();

    fireEvent.click(await screen.findByTestId("cadde-comment-toggle"));

    expect(await screen.findByText(/Yorum yazmak için/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Yorum yaz")).not.toBeInTheDocument();
  });
});

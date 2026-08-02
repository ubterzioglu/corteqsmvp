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
const listCaddePostCommentsMock = vi.fn();

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
    listCaddePostComments: (...args: unknown[]) => listCaddePostCommentsMock(...args),
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
    listCaddePostCommentsMock.mockResolvedValue({ items: [], nextCursor: null });
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

  it("keeps comments lazy until the selected post is expanded", async () => {
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
          reactionCounts: { like: 1, love: 0, haha: 0, support: 0, unsure: 0 },
          totalReactionCount: 1,
          commentCount: 3,
          comments: [],
          viewerReactions: [],
        },
      ],
      nextPage: null,
    });
    listCaddePostCommentsMock.mockResolvedValue({
      items: [
        { id: "comment-1", postId: "post-1", userId: "u1", body: "İlk yorum", authorName: "Zeynep", createdAt: "2026-06-23T10:01:00Z" },
        { id: "comment-2", postId: "post-1", userId: "u2", body: "İkinci yorum", authorName: "Mert", createdAt: "2026-06-23T10:02:00Z" },
        { id: "comment-3", postId: "post-1", userId: "u3", body: "Üçüncü yorum", authorName: "Deniz", createdAt: "2026-06-23T10:03:00Z" },
      ],
      nextCursor: null,
    });

    renderPage();

    expect(await screen.findByText("Berlin'de yeni bir başlangıç")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3 yorum" })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Yorum yaz")).not.toBeInTheDocument();
    expect(screen.queryByText("İlk yorum")).not.toBeInTheDocument();
    expect(listCaddePostCommentsMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("cadde-comment-toggle"));

    expect(await screen.findByPlaceholderText("Yorum yaz")).toBeInTheDocument();
    expect(listCaddePostCommentsMock).toHaveBeenCalledWith("post-1", 5, null);
    expect(await screen.findByText("İlk yorum")).toBeInTheDocument();
    expect(screen.getByText("Üçüncü yorum")).toBeInTheDocument();
  });

  it("loads additional comment pages on demand", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);
    listCaddeFeedMock.mockResolvedValue({
      items: [
        {
          id: "post-load-more",
          mode: "real",
          type: "text",
          title: "Yorum sayfalama testi",
          body: "Yorumlar panel açılınca sayfalanır.",
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
          reactionCounts: { like: 0, love: 0, haha: 0, support: 0, unsure: 0 },
          totalReactionCount: 0,
          commentCount: 6,
          comments: [],
          viewerReactions: [],
        },
      ],
      nextPage: null,
    });
    listCaddePostCommentsMock
      .mockResolvedValueOnce({
        items: [
          { id: "comment-1", postId: "post-load-more", userId: "u1", body: "Birinci yorum", authorName: "Zeynep", createdAt: "2026-06-23T10:01:00Z" },
          { id: "comment-2", postId: "post-load-more", userId: "u2", body: "İkinci yorum", authorName: "Mert", createdAt: "2026-06-23T10:02:00Z" },
          { id: "comment-3", postId: "post-load-more", userId: "u3", body: "Üçüncü yorum", authorName: "Deniz", createdAt: "2026-06-23T10:03:00Z" },
          { id: "comment-4", postId: "post-load-more", userId: "u4", body: "Dördüncü yorum", authorName: "Ece", createdAt: "2026-06-23T10:04:00Z" },
          { id: "comment-5", postId: "post-load-more", userId: "u5", body: "Beşinci yorum", authorName: "Can", createdAt: "2026-06-23T10:05:00Z" },
        ],
        nextCursor: "2026-06-23T10:05:00Z",
      })
      .mockResolvedValueOnce({
        items: [
          { id: "comment-6", postId: "post-load-more", userId: "u6", body: "Altıncı yorum", authorName: "Nil", createdAt: "2026-06-23T10:06:00Z" },
        ],
        nextCursor: null,
      });

    renderPage();

    fireEvent.click(await screen.findByTestId("cadde-comment-toggle"));
    expect(await screen.findByText("Beşinci yorum")).toBeInTheDocument();
    expect(screen.queryByText("Altıncı yorum")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Devamını yükle/i }));

    expect(await screen.findByText("Altıncı yorum")).toBeInTheDocument();
    expect(listCaddePostCommentsMock).toHaveBeenLastCalledWith("post-load-more", 5, "2026-06-23T10:05:00Z");
    expect(screen.queryByRole("button", { name: /Devamını yükle/i })).not.toBeInTheDocument();
  });

  it("shows the five reaction actions directly without a popover", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);
    listCaddeFeedMock.mockResolvedValue({
      items: [
        {
          id: "post-reactions",
          mode: "real",
          type: "text",
          title: "Tepki seti testi",
          body: "Tepkiler kart aksiyon satırında açık görünür.",
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
          reactionCounts: { like: 1, love: 2, haha: 3, support: 4, unsure: 5 },
          totalReactionCount: 15,
          commentCount: 0,
          comments: [],
          viewerReactions: ["love"],
        },
      ],
      nextPage: null,
    });

    renderPage();

    expect(await screen.findByText("Tepki seti testi")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tepki Ver/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Beğendim (1)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kalp (2)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gülme (3)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Destek (4)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Emin olamadım (5)" })).toBeInTheDocument();
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

  it("routes authenticated promotion CTAs to the profile promotion panel", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeFeedMock.mockResolvedValue({ items: [], nextPage: null });
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);

    renderPage();

    expect(await screen.findByTestId("cadde-featured-empty-state")).toBeInTheDocument();
    const profileLinks = screen.getAllByRole("link", { name: /Profilinden İlk Tanıtımını Yap/i });
    expect(profileLinks.length).toBeGreaterThanOrEqual(2);
    profileLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/profile#cadde-tanitim");
    });
  });

  it("keeps promotion CTAs signup-bound for visitors", async () => {
    useAuthMock.mockReturnValue({ session: null, user: null, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeFeedMock.mockResolvedValue({ items: [], nextPage: null });
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);

    renderPage();

    const signupLinks = await screen.findAllByRole("link", { name: /Profil Aç ve Tanıtıma Başla/i });
    expect(signupLinks.length).toBeGreaterThanOrEqual(2);
    signupLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/login?mode=signup");
    });
  });

  // Workshop m41/m44: featured kayıt sağ kolonun tepesindeki yuvaya çıkar, listede tekrar etmez.
  it("routes the featured billboard to the spotlight slot and keeps the rest in the list", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeFeedMock.mockResolvedValue({ items: [], nextPage: null });
    listCaddeCafesMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);
    listCaddeBillboardsMock.mockResolvedValue([
      {
        id: "featured-1",
        type: "consultant",
        title: "Almanya 101",
        subtitle: null,
        description: "Taşınma rehberi",
        badgeText: null,
        ctaLabel: "Profili Gör",
        ctaUrl: "/directory/profile/u-1",
        imageUrl: null,
        isFeatured: true,
      },
      {
        id: "normal-1",
        type: "business",
        title: "Anadolu Mutfak",
        subtitle: null,
        description: "Mekan tanıtımı",
        badgeText: null,
        ctaLabel: "Mekanı Keşfet",
        ctaUrl: "/commercial/community-leader",
        imageUrl: null,
        isFeatured: false,
      },
    ]);

    renderPage();

    expect(await screen.findByTestId("cadde-featured-spotlight")).toBeInTheDocument();
    // Featured kayıt yalnız yuvada: başlık tek kez geçer.
    expect(screen.getAllByText("Almanya 101")).toHaveLength(1);
    // Featured varken liste yalnız diğer featured kayıtları gösterir (bu senaryoda boş).
    expect(screen.getByTestId("cadde-billboards-empty-state")).toBeInTheDocument();
    expect(screen.queryByText("Anadolu Mutfak")).not.toBeInTheDocument();
  });

  it("falls back to published billboards when nothing is featured", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeFeedMock.mockResolvedValue({ items: [], nextPage: null });
    listCaddeCafesMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);
    listCaddeBillboardsMock.mockResolvedValue([
      {
        id: "normal-1",
        type: "business",
        title: "Anadolu Mutfak",
        subtitle: null,
        description: "Mekan tanıtımı",
        badgeText: null,
        ctaLabel: "Mekanı Keşfet",
        ctaUrl: "/commercial/community-leader",
        imageUrl: null,
        isFeatured: false,
      },
    ]);

    renderPage();

    expect(await screen.findByText("Anadolu Mutfak")).toBeInTheDocument();
    expect(screen.queryByTestId("cadde-featured-spotlight")).not.toBeInTheDocument();
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
          reactionCounts: { like: 0, love: 0, haha: 0, support: 0, unsure: 0 },
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

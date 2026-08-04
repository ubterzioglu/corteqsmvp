import { createEvent, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
const createCaddeCommentMock = vi.fn();
const createCaddePostMock = vi.fn();
const recordCaddeShareMock = vi.fn();

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
    createCaddeComment: (...args: unknown[]) => createCaddeCommentMock(...args),
    createCaddePost: (...args: unknown[]) => createCaddePostMock(...args),
    recordCaddeShare: (...args: unknown[]) => recordCaddeShareMock(...args),
  };
});

vi.mock("@/lib/cadde-tanitim-api", () => ({
  listCaddePromotions: (...args: unknown[]) => listCaddePromotionsMock(...args),
}));

vi.mock("@/lib/cadde-feed-polling", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cadde-feed-polling")>("@/lib/cadde-feed-polling");
  return {
    ...actual,
    caddeOpenCommentsPollInterval: () => 100,
  };
});

vi.mock("@/components/cadde/CaddeEmojiPickerContent", () => ({
  default: ({ onSelect }: { onSelect: (emoji: string) => void }) => (
    <button type="button" onClick={() => onSelect("😊")}>
      😊
    </button>
  ),
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
    createCaddeCommentMock.mockResolvedValue(undefined);
    createCaddePostMock.mockResolvedValue("post-created");
    recordCaddeShareMock.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
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

  it("uses the registered profile location for new posts instead of the active filter or bridge toggle", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    actorContextMock.mockReturnValue({ data: makeActorContext({ country: "Almanya", city: "Berlin" }), isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([
      { id: "country-de", code: "DE", name: "Almanya" },
      { id: "country-nl", code: "NL", name: "Hollanda" },
    ]);
    listCaddeCitiesMock.mockResolvedValue([
      { id: "city-berlin", countryId: "country-de", name: "Berlin", timezone: "Europe/Berlin" },
      { id: "city-amsterdam", countryId: "country-nl", name: "Amsterdam", timezone: "Europe/Amsterdam" },
    ]);
    listCaddeFeedMock.mockResolvedValue({ items: [], nextPage: null });
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);

    renderPage("/cadde?country=Hollanda&city=Amsterdam&bridge=1");

    fireEvent.change(await screen.findByLabelText("Paylaşım metni"), { target: { value: "Profil konumumdan paylaşım" } });
    fireEvent.click(screen.getByRole("button", { name: "Paylaş" }));

    await waitFor(() =>
      expect(createCaddePostMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: "Profil konumumdan paylaşım",
          countryId: "Almanya",
          cityId: "Berlin",
          targets: [{ country: "Almanya", city: "Berlin" }],
          isBridge: false,
        }),
      ),
    );
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

  // WS2 m80+m81: Enter yalnız satır atlar; yorum SADECE "Gönder" butonuyla yayınlanır.
  // Bu, WS1 m22'nin (Enter gönderir) bilinçli geri alınmasıdır — 04.08.2026 workshop kararı.
  it("keeps Enter as a line break and publishes comments only via the send button", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);
    listCaddeFeedMock.mockResolvedValue({
      items: [
        {
          id: "post-enter",
          mode: "real",
          type: "text",
          title: "Enter yorumu",
          body: "Yorum gönderimi klavye ile çalışır.",
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
          commentCount: 1,
          comments: [],
          viewerReactions: [],
        },
      ],
      nextPage: null,
    });
    listCaddePostCommentsMock.mockResolvedValue({
      items: [{ id: "comment-enter", postId: "post-enter", userId: "u1", body: "Mevcut yorum", authorName: "Zeynep", createdAt: "2026-06-23T10:01:00Z" }],
      nextCursor: null,
    });

    renderPage();

    fireEvent.click(await screen.findByTestId("cadde-comment-toggle"));
    const textarea = await screen.findByPlaceholderText("Yorum yaz");
    expect(textarea).toHaveClass("min-h-[64px]");
    expect(await screen.findByTestId("cadde-comment-card")).toHaveClass("py-2.5");

    // Enter artık gönderim tetiklemez ve varsayılanı engellemez → imleç yeni satıra iner.
    fireEvent.change(textarea, { target: { value: "Satır 1" } });
    const enter = createEvent.keyDown(textarea, { key: "Enter", code: "Enter" });
    fireEvent(textarea, enter);
    expect(enter.defaultPrevented).toBe(false);
    expect(createCaddeCommentMock).not.toHaveBeenCalled();

    const shiftEnter = createEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: true });
    fireEvent(textarea, shiftEnter);
    expect(shiftEnter.defaultPrevented).toBe(false);
    expect(createCaddeCommentMock).not.toHaveBeenCalled();

    // Yayınlamanın tek yolu Gönder butonu.
    fireEvent.change(textarea, { target: { value: "Butonla yorum" } });
    fireEvent.click(screen.getByRole("button", { name: /Gönder/i }));

    await waitFor(() => expect(createCaddeCommentMock).toHaveBeenCalledWith("post-enter", "Butonla yorum"));
  });

  it("inserts a selected emoji into the open comment draft at the current caret", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);
    listCaddeFeedMock.mockResolvedValue({
      items: [
        {
          id: "post-comment-emoji",
          mode: "real",
          type: "text",
          title: "Emoji yorumu",
          body: "Yorum draft'i emoji alır.",
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
          commentCount: 0,
          shareCount: 0,
          comments: [],
          viewerReactions: [],
        },
      ],
      nextPage: null,
    });
    listCaddePostCommentsMock.mockResolvedValue({ items: [], nextCursor: null });

    renderPage();

    fireEvent.click(await screen.findByTestId("cadde-comment-toggle"));
    const panel = await screen.findByTestId("cadde-comment-panel");
    const textarea = await screen.findByPlaceholderText("Yorum yaz") as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: "Merhaba dunya" } });
    textarea.setSelectionRange(8, 8);
    fireEvent.click(textarea);
    fireEvent.click(within(panel).getByRole("button", { name: "Emoji ekle" }));
    fireEvent.click(await screen.findByRole("button", { name: "😊" }));

    await waitFor(() => expect(textarea).toHaveValue("Merhaba 😊dunya"));
    fireEvent.click(within(panel).getByRole("button", { name: "Gönder" }));

    await waitFor(() => expect(createCaddeCommentMock).toHaveBeenCalledWith("post-comment-emoji", "Merhaba 😊dunya"));
  });

  it("polls only the opened comment panel and merges newly fetched comments", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);
    listCaddeFeedMock.mockResolvedValue({
      items: [
        {
          id: "post-poll",
          mode: "real",
          type: "text",
          title: "Auto-refresh yorumu",
          body: "Açık panel karşı taraf yorumunu sessiz alır.",
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
          commentCount: 1,
          comments: [],
          viewerReactions: [],
        },
      ],
      nextPage: null,
    });
    listCaddePostCommentsMock
      .mockResolvedValueOnce({
        items: [{ id: "comment-poll-1", postId: "post-poll", userId: "u1", body: "İlk yorum", authorName: "Zeynep", createdAt: "2026-06-23T10:01:00Z" }],
        nextCursor: null,
      })
      .mockResolvedValueOnce({
        items: [
          { id: "comment-poll-1", postId: "post-poll", userId: "u1", body: "İlk yorum", authorName: "Zeynep", createdAt: "2026-06-23T10:01:00Z" },
          { id: "comment-poll-2", postId: "post-poll", userId: "u2", body: "Karşı yorum", authorName: "Mert", createdAt: "2026-06-23T10:02:00Z" },
        ],
        nextCursor: null,
      });

    renderPage();

    fireEvent.click(await screen.findByTestId("cadde-comment-toggle"));
    expect(await screen.findByText("İlk yorum")).toBeInTheDocument();
    expect(listCaddePostCommentsMock.mock.calls.length).toBeGreaterThanOrEqual(1);

    await waitFor(() => expect(listCaddePostCommentsMock.mock.calls.length).toBeGreaterThanOrEqual(2));
    expect(await screen.findByText("Karşı yorum")).toBeInTheDocument();

    const callsAfterRefresh = listCaddePostCommentsMock.mock.calls.length;
    fireEvent.click(screen.getByTestId("cadde-comment-toggle"));
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(listCaddePostCommentsMock).toHaveBeenCalledTimes(callsAfterRefresh);
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

  it("shares a post with the Web Share API and records the share", async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: shareMock });
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);
    listCaddeFeedMock.mockResolvedValue({
      items: [
        {
          id: "post-share-web",
          mode: "real",
          type: "text",
          title: "Paylaşılacak konu",
          body: "Bu post Web Share API ile paylaşılır.",
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
          commentCount: 0,
          shareCount: 0,
          comments: [],
          viewerReactions: [],
        },
      ],
      nextPage: null,
    });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Paylaş (0)" }));

    await waitFor(() => expect(shareMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "Paylaşılacak konu",
      text: "Bu post Web Share API ile paylaşılır.",
      url: expect.stringContaining("/cadde?post=post-share-web"),
    })));
    await waitFor(() => expect(recordCaddeShareMock).toHaveBeenCalledWith("post-share-web", "web_share"));
  });

  it("copies the post link when Web Share is unavailable and records the share", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: writeTextMock } });
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);
    listCaddeFeedMock.mockResolvedValue({
      items: [
        {
          id: "post-share-copy",
          mode: "real",
          type: "text",
          title: null,
          body: "Bu post link kopyalama ile paylaşılır.",
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
          commentCount: 0,
          shareCount: 2,
          comments: [],
          viewerReactions: [],
        },
      ],
      nextPage: null,
    });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Paylaş (2)" }));

    await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining("/cadde?post=post-share-copy")));
    await waitFor(() => expect(recordCaddeShareMock).toHaveBeenCalledWith("post-share-copy", "copy_link"));
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
    // m52: konum seçili DEĞİLKEN mesaj yer adı uydurmaz.
    expect(screen.getByTestId("cadde-cafes-empty-state")).toHaveTextContent(
      "Henüz aktif bir cafe açılmadı.",
    );
  });

  // m52: "Henüz cafe açılmadı" şablonu seçili ülke/şehri adıyla söyler.
  it("names the selected location in the empty cafes state", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCaddeCountriesMock.mockResolvedValue([]);
    listCaddeCitiesMock.mockResolvedValue([]);
    listCaddeFeedMock.mockResolvedValue({ items: [], nextPage: null });
    listCaddeCafesMock.mockResolvedValue([]);
    listCaddeBillboardsMock.mockResolvedValue([]);
    getCaddeSponsoredMock.mockResolvedValue(null);

    renderPage("/cadde?country=Almanya&city=Dortmund");

    // Şehir ülkeden önce gelir; ek üretilmez (yabancı adlarda ünlü uyumu güvenilir değil).
    expect(await screen.findByTestId("cadde-cafes-empty-state")).toHaveTextContent(
      "Dortmund için henüz aktif bir cafe açılmadı.",
    );
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

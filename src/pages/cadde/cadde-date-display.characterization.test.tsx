// Cadde tarih metni — KARAKTERİZASYON (W3 tarih biçimleyici tekilleştirmesi, 07.11).
//
// CLAUDE.md kuralı: "Cadde dosyalarına dokunurken: önce karakterizasyon testi". Bu dosya
// altı Cadde yüzeyinin EKRANDA GÖRÜNEN tarih metnini, dosya içi `formatDate` /
// `formatDateTime` kopyaları ortak `@/lib/format-date` yardımcılarına taşınmadan ÖNCE
// kilitledi ve geçişten sonra değiştirilmeden geçer.
//
// Beklenen metin `Intl` seçenekleriyle DEĞİL, yerel `Date` alıcılarından ve elle yazılmış
// Türkçe ay adlarından kurulur (format-date.test.ts deseni) → test makinenin saat
// diliminden bağımsızdır ve biçimleyiciyi kendisiyle doğrulayan bir totoloji değildir.
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CaddeCafesPanel from "@/components/cadde/CaddeCafesPanel";
import CaddeMyContentCard from "@/components/cadde/CaddeMyContentCard";
import CaddeCafePage from "@/pages/cadde/CaddeCafePage";
import CaddeCarsiItemPage from "@/pages/cadde/CaddeCarsiItemPage";
import CaddeCarsiPage from "@/pages/cadde/CaddeCarsiPage";
import CaddePage from "@/pages/cadde/CaddePage";
import type { CaddeActorContext } from "@/lib/cadde/cadde-rules";
import type { CaddeCafe, CarsiItem } from "@/lib/cadde/cadde-types";

const SHORT_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const LONG_MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];
const pad = (n: number) => String(n).padStart(2, "0");

/** "05 Mar 09:07" — akış, kafe ve profil kartlarının yılsız biçimi. */
const dayMonthTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getDate())} ${SHORT_MONTHS[d.getMonth()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
/** "05 Mar" — Çarşı kartlarının yılsız biçimi. */
const dayMonth = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getDate())} ${SHORT_MONTHS[d.getMonth()]}`;
};
/** "05 Mart 2026" — Çarşı ilan detayının biçimi. */
const paddedLongDate = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getDate())} ${LONG_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

// 12:00 UTC civarı: UTC-11…UTC+11 arasındaki her dilimde aynı gün. Tek haneli gün ve
// dakika, iki haneli doldurmayı da kilitler.
const STARTS_AT = "2026-03-05T12:07:00Z";
const ENDS_AT = "2026-04-09T11:45:00Z";
const POST_AT = "2026-02-03T12:04:00Z";

// vi.mock fabrikaları dosyanın en üstüne taşınır; içlerinde kullanılan sahteler bu yüzden
// vi.hoisted ile, fabrikalardan ÖNCE kurulur.
const { api, carsi, useAuthMock, actorContextMock, toastMock, listCaddePromotionsMock } = vi.hoisted(() => ({
  api: {
    getCaddeCafe: vi.fn(),
    listCaddeCafeFeed: vi.fn(),
    listCaddeCafeMembers: vi.fn(),
    listCaddePostComments: vi.fn(),
    listMyCaddeCafes: vi.fn(),
    listCaddeCountries: vi.fn(),
    listCaddeCities: vi.fn(),
    listCaddeFeed: vi.fn(),
    listCaddeCafes: vi.fn(),
    listCaddeBillboardCards: vi.fn(),
    getCaddeSponsoredPlacement: vi.fn(),
    countCaddePostsSince: vi.fn(),
    listTrendingCaddeHashtags: vi.fn(),
  },
  carsi: {
    listCarsiItems: vi.fn(),
    listCarsiCategories: vi.fn(),
    listMyCarsiItems: vi.fn(),
    getCarsiItem: vi.fn(),
    getCarsiPaidMode: vi.fn(),
  },
  useAuthMock: vi.fn(),
  actorContextMock: vi.fn(),
  toastMock: vi.fn(),
  listCaddePromotionsMock: vi.fn(),
}));

vi.mock("@/components/auth/useAuth", () => ({ useAuth: () => useAuthMock() }));
vi.mock("@/hooks/cadde/useCaddeActorContext", () => ({ useCaddeActorContext: () => actorContextMock() }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastMock }) }));

vi.mock("@/lib/cadde/cadde-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cadde/cadde-api")>("@/lib/cadde/cadde-api");
  return { ...actual, ...api };
});

vi.mock("@/lib/cadde/cadde-carsi-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cadde/cadde-carsi-api")>("@/lib/cadde/cadde-carsi-api");
  return { ...actual, ...carsi };
});

vi.mock("@/lib/cadde/cadde-cafe-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cadde/cadde-cafe-api")>("@/lib/cadde/cadde-cafe-api");
  return { ...actual, listCaddeCafeThemes: vi.fn().mockResolvedValue([]) };
});

vi.mock("@/lib/cadde/cadde-notifications-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cadde/cadde-notifications-api")>(
    "@/lib/cadde/cadde-notifications-api",
  );
  return {
    ...actual,
    listMyNotifications: vi.fn().mockResolvedValue([]),
    markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
    markNotificationRead: vi.fn().mockResolvedValue(undefined),
    subscribeToMyNotifications: vi.fn(() => () => {}),
  };
});

vi.mock("@/lib/cadde/cadde-tanitim-api", () => ({ listCaddePromotions: listCaddePromotionsMock }));

vi.mock("@/components/cadde/CaddeEmojiPickerContent", () => ({ default: () => null }));

const makeActorContext = (): CaddeActorContext => ({
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
});

const makeCafe = (overrides: Partial<CaddeCafe> = {}): CaddeCafe => ({
  id: "cafe-1",
  title: "Berlin IT Sohbeti",
  summary: "",
  hostName: "Ayşe U.",
  country: "Almanya",
  city: "Berlin",
  isBridge: false,
  isFree: true,
  startsAt: STARTS_AT,
  endsAt: ENDS_AT,
  isActive: true,
  memberCount: 3,
  joinedByViewer: false,
  mode: "real",
  slug: null,
  themeKey: null,
  entryMode: "open",
  entryQuestion: null,
  capacity: null,
  archivedAt: null,
  hostUserId: "host-1",
  viewerMemberStatus: null,
  logoUrl: null,
  ...overrides,
});

const makeCarsiItem = (overrides: Partial<CarsiItem> = {}): CarsiItem => ({
  id: "item-1",
  ownerUserId: "owner-1",
  ownerName: "Mert K.",
  categoryKey: "second_hand",
  categoryLabel: "İkinci El",
  title: "IKEA çalışma masası",
  description: "Az kullanılmış, Berlin içi teslim.",
  priceAmount: 40,
  priceCurrency: "EUR",
  country: "Almanya",
  city: "Berlin",
  imageUrls: [],
  videoUrl: null,
  contactMode: "platform",
  contactValue: null,
  paymentStatus: "free",
  status: "published",
  expiresAt: ENDS_AT,
  createdAt: STARTS_AT,
  ...overrides,
});

const renderAt = (entry: string, path: string, element: ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path={path} element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const bodyText = () => document.body.textContent ?? "";

describe("Cadde tarih metni karakterizasyonu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ session: { user: { id: "owner-1" } }, user: { id: "owner-1" }, isLoading: false });
    actorContextMock.mockReturnValue({ data: makeActorContext(), isLoading: false });
    api.getCaddeCafe.mockResolvedValue(null);
    api.listCaddeCafeFeed.mockResolvedValue([]);
    api.listCaddeCafeMembers.mockResolvedValue([]);
    api.listCaddePostComments.mockResolvedValue({ items: [], nextCursor: null });
    api.listMyCaddeCafes.mockResolvedValue([]);
    api.listCaddeCountries.mockResolvedValue([]);
    api.listCaddeCities.mockResolvedValue([]);
    api.listCaddeFeed.mockResolvedValue({ items: [], nextPage: null });
    api.listCaddeCafes.mockResolvedValue([]);
    api.listCaddeBillboardCards.mockResolvedValue([]);
    api.getCaddeSponsoredPlacement.mockResolvedValue(null);
    api.countCaddePostsSince.mockResolvedValue(0);
    api.listTrendingCaddeHashtags.mockResolvedValue([]);
    carsi.listCarsiItems.mockResolvedValue([]);
    carsi.listCarsiCategories.mockResolvedValue([{ key: "second_hand", labelTr: "İkinci El", sortOrder: 10 }]);
    carsi.listMyCarsiItems.mockResolvedValue([]);
    carsi.getCarsiItem.mockResolvedValue(null);
    carsi.getCarsiPaidMode.mockResolvedValue(false);
    listCaddePromotionsMock.mockResolvedValue([]);
  });

  it("CaddeFeedView: akış kartı konum + yılsız gün/ay/saat yazar", async () => {
    api.listCaddeFeed.mockResolvedValue({
      items: [
        {
          id: "post-1",
          mode: "real",
          type: "text",
          title: "Akış canlı",
          body: "Gövde",
          authorName: "Ayşe",
          authorRole: null,
          authorAvatarUrl: null,
          authorUserId: "user-2",
          country: "Almanya",
          city: "Berlin",
          isBridge: false,
          pinned: false,
          createdAt: POST_AT,
          needCategory: null,
          interests: [],
          hashtags: [],
          mentions: [],
          media: [],
          reactionCounts: { like: 0, support: 0, unsure: 0 },
          totalReactionCount: 0,
          commentCount: 0,
          comments: [],
          viewerReactions: [],
        },
      ],
      nextPage: null,
    });

    renderAt("/cadde", "/cadde", <CaddePage />);

    expect(await screen.findByText("Akış canlı")).toBeInTheDocument();
    expect(bodyText()).toContain(`Almanya • Berlin • ${dayMonthTime(POST_AT)}`);
  });

  it("CaddeCafesPanel: kafe satırı şehir • yılsız başlangıç • üye sayısı yazar", () => {
    render(
      <MemoryRouter>
        <CaddeCafesPanel
          cafes={[makeCafe()]}
          themeLabelByKey={new Map()}
          hasSession={false}
          locationLabel="Berlin"
          sparseContentHint="İçerik az."
          open
          onOpenChange={vi.fn()}
          showAll={false}
          onShowAll={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(bodyText()).toContain(`Berlin • ${dayMonthTime(STARTS_AT)} • 3 üye`);
  });

  it("CaddeCafePage: başlık başlangıç → bitiş, kafe gönderisi yılsız saat yazar", async () => {
    api.getCaddeCafe.mockResolvedValue(makeCafe());
    api.listCaddeCafeFeed.mockResolvedValue([
      {
        id: "cafe-post-1",
        authorName: "Zeynep",
        body: "Merhaba",
        createdAt: POST_AT,
        commentCount: 0,
        media: [],
        mentions: [],
      },
    ]);

    renderAt("/cadde/cafe/cafe-1", "/cadde/cafe/:cafeId", <CaddeCafePage />);

    expect(await screen.findByText("Berlin IT Sohbeti")).toBeInTheDocument();
    // Kalan süre etiketi sabit geçmiş tarihlerde "Sona erdi" olur; parantez ayrımı da kilitlenir.
    expect(bodyText()).toContain(`${dayMonthTime(STARTS_AT)} → ${dayMonthTime(ENDS_AT)} (Sona erdi)`);
    expect(await screen.findByText(dayMonthTime(POST_AT))).toBeInTheDocument();
  });

  it("CaddeMyContentCard: açık kafe satırı 'bitiş' + yılsız gün/ay/saat yazar", async () => {
    api.listMyCaddeCafes.mockResolvedValue([makeCafe()]);

    renderAt("/profile", "/profile", <CaddeMyContentCard />);

    expect(await screen.findByText("Berlin IT Sohbeti")).toBeInTheDocument();
    expect(bodyText()).toContain(`3 üye • bitiş ${dayMonthTime(ENDS_AT)}`);
  });

  it("CaddeCarsiPage: ilan kartı ve İlanlarım satırı yılsız gün/ay yazar", async () => {
    carsi.listCarsiItems.mockResolvedValue([makeCarsiItem({ expiresAt: null })]);
    carsi.listMyCarsiItems.mockResolvedValue([makeCarsiItem({ id: "item-2", title: "Bisiklet" })]);

    renderAt("/cadde/carsi", "/cadde/carsi", <CaddeCarsiPage />);

    expect(await screen.findByText("IKEA çalışma masası")).toBeInTheDocument();
    expect(screen.getByText(dayMonth(STARTS_AT))).toBeInTheDocument();
    expect(await screen.findByText("İlanlarım")).toBeInTheDocument();
    expect(bodyText()).toContain(`• Bitiş: ${dayMonth(ENDS_AT)}`);
  });

  it("CaddeCarsiItemPage: ilan detayı oluşturma → bitiş tarihini uzun ay adıyla yazar", async () => {
    carsi.getCarsiItem.mockResolvedValue(makeCarsiItem());

    renderAt("/cadde/carsi/item-1", "/cadde/carsi/:itemId", <CaddeCarsiItemPage />);

    expect(await screen.findByText("IKEA çalışma masası")).toBeInTheDocument();
    expect(bodyText()).toContain(`${paddedLongDate(STARTS_AT)} → ${paddedLongDate(ENDS_AT)}`);
  });
});

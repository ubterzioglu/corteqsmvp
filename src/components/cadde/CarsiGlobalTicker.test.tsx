// Çarşı ticker/teaser kapısı (F10/m39+m40).
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { getCarsiVisibleMock, listCarsiItemsMock } = vi.hoisted(() => ({
  getCarsiVisibleMock: vi.fn(),
  listCarsiItemsMock: vi.fn(),
}));

vi.mock("@/lib/cadde-carsi-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cadde-carsi-api")>("@/lib/cadde-carsi-api");
  return { ...actual, getCarsiVisible: getCarsiVisibleMock, listCarsiItems: listCarsiItemsMock };
});
vi.mock("@/hooks/cadde/useCaddeDiasporaKey", () => ({ useCaddeDiasporaKey: () => "tr" }));

import CarsiGlobalTicker from "@/components/cadde/CarsiGlobalTicker";
import type { CarsiItem } from "@/lib/cadde-types";

const FILTERS = { countries: [], cities: [], bridge: false, scope: "all", hashtag: "", mode: "real" } as never;

const makeItem = (overrides: Partial<CarsiItem> = {}): CarsiItem => ({
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
  expiresAt: null,
  createdAt: "2026-06-11T10:00:00.000Z",
  ...overrides,
});

const renderTicker = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CarsiGlobalTicker filters={FILTERS} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("CarsiGlobalTicker (m39+m40 kapısı)", () => {
  it("Çarşı gizliyken teaser çizer, hiç link vermez ve ilanları HİÇ çekmez", async () => {
    getCarsiVisibleMock.mockResolvedValue(false);
    renderTicker();

    await waitFor(() => expect(screen.getByTestId("carsi-teaser")).toBeInTheDocument());
    // m51: marka adı tam yazılır ("Çarşı" tek başına değil).
    expect(screen.getByText(/CorteQS Çarşı Yakında Açılıyor/)).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(listCarsiItemsMock).not.toHaveBeenCalled();
  });

  // m51: hover/dokunuş balonu — masaüstünde hover, mobilde tap ile açılır.
  it("teaser başlığındaki balon ikinci el pazarı mesajını verir", async () => {
    const user = userEvent.setup();
    getCarsiVisibleMock.mockResolvedValue(false);
    renderTicker();

    await waitFor(() => expect(screen.getByTestId("carsi-teaser-info-trigger")).toBeInTheDocument());
    expect(screen.queryByTestId("carsi-teaser-info-content")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("carsi-teaser-info-trigger"));

    expect(await screen.findByTestId("carsi-teaser-info-content")).toBeInTheDocument();
    expect(screen.getByText("CorteQS'in ikinci el pazarı yakında!")).toBeInTheDocument();
  });

  it("ayar açıkken normal ticker + tümü linki döner", async () => {
    getCarsiVisibleMock.mockResolvedValue(true);
    listCarsiItemsMock.mockResolvedValue([]);
    renderTicker();

    await waitFor(() =>
      expect(screen.getByRole("link", { name: /Tümü/ })).toHaveAttribute("href", "/cadde/carsi"),
    );
    // m53: sağ kolon başlığı da "CorteQS Çarşı".
    expect(screen.getByText("CorteQS Çarşı")).toBeInTheDocument();
    expect(screen.queryByTestId("carsi-teaser")).not.toBeInTheDocument();
  });

  // Revizyon 8d3aeb2a: rozet artık düz metin değil, kategori listesine giden link.
  it("kategori rozeti /cadde/carsi?kategori=<key> adresine gider", async () => {
    getCarsiVisibleMock.mockResolvedValue(true);
    listCarsiItemsMock.mockResolvedValue([makeItem()]);
    renderTicker();

    const badge = await screen.findByTestId("carsi-ticker-category-item-1");
    expect(badge).toHaveAttribute("href", "/cadde/carsi?kategori=second_hand");
    expect(badge).toHaveTextContent("İkinci El");
  });

  // İç içe <a> geçersiz HTML'dir: tarayıcı dış anchor'ı kapatıp DOM'u yeniden kurar,
  // rozet kartın dışına düşer ve kart linki bozulur. Kart bir <div>'e alınıp
  // tıklanabilirlik "stretched link" ile korunduğu için bu sayı 0 olmalıdır.
  it("rozet linki ilan kartının linkinin İÇİNDE değildir (iç içe <a> yok)", async () => {
    getCarsiVisibleMock.mockResolvedValue(true);
    listCarsiItemsMock.mockResolvedValue([makeItem()]);
    const { container } = renderTicker();

    await screen.findByTestId("carsi-ticker-category-item-1");
    expect(container.querySelectorAll("a a")).toHaveLength(0);
    // İlan detayına giden link yine de duruyor (kart tıklanabilirliği kaybolmadı).
    expect(screen.getByRole("link", { name: "IKEA çalışma masası" })).toHaveAttribute(
      "href",
      "/cadde/carsi/item-1",
    );
  });
});

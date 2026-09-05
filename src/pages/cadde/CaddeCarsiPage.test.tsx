import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CaddeCarsiPage from "@/pages/cadde/CaddeCarsiPage";
import type { CarsiItem } from "@/lib/cadde-types";

const useAuthMock = vi.fn();
const listCarsiItemsMock = vi.fn();
const listCarsiCategoriesMock = vi.fn();
const listMyCarsiItemsMock = vi.fn();

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/cadde-carsi-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cadde-carsi-api")>("@/lib/cadde-carsi-api");
  return {
    ...actual,
    listCarsiItems: (...args: unknown[]) => listCarsiItemsMock(...args),
    listCarsiCategories: (...args: unknown[]) => listCarsiCategoriesMock(...args),
    listMyCarsiItems: (...args: unknown[]) => listMyCarsiItemsMock(...args),
  };
});

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

const renderPage = (entry = "/cadde/carsi") => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <CaddeCarsiPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("CaddeCarsiPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listCarsiCategoriesMock.mockResolvedValue([
      { key: "second_hand", labelTr: "İkinci El", sortOrder: 10 },
      { key: "service", labelTr: "Hizmet", sortOrder: 40 },
    ]);
    listMyCarsiItemsMock.mockResolvedValue([]);
  });

  it("renders published items with category chips and price", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCarsiItemsMock.mockResolvedValue([makeItem()]);

    renderPage();

    expect(await screen.findByText("IKEA çalışma masası")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hizmet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /İlan Ver/i })).toBeInTheDocument();
  });

  it("shows owner controls in the İlanlarım section", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "owner-1" } }, user: { id: "owner-1" }, isLoading: false });
    listCarsiItemsMock.mockResolvedValue([]);
    listMyCarsiItemsMock.mockResolvedValue([makeItem({ status: "paused" })]);

    renderPage();

    expect(await screen.findByText("İlanlarım")).toBeInTheDocument();
    expect(screen.getByText("Pasif")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yayına Al" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sil" })).toBeInTheDocument();
  });

  it("shows an empty state when no items exist", async () => {
    useAuthMock.mockReturnValue({ session: null, user: null, isLoading: false });
    listCarsiItemsMock.mockResolvedValue([]);

    renderPage();

    // Türkçe İ/ı nedeniyle regex+`i` bayrağı güvenilmez — tam metinle eşleştir.
    expect(await screen.findByText("İlk ilanı sen ver.")).toBeInTheDocument();
    // Girişsiz kullanıcıya ilan verme butonu değil, giriş bağlantısı gösterilir.
    expect(screen.queryByRole("button", { name: /İlan Ver/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "İlan vermek için giriş yap" })).toBeInTheDocument();
  });

  // --- Revizyon 8d3aeb2a: kategori rozetleri artık link ---

  it("ilan kartındaki kategori rozeti kategori adresine gider", async () => {
    useAuthMock.mockReturnValue({ session: null, user: null, isLoading: false });
    listCarsiItemsMock.mockResolvedValue([makeItem()]);

    renderPage();

    const badge = await screen.findByTestId("carsi-card-category-item-1");
    expect(badge).toHaveAttribute("href", "/cadde/carsi?kategori=second_hand");
    expect(badge).toHaveTextContent("İkinci El");
  });

  // İç içe <a> geçersiz HTML'dir; tarayıcı dış anchor'ı erken kapatıp DOM'u yeniden
  // kurar. Kartın dış Link'i kaldırıldı, tıklanabilirlik başlıktaki stretched link
  // ile korunuyor — bu yüzden "a a" seçicisi hiçbir şey bulmamalı.
  it("rozet linki kartın linkinin İÇİNDE değildir ve kart linki korunur", async () => {
    useAuthMock.mockReturnValue({ session: null, user: null, isLoading: false });
    listCarsiItemsMock.mockResolvedValue([makeItem()]);

    const { container } = renderPage();

    await screen.findByTestId("carsi-card-category-item-1");
    expect(container.querySelectorAll("a a")).toHaveLength(0);
    expect(screen.getByRole("link", { name: "IKEA çalışma masası" })).toHaveAttribute(
      "href",
      "/cadde/carsi/item-1",
    );
  });

  it("İlanlarım satırındaki kategori etiketi de link", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "owner-1" } }, user: { id: "owner-1" }, isLoading: false });
    listCarsiItemsMock.mockResolvedValue([]);
    listMyCarsiItemsMock.mockResolvedValue([makeItem({ categoryKey: "service", categoryLabel: "Hizmet" })]);

    renderPage();

    const badge = await screen.findByTestId("carsi-mine-category-item-1");
    expect(badge).toHaveAttribute("href", "/cadde/carsi?kategori=service");
  });

  // Link'in GERÇEKTEN çalıştığının kanıtı: adresteki ?kategori sorguyu besliyor mu?
  // Beslemezse rozet "görünür ama işe yaramaz" olur.
  it("adresteki ?kategori parametresi listeleme sorgusunu filtreler", async () => {
    useAuthMock.mockReturnValue({ session: null, user: null, isLoading: false });
    listCarsiItemsMock.mockResolvedValue([]);

    renderPage("/cadde/carsi?kategori=service");

    await screen.findByText("İlk ilanı sen ver.");
    expect(listCarsiItemsMock).toHaveBeenCalledWith(expect.objectContaining({ categoryKey: "service" }));
  });

  it("kategori parametresi yokken filtresiz sorgu atılır", async () => {
    useAuthMock.mockReturnValue({ session: null, user: null, isLoading: false });
    listCarsiItemsMock.mockResolvedValue([]);

    renderPage();

    await screen.findByText("İlk ilanı sen ver.");
    expect(listCarsiItemsMock).toHaveBeenCalledWith(expect.objectContaining({ categoryKey: undefined }));
  });
});

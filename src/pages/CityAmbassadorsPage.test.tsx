import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CityAmbassadorsPage from "@/pages/CityAmbassadorsPage";
import type { PublicCatalogRow } from "@/lib/public-catalog-api";

const listPublicCatalogRowsMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/lib/public-catalog-api", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/public-catalog-api")>("@/lib/public-catalog-api");
  return {
    ...actual,
    listPublicCatalogRows: (...args: unknown[]) => listPublicCatalogRowsMock(...args),
  };
});

// Mock yolu bileşenin GERÇEKTEN import ettiği yol olmalı — CLAUDE.md'nin uyarısı:
// başka bir yolu mock'lamak sessizce hiçbir şey değiştirmez ve test gerçek
// provider'ı arayıp "useAuth must be used within AuthProvider" ile patlar.
vi.mock("@/components/auth/useAuth", () => ({
  useAuth: (...args: unknown[]) => useAuthMock(...args),
}));

const row = (overrides: Partial<PublicCatalogRow> & { id: string }): PublicCatalogRow => ({
  slug: `member-${overrides.id}`,
  title: "Elçi",
  headline: null,
  description: null,
  roleKey: "User_CityAmbassador",
  countryCode: "DE",
  countryName: "Almanya",
  city: "Berlin",
  isVerified: false,
  href: `/directory/profile/member-${overrides.id}`,
  ...overrides,
});

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/city-ambassadors"]}>
        <Routes>
          <Route path="/city-ambassadors" element={<CityAmbassadorsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom bu ikisini uygulamaz ve Radix Select açılırken ikisini de çağırır
  // (`target.hasPointerCapture is not a function`). DirectoryPage.test.tsx
  // aynı çözümü kullanıyor — ürün kusuru değil, ortam eksiği.
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  useAuthMock.mockReturnValue({ user: null, isLoading: false });
  listPublicCatalogRowsMock.mockResolvedValue([]);
});

describe("CityAmbassadorsPage", () => {
  it("yalnız Şehir Elçisi rolünü sorgular", async () => {
    renderPage();
    await waitFor(() => expect(listPublicCatalogRowsMock).toHaveBeenCalled());
    expect(listPublicCatalogRowsMock).toHaveBeenCalledWith(["User_CityAmbassador"]);
  });

  it("gerçek elçileri listeler ve DEMO rozeti ÇİZMEZ", async () => {
    listPublicCatalogRowsMock.mockResolvedValue([
      row({ id: "1", title: "Ali Palta", city: "Leipzig" }),
      row({ id: "2", title: "Erdem Ünal", city: "Doha", countryName: "Katar" }),
    ]);

    renderPage();

    expect(await screen.findByText("Ali Palta")).toBeInTheDocument();
    expect(screen.getByText("Erdem Ünal")).toBeInTheDocument();
    expect(screen.getByText("2 elçi listeleniyor")).toBeInTheDocument();
    // Veri canlıdan geliyor; bu sayfa demo DEĞİL.
    expect(screen.queryByText(/DEMO/i)).not.toBeInTheDocument();
  });

  it("kart mevcut üye profiline bağlanır (yeni detay sayfası gerekmez)", async () => {
    listPublicCatalogRowsMock.mockResolvedValue([row({ id: "abc", title: "Ali Palta" })]);
    renderPage();

    // `findByRole("link", { name })` BİLEREK kullanılmıyor: isim eşleşmesi tüm
    // ağaç için erişilebilir ad hesaplar ve tam test paketi paralel koşarken
    // varsayılan 1 sn'lik süreyi aşıp sahte kırılma üretiyordu. Metinle bulup
    // en yakın bağlantıya çıkmak hem hızlı hem aynı ölçüde kesin.
    const title = await screen.findByText("Ali Palta");
    expect(title.closest("a")).toHaveAttribute("href", "/directory/profile/member-abc");
  });

  it("şehir adını görüntüde Türkçe kurala göre düzeltir", async () => {
    listPublicCatalogRowsMock.mockResolvedValue([
      row({ id: "1", title: "cenk cenk", city: "vancouver", countryName: "Kanada" }),
    ]);
    renderPage();

    // Şehir düzeltilir, KİŞİ ADI olduğu gibi kalır.
    expect(await screen.findByText("Vancouver, Kanada")).toBeInTheDocument();
    expect(screen.getByText("cenk cenk")).toBeInTheDocument();
  });

  it("hiç kayıt yokken davet metnini gösterir", async () => {
    renderPage();
    expect(await screen.findByText(/Henüz yayınlanmış şehir elçisi kaydı yok/)).toBeInTheDocument();
  });

  it("ülke süzgeci listeyi daraltır", async () => {
    listPublicCatalogRowsMock.mockResolvedValue([
      row({ id: "1", title: "Ali Palta", countryName: "Almanya" }),
      row({ id: "2", title: "Erdem Ünal", countryName: "Katar" }),
    ]);

    renderPage();
    await screen.findByText("Ali Palta");

    await userEvent.click(screen.getByLabelText("Ülkeye göre süz"));
    // Radix açılır listesi portal'a çizilir; yüklü paketin altında geç kalabildiği
    // için süre açıkça uzatıldı (varsayılan 1 sn sahte kırılma üretiyordu).
    await userEvent.click(await screen.findByRole("option", { name: /Katar/ }, { timeout: 5000 }));

    await waitFor(() => expect(screen.queryByText("Ali Palta")).not.toBeInTheDocument());
    expect(screen.getByText("Erdem Ünal")).toBeInTheDocument();
  });

  it("giriş yapılmamışken başvuru formu yerine giriş daveti çizilir", async () => {
    renderPage();
    expect(await screen.findByText("Başvuru için giriş yap")).toBeInTheDocument();
    // Form alanları HİÇ çizilmemeli — tablonun INSERT politikası authenticated.
    expect(screen.queryByLabelText("Ad Soyad *")).not.toBeInTheDocument();
  });

  it("giriş yapılmışken başvuru formu çizilir", async () => {
    useAuthMock.mockReturnValue({ user: { id: "user-1" }, isLoading: false });
    renderPage();
    expect(await screen.findByLabelText("Ad Soyad *")).toBeInTheDocument();
    expect(screen.queryByText("Başvuru için giriş yap")).not.toBeInTheDocument();
  });

  it("program tanıtımı her durumda görünür (boş listede de)", async () => {
    renderPage();
    expect(await screen.findByText("Şehrinde Elçi Olmak İster misin?")).toBeInTheDocument();
    expect(screen.getByText("Yerel Ağ Oluşturma")).toBeInTheDocument();
    expect(screen.getByText("Gelir Paylaşımı")).toBeInTheDocument();
  });
});

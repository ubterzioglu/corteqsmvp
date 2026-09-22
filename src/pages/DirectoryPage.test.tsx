import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DirectoryPage from "@/pages/DirectoryPage";

const listUnifiedDirectoryRowsMock = vi.fn();
const listDirectoryRoleOptionsMock = vi.fn();
// B5: `getTotalDirectoryCount` mock'lanmamıştı ve DirectoryPage onu koşulsuz
// çağırıyor — her render GERÇEK bir Supabase isteği deniyor, ENOTFOUND ile ağ
// zaman aşımına kadar sürüyordu. Bu istek dosya teardown'ından sonra çözülünce
// `setTotalCount` sökülmüş ağaca yazıyor ve süit paralel koşarken
// "ReferenceError: window is not defined" unhandled rejection'ı düşüyordu.
// Ürün tarafındaki isMounted koruması ayrıca eklendi (DirectoryPage.tsx);
// buradaki mock ise testin ağa hiç çıkmamasını sağlar.
const getTotalDirectoryCountMock = vi.fn();
const searchPublicContentMock = vi.fn();
const useGeoCountriesMock = vi.fn();
const useGeoCitiesMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/lib/catalog-directory", async () => {
  const actual = await vi.importActual<typeof import("@/lib/catalog-directory")>("@/lib/catalog-directory");
  return {
    ...actual,
    listUnifiedDirectoryRows: (...args: unknown[]) => listUnifiedDirectoryRowsMock(...args),
    listDirectoryRoleOptions: (...args: unknown[]) => listDirectoryRoleOptionsMock(...args),
    getTotalDirectoryCount: (...args: unknown[]) => getTotalDirectoryCountMock(...args),
  };
});

vi.mock("@/hooks/useGeo", () => ({
  useGeoCountries: (...args: unknown[]) => useGeoCountriesMock(...args),
  useGeoCities: (...args: unknown[]) => useGeoCitiesMock(...args),
}));

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: (...args: unknown[]) => useAuthMock(...args),
}));

vi.mock("@/lib/public-content-search", () => ({
  searchPublicContent: (...args: unknown[]) => searchPublicContentMock(...args),
}));

const renderPage = (initialEntry = "/directory") => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/directory" element={<DirectoryPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("DirectoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTotalDirectoryCountMock.mockResolvedValue(2);
    searchPublicContentMock.mockResolvedValue([]);
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
    window.HTMLElement.prototype.setPointerCapture = vi.fn();
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();
    useAuthMock.mockReturnValue({
      user: { id: "user-1" },
      isLoading: false,
    });
    listDirectoryRoleOptionsMock.mockResolvedValue([
      { key: "Business_Market_Bakkal", label: "Bakkal" },
      { key: "Healthcare_Doctor", label: "Doktor" },
    ]);
    useGeoCountriesMock.mockReturnValue({
      data: [{ code: "DE", name: "Almanya" }],
    });
    useGeoCitiesMock.mockReturnValue({ data: [] });
    listUnifiedDirectoryRowsMock.mockResolvedValue({
      totalCount: 2,
      rows: [
      {
        recordType: "catalog_item",
        id: "item-1",
        href: "/directory/catalog/ayse-kaya",
        title: "Ayşe Kaya",
        roleKey: "Business_Market_Bakkal",
        roleLabel: "Bakkal",
        description: "Mahalle bakkalı",
        country: "DE",
        city: "Berlin",
        imageUrl: null,
        specialLabel: "Uzmanlık / Kategori",
        specialValue: "Gıda",
        isFeatured: false,
        isVerified: true,
        isClaimable: false,
        itemType: "business",
      },
      {
        recordType: "catalog_item",
        id: "item-2",
        href: "/directory/catalog/dortmund-turkce-doktor-arkin-kara",
        title: "Arkin Kara",
        roleKey: "Healthcare_Doctor",
        roleLabel: "Doktor",
        description: "Dortmund'da Türkçe hizmet veren doktor.",
        country: "DE",
        city: "Dortmund",
        imageUrl: null,
        specialLabel: "Uzmanlık / Kategori",
        specialValue: "Genel Tıp",
        isFeatured: false,
        isVerified: false,
        isClaimable: true,
        itemType: "advisor",
      },
      ],
    });
  });

  it("renders canonical catalog records in one list", async () => {
    renderPage();

    expect(await screen.findByText("Ayşe Kaya")).toBeInTheDocument();
    expect(screen.getByText("Arkin Kara")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ayşe Kaya/i })).toHaveAttribute("href", "/directory/catalog/ayse-kaya");
    expect(screen.getByRole("link", { name: /Arkin Kara/i })).toHaveAttribute(
      "href",
      "/directory/catalog/dortmund-turkce-doktor-arkin-kara",
    );
    expect(screen.getByText("Sahiplenilebilir")).toBeInTheDocument();
  });

  it("passes live role filters from the URL into canonical directory loading", async () => {
    renderPage("/directory?role=Healthcare_Doctor");

    await waitFor(() => {
      expect(listUnifiedDirectoryRowsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ roleFilter: "Healthcare_Doctor" }),
      );
    });
  });

  it("blog sonucunu ayri icerik bolumunde gosterir ve dizin sirasini bozmaz", async () => {
    searchPublicContentMock.mockResolvedValue([
      {
        type: "blog",
        id: "blog-1",
        title: "Almanya'da gündelik bütçe",
        description: "Kira ve yaşam giderleri",
        href: "/blog/almanya-gundelik-butce",
      },
    ]);

    renderPage("/directory?q=almanya");

    const blogLink = await screen.findByRole("link", { name: /Almanya'da gündelik bütçe/i });
    expect(blogLink).toHaveAttribute("href", "/blog/almanya-gundelik-butce");
    expect(screen.getByRole("heading", { name: "İçerikler" })).toBeInTheDocument();

    const directoryLinks = screen.getAllByRole("link").filter((link) =>
      link.getAttribute("href")?.startsWith("/directory/catalog/"),
    );
    expect(directoryLinks.map((link) => link.getAttribute("href"))).toEqual([
      "/directory/catalog/ayse-kaya",
      "/directory/catalog/dortmund-turkce-doktor-arkin-kara",
    ]);
  });

  // 2026-09-21 (Batch 0): dizin ziyaretçiye açıldı. Eski davranış — `!user` ise
  // sorguyu HİÇ atmamak — "arama boş dönüyor" şikayetinin doğrudan kaynağıydı.
  it("ziyaretçi için de sonuçları YÜKLER, giriş duvarı göstermez", async () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false });

    renderPage("/directory?q=doktor");

    expect(await screen.findByText("Ayşe Kaya")).toBeInTheDocument();
    await waitFor(() => {
      expect(listUnifiedDirectoryRowsMock).toHaveBeenCalledWith(
        expect.objectContaining({ searchText: "doktor" }),
      );
    });
    expect(screen.queryByText(/Tam dizin için giriş gerekiyor/i)).toBeNull();
  });

  it("ziyaretçiye giriş davetini gösterir ve `next` ile mevcut aramayı korur", async () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false });

    renderPage("/directory?q=doktor");

    expect(await screen.findByText(/Dizinde arama herkese açık/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Giriş Yap/i })).toHaveAttribute(
      "href",
      "/login?next=%2Fdirectory%3Fq%3Ddoktor",
    );
  });

  it("oturum durumu netleşmeden sorgu atmaz", () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: true });

    renderPage();

    expect(listUnifiedDirectoryRowsMock).not.toHaveBeenCalled();
  });

  describe("sayfalama", () => {
    it("ilk sayfayı offset 0 ile ister", async () => {
      renderPage();

      await waitFor(() => {
        expect(listUnifiedDirectoryRowsMock).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 0 }),
        );
      });
    });

    it("tüm sonuçlar gelmişse 'Daha fazla göster' çıkmaz", async () => {
      renderPage();

      expect(await screen.findByText("Ayşe Kaya")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Daha fazla göster/i })).toBeNull();
    });

    it("sonuç sayısı sayfadan büyükse sonraki sayfayı ister", async () => {
      // 40 toplam, sayfa 24 → buton çıkmalı ve tıklanınca offset 24 istenmeli.
      listUnifiedDirectoryRowsMock.mockResolvedValue({
        totalCount: 40,
        rows: [
          {
            recordType: "catalog_item",
            id: "item-1",
            href: "/directory/catalog/ayse-kaya",
            title: "Ayşe Kaya",
            roleKey: "Business_Market_Bakkal",
            roleLabel: "Bakkal",
            description: null,
            country: "DE",
            city: "Berlin",
            imageUrl: null,
            specialLabel: null,
            specialValue: null,
            isFeatured: false,
            isVerified: false,
            isClaimable: false,
            itemType: "business",
          },
        ],
      });

      renderPage();

      const moreButton = await screen.findByRole("button", { name: /Daha fazla göster/i });
      // Sayaç sunucunun toplamını gösterir, çekilen satır sayısını DEĞİL.
      expect(screen.getByText(/40 sonuç bulundu/)).toBeInTheDocument();

      moreButton.click();

      await waitFor(() => {
        expect(listUnifiedDirectoryRowsMock).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 24 }),
        );
      });
    });
  });
});

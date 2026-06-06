import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DirectoryPage from "@/pages/DirectoryPage";

const listUnifiedDirectoryRowsMock = vi.fn();
const listDirectoryRoleOptionsMock = vi.fn();
const useGeoCountriesMock = vi.fn();
const useGeoCitiesMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/lib/catalog-directory", async () => {
  const actual = await vi.importActual<typeof import("@/lib/catalog-directory")>("@/lib/catalog-directory");
  return {
    ...actual,
    listUnifiedDirectoryRows: (...args: unknown[]) => listUnifiedDirectoryRowsMock(...args),
    listDirectoryRoleOptions: (...args: unknown[]) => listDirectoryRoleOptionsMock(...args),
  };
});

vi.mock("@/hooks/useGeo", () => ({
  useGeoCountries: (...args: unknown[]) => useGeoCountriesMock(...args),
  useGeoCities: (...args: unknown[]) => useGeoCitiesMock(...args),
}));

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: (...args: unknown[]) => useAuthMock(...args),
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
    listUnifiedDirectoryRowsMock.mockResolvedValue([
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
    ]);
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
    expect(screen.getByText("Claimable")).toBeInTheDocument();
  });

  it("passes live role filters from the URL into canonical directory loading", async () => {
    renderPage("/directory?role=Healthcare_Doctor");

    await waitFor(() => {
      expect(listUnifiedDirectoryRowsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ roleFilter: "Healthcare_Doctor" }),
      );
    });
  });

  it("shows a login CTA for anonymous users", async () => {
    useAuthMock.mockReturnValue({
      user: null,
      isLoading: false,
    });

    renderPage();

    expect(screen.getByText(/Tam directory icin giris gerekiyor/i)).toBeInTheDocument();
    expect(listUnifiedDirectoryRowsMock).not.toHaveBeenCalled();
  });
});

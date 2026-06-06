import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DirectoryPage from "@/pages/DirectoryPage";

const listUnifiedDirectoryRowsMock = vi.fn();
const listDirectoryRoleOptionsMock = vi.fn();
const useGeoCountriesMock = vi.fn();
const useGeoCitiesMock = vi.fn();

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
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
    window.HTMLElement.prototype.setPointerCapture = vi.fn();
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();
    listDirectoryRoleOptionsMock.mockResolvedValue([
      { key: "danisman", label: "Danışman" },
      { key: "Healthcare_Doctor", label: "Doktor" },
    ]);
    useGeoCountriesMock.mockReturnValue({
      data: [{ code: "DE", name: "Almanya" }],
    });
    useGeoCitiesMock.mockReturnValue({ data: [] });
    listUnifiedDirectoryRowsMock.mockResolvedValue([
      {
        recordType: "user_profile",
        id: "user-1",
        href: "/directory/profile/user-1",
        title: "Ayşe Kaya",
        roleKey: "danisman",
        roleLabel: "Danışman",
        description: "Vergi danışmanı",
        country: "Almanya",
        city: "Berlin",
        imageUrl: null,
        specialLabel: "Uzmanlık",
        specialValue: "Vergi",
        isFeatured: false,
        isVerified: true,
        isClaimable: false,
      },
      {
        recordType: "catalog_item",
        id: "item-1",
        href: "/directory/catalog/dortmund-turkce-doktor-arkin-kara",
        title: "Arkin Kara",
        roleKey: "Healthcare_Doctor",
        roleLabel: "Doktor",
        description: "Dortmund'da Türkçe hizmet veren doktor.",
        country: "Almanya",
        city: "Dortmund",
        imageUrl: null,
        specialLabel: "Uzmanlık / Kategori",
        specialValue: "Genel Tıp",
        isFeatured: false,
        isVerified: false,
        isClaimable: true,
      },
    ]);
  });

  it("renders user profiles and claimable catalog records in one list", async () => {
    renderPage();

    expect(await screen.findByText("Ayşe Kaya")).toBeInTheDocument();
    expect(screen.getByText("Arkin Kara")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ayşe Kaya/i })).toHaveAttribute("href", "/directory/profile/user-1");
    expect(screen.getByRole("link", { name: /Arkin Kara/i })).toHaveAttribute(
      "href",
      "/directory/catalog/dortmund-turkce-doktor-arkin-kara",
    );
    expect(screen.getByText("Claimable")).toBeInTheDocument();
  });

  it("passes live role filters from the URL into unified directory loading", async () => {
    renderPage("/directory?role=Healthcare_Doctor");

    await waitFor(() => {
      expect(listUnifiedDirectoryRowsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ roleFilter: "Healthcare_Doctor" }),
      );
    });
  });

  it("renders rows as directory links instead of grid cards", async () => {
    renderPage("/directory?q=vergi");

    expect(await screen.findByRole("link", { name: /Ayşe Kaya/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Arkin Kara/i })).toBeInTheDocument();
    expect(screen.getByText(/Diaspora profillerini ve katalog kayitlarini/i)).toBeInTheDocument();
  });
});

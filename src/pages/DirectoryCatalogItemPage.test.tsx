import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DirectoryCatalogItemPage from "@/pages/DirectoryCatalogItemPage";

const useAuthMock = vi.fn();
const rpcMock = vi.fn();
const maybeSingleMock = vi.fn();
const eqVisibilityMock = vi.fn();
const eqStatusMock = vi.fn();
const eqSlugMock = vi.fn();
const selectMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

vi.mock("@/lib/catalog-entity-api", () => ({
  getCatalogItemProfile: vi.fn().mockResolvedValue(null),
}));

const catalogItem = {
  id: "item-1",
  item_type: "advisor",
  platform_role_key: "Healthcare_Doctor",
  slug: "dortmund-turkce-doktor-arkin-kara",
  title: "Arkin Kara",
  headline: "Genel Tıp",
  short_description: "Dortmund'da Türkçe hizmet veren doktor.",
  long_description: null,
  verification_status: "unverified",
  attributes: {
    platform_role_key: "Healthcare_Doctor",
    platform_role_label: "Doktor",
  },
  catalog_item_contacts: [{ contact_type: "phone", contact_value: "+49 231 818 687", label: "Telefon", is_primary: true }],
  catalog_item_locations: [{ country_code: "DE", city: "Dortmund", region: "NRW", address_line: null, is_primary: true }],
  catalog_item_services: [{ service_name: "Genel Tıp", description: null }],
  catalog_item_languages: [{ language_code: "tr", proficiency: "native_or_fluent" }],
  catalog_item_categories: [{ is_primary: true, catalog_categories: { slug: "advisor-healthcare-doctor", name: "Doctor" } }],
};

describe("DirectoryCatalogItemPage", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ user: null, session: null, isLoading: false });
    rpcMock.mockReset();
    rpcMock.mockImplementation((fn: string) => {
      if (fn === "get_catalog_item_public_profile") {
        return Promise.resolve({ data: catalogItem, error: null });
      }
      return Promise.resolve({ data: {}, error: null });
    });
    maybeSingleMock.mockResolvedValue({ data: catalogItem, error: null });
    eqVisibilityMock.mockReturnValue({ maybeSingle: maybeSingleMock });
    eqStatusMock.mockReturnValue({ eq: eqVisibilityMock });
    eqSlugMock.mockReturnValue({ eq: eqStatusMock });
    selectMock.mockReturnValue({ eq: eqSlugMock });
    fromMock.mockReturnValue({ select: selectMock });
  });

  it("renders catalog details and login claim link for guests", async () => {
    render(
      <MemoryRouter initialEntries={["/directory/catalog/dortmund-turkce-doktor-arkin-kara"]}>
        <Routes>
          <Route path="/directory/catalog/:slug" element={<DirectoryCatalogItemPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Arkin Kara", level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText(/Türkçe hizmet veren doktor/).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Duzenleme Yetkisi Icin Giris Yap/i })).toHaveAttribute(
      "href",
      "/login?mode=signup&next=%2Fdirectory%2Fcatalog%2Fdortmund-turkce-doktor-arkin-kara",
    );
  });

  it("submits editor access claim for authenticated users", async () => {
    useAuthMock.mockReturnValue({ user: { id: "user-1" }, session: { access_token: "token" }, isLoading: false });

    render(
      <MemoryRouter initialEntries={["/directory/catalog/dortmund-turkce-doktor-arkin-kara"]}>
        <Routes>
          <Route path="/directory/catalog/:slug" element={<DirectoryCatalogItemPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /Bu Sayfayi Duzenlemek Istiyorum/i }));

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith(
        "submit_catalog_claim_request",
        expect.objectContaining({ target_item_id: "item-1", claim_type: "editor_access" }),
      );
    });
    expect(await screen.findByText("Talep Gonderildi")).toBeInTheDocument();
  });
});

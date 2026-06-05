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

const catalogItem = {
  id: "item-1",
  item_type: "advisor",
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
    rpcMock.mockResolvedValue({ data: {}, error: null });
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

    expect(await screen.findByText("Arkin Kara")).toBeInTheDocument();
    expect(screen.getByText("Dortmund'da Türkçe hizmet veren doktor.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Claim Etmek İçin Giriş Yap/i })).toHaveAttribute(
      "href",
      "/login?mode=signup&next=%2Fdirectory%2Fcatalog%2Fdortmund-turkce-doktor-arkin-kara",
    );
  });

  it("submits ownership claim for authenticated users", async () => {
    useAuthMock.mockReturnValue({ user: { id: "user-1" }, session: { access_token: "token" }, isLoading: false });

    render(
      <MemoryRouter initialEntries={["/directory/catalog/dortmund-turkce-doktor-arkin-kara"]}>
        <Routes>
          <Route path="/directory/catalog/:slug" element={<DirectoryCatalogItemPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /Bu Profili Claim Et/i }));

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith(
        "submit_catalog_claim_request",
        expect.objectContaining({ target_item_id: "item-1", claim_type: "ownership" }),
      );
    });
    expect(await screen.findByText("Claim talebiniz admin onayına gönderildi.")).toBeInTheDocument();
  });
});

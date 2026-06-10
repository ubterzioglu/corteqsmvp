import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DirectoryCatalogItemPage from "@/pages/DirectoryCatalogItemPage";

const useAuthMock = vi.fn();
const rpcMock = vi.fn();

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

const pagePayload = {
  item: {
    id: "item-1",
    slug: "dortmund-turkce-doktor-arkin-kara",
    title: "Arkin Kara",
    itemType: "advisor",
    roleKey: "Healthcare_Doctor",
    roleLabel: "Doktor",
    headline: "Genel Tıp",
    shortDescription: null,
    longDescription: null,
    avatarUrl: null,
    coverImageUrl: null,
    verificationStatus: "unverified",
    isVerified: false,
    isClaimable: true,
    city: "Dortmund",
    countryCode: "DE",
    countryLabel: "Almanya",
    addressLine: null,
    categories: [{ slug: "advisor-healthcare-doctor", name: "Doctor", isPrimary: true }],
  },
  sections: [
    {
      sectionKey: "detail.hakkinda_bio",
      label: "Hakkında",
      description: null,
      sectionArea: "detail_card",
      componentKey: "rich_text",
      sortOrder: 110,
      content: { text: "Dortmund'da Türkçe hizmet veren doktor." },
    },
  ],
  attributes: [],
  contacts: [{ type: "phone", value: "+49 231 818 687", label: "Telefon", isPrimary: true }],
  links: [],
  services: [{ name: "Genel Tıp", description: null }],
  languages: [{ code: "tr", proficiency: "native_or_fluent" }],
  media: [],
  claim: { canClaim: true, verificationStatus: "unverified" },
};

const renderPage = (slug = "dortmund-turkce-doktor-arkin-kara") => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(
    <MemoryRouter initialEntries={[`/directory/catalog/${slug}`]}>
      <Routes>
        <Route path="/directory/catalog/:slug" element={<DirectoryCatalogItemPage />} />
      </Routes>
    </MemoryRouter>,
    { wrapper },
  );
};

describe("DirectoryCatalogItemPage", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ user: null, session: null, isLoading: false });
    rpcMock.mockReset();
  });

  it("fetches the v2 payload and renders the public profile shell", async () => {
    rpcMock.mockResolvedValue({ data: pagePayload, error: null });

    renderPage();

    expect(await screen.findByRole("heading", { name: "Arkin Kara", level: 1 })).toBeInTheDocument();
    expect(rpcMock).toHaveBeenCalledWith("get_catalog_item_public_page_v2", {
      p_slug: "dortmund-turkce-doktor-arkin-kara",
    });
    expect(screen.getByText("Dortmund'da Türkçe hizmet veren doktor.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Düzenleme Yetkisi Talep Et/i })).toHaveAttribute(
      "href",
      "/login?mode=signup&next=%2Fdirectory%2Fcatalog%2Fdortmund-turkce-doktor-arkin-kara",
    );
  });

  it("shows the leak-free not-found screen when the rpc returns null", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    renderPage("gizli-profil");

    expect(
      await screen.findByText(/Bu profil şu anda görüntülenemiyor/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/yayınlanmamış olabilir/i)).toBeInTheDocument();
  });

  it("shows the same not-found screen on rpc errors", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } });

    renderPage();

    expect(
      await screen.findByText(/Bu profil şu anda görüntülenemiyor/i),
    ).toBeInTheDocument();
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicCatalogProfilePagePayload } from "@/lib/public-catalog-profile-schemas";

import PublicProfileShell from "./PublicProfileShell";

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

const makePayload = (
  overrides: Partial<PublicCatalogProfilePagePayload> = {},
): PublicCatalogProfilePagePayload => ({
  item: {
    id: "item-1",
    slug: "member-arkin-kara",
    title: "Arkin Kara",
    itemType: "member",
    roleKey: "Member",
    roleLabel: "Üye",
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
    categories: [{ slug: "doctor", name: "Doktor", isPrimary: true }],
    ...(overrides.item ?? {}),
  },
  sections: overrides.sections ?? [
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
  attributes: overrides.attributes ?? [],
  contacts: overrides.contacts ?? [
    { type: "phone", value: "+49 231 818 687", label: null, isPrimary: true },
    { type: "website", value: "https://example.com", label: null, isPrimary: false },
  ],
  links: overrides.links ?? [],
  services: overrides.services ?? [],
  languages: overrides.languages ?? [{ code: "tr", proficiency: "native_or_fluent" }],
  media: overrides.media ?? [],
  claim: overrides.claim ?? { canClaim: true, verificationStatus: "unverified" },
});

const renderShell = (payload: PublicCatalogProfilePagePayload) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/directory/catalog/member-arkin-kara"]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return render(<PublicProfileShell profile={payload} />, { wrapper });
};

describe("PublicProfileShell", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ user: null, session: null, isLoading: false });
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ data: { ok: true }, error: null });
  });

  it("renders hero with name, role, location and initials fallback", () => {
    renderShell(makePayload());

    expect(screen.getByRole("heading", { name: "Arkin Kara", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Üye")).toBeInTheDocument();
    expect(screen.getByText("Dortmund • Almanya")).toBeInTheDocument();
    expect(screen.getByLabelText("Arkin Kara")).toHaveTextContent("AK");
    expect(screen.getByRole("link", { name: /Dizine Dön/i })).toHaveAttribute("href", "/directory");
  });

  it("renders avatar image with alt text when available", () => {
    renderShell(
      makePayload({
        item: { ...makePayload().item, avatarUrl: "https://cdn.corteqs.net/a.jpg" },
      }),
    );
    const avatar = screen.getByAltText("Arkin Kara");
    expect(avatar).toHaveAttribute("src", "https://cdn.corteqs.net/a.jpg");
  });

  it("renders db sections and derived sidebar sections", () => {
    renderShell(makePayload());

    expect(screen.getByText("Hakkında")).toBeInTheDocument();
    expect(screen.getByText("Dortmund'da Türkçe hizmet veren doktor.")).toBeInTheDocument();
    expect(screen.getByText("İletişim")).toBeInTheDocument();
    expect(screen.getByText("Diller")).toBeInTheDocument();
  });

  it("renders unknown component keys as a generic card without crashing", () => {
    renderShell(
      makePayload({
        sections: [
          {
            sectionKey: "detail.yeni",
            label: "Yepyeni Bölüm",
            description: null,
            sectionArea: "detail_card",
            componentKey: "brand_new_widget",
            sortOrder: 120,
            content: { headline: "Yeni içerik" },
          },
        ],
      }),
    );

    expect(screen.getByText("Yepyeni Bölüm")).toBeInTheDocument();
    expect(screen.getByText("Yeni içerik")).toBeInTheDocument();
  });

  it("opens external website links safely in a new tab", () => {
    renderShell(makePayload());
    const websiteLink = screen.getByRole("link", { name: /Web Sitesi/i });
    expect(websiteLink).toHaveAttribute("target", "_blank");
    expect(websiteLink).toHaveAttribute("rel", "noreferrer");
    expect(websiteLink).toHaveAttribute("href", "https://example.com/");
  });

  it("sends anonymous visitors to signup with a next url", () => {
    renderShell(makePayload());
    expect(screen.getByRole("link", { name: /Düzenleme Yetkisi Talep Et/i })).toHaveAttribute(
      "href",
      "/login?mode=signup&next=%2Fdirectory%2Fcatalog%2Fmember-arkin-kara",
    );
  });

  it("submits the claim for signed-in users and shows Turkish feedback", async () => {
    useAuthMock.mockReturnValue({ user: { id: "user-1" }, session: {}, isLoading: false });
    renderShell(makePayload());

    fireEvent.click(screen.getByRole("button", { name: /Düzenleme Yetkisi Talep Et/i }));

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith(
        "submit_catalog_claim_request",
        expect.objectContaining({ target_item_id: "item-1", claim_type: "editor_access" }),
      );
    });
    expect(await screen.findByText("Talep Gönderildi")).toBeInTheDocument();
    expect(
      screen.getByText(/Düzenleme yetkisi talebiniz admin onayına gönderildi/i),
    ).toBeInTheDocument();
  });

  it("renders opt-in hero badges, the tagline pill and social link pills", () => {
    renderShell(
      makePayload({
        attributes: [
          { key: "job_seeking_opt_in", label: "İş Arıyorum", dataType: "boolean", sortOrder: 1, valueText: null, valueJson: true },
          { key: "volunteer_mentorship_opt_in", label: "Gönüllü Mentörlük", dataType: "boolean", sortOrder: 2, valueText: null, valueJson: true },
          { key: "linkedin_url", label: "LinkedIn", dataType: "url", sortOrder: 3, valueText: "https://www.linkedin.com/in/arkin-kara", valueJson: null },
        ],
      }),
    );

    expect(screen.getByText("İş Arıyorum")).toBeInTheDocument();
    expect(screen.getByText("Gönüllü Mentör")).toBeInTheDocument();
    expect(screen.getByText("Genel Tıp")).toBeInTheDocument();
    const pill = screen.getByRole("link", { name: /LinkedIn/i });
    expect(pill).toHaveAttribute("href", "https://www.linkedin.com/in/arkin-kara");
    expect(pill).toHaveAttribute("target", "_blank");
    expect(pill).toHaveAttribute("rel", "noreferrer");
  });

  it("hides the claim CTA on managed profiles and shows the managed badge", () => {
    renderShell(
      makePayload({
        item: { ...makePayload().item, verificationStatus: "claimed", isVerified: true },
        claim: { canClaim: false, verificationStatus: "claimed" },
      }),
    );

    expect(screen.queryByText(/Düzenleme Yetkisi Talep Et/i)).not.toBeInTheDocument();
    expect(screen.getByText("Yönetilen Profil")).toBeInTheDocument();
    expect(screen.getByText("Doğrulanmış Profil")).toBeInTheDocument();
  });
});

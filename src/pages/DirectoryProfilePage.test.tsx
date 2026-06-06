import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import DirectoryProfilePage from "@/pages/DirectoryProfilePage";

const rpcMock = vi.fn();
const usePublicIndividualProfileMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

vi.mock("@/hooks/usePublicIndividualProfile", () => ({
  usePublicIndividualProfile: (...args: unknown[]) => usePublicIndividualProfileMock(...args),
}));

describe("DirectoryProfilePage", () => {
  it("renders section-driven public profile content", async () => {
    usePublicIndividualProfileMock.mockReturnValue({
      details: null,
      isLoading: false,
      errorMessage: null,
    });
    rpcMock.mockResolvedValue({
      data: [
        {
          section_key: "preview.isim_kurulus_adi",
          section_area: "preview_card",
          label: "İsim / Kuruluş Adı",
          component_name: "title",
          sort_order: 10,
          content: { text: "CorteQS Business" },
        },
        {
          section_key: "preview.konum",
          section_area: "preview_card",
          label: "Konum",
          component_name: "location",
          sort_order: 20,
          content: { city: "Berlin", country: "Germany" },
        },
        {
          section_key: "detail.hakkinda_bio",
          section_area: "detail_card",
          label: "Hakkında",
          component_name: "rich_text",
          sort_order: 110,
          content: { text: "Diaspora odaklı bir business profili." },
        },
        {
          section_key: "detail.iletisim_linkleri",
          section_area: "detail_card",
          label: "İletişim Linkleri",
          component_name: "links",
          sort_order: 120,
          content: { links: [{ label: "Website", url: "https://corteqs.test" }] },
        },
      ],
      error: null,
    });

    render(
      <MemoryRouter initialEntries={["/directory/profile/user-1"]}>
        <Routes>
          <Route path="/directory/profile/:userId" element={<DirectoryProfilePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect((await screen.findAllByText("CorteQS Business")).length).toBeGreaterThan(0);
    expect(screen.getByText("Diaspora odaklı bir business profili.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Website" })).toHaveAttribute("href", "https://corteqs.test");
    expect(screen.getAllByText("Berlin • Germany").length).toBeGreaterThan(0);
  });
});

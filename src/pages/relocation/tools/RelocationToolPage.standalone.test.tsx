// Standalone araçlar (Almanya 5 + ZGEN 1) ToolResultView'dan HİÇ geçmez — oradaki
// "Araçlar Sayfasına Dön" butonu onlara ulaşmaz. Bu test standalone dalının kendi
// butonunu kaybetmediğini kilitler.
//
// 2026-08-07'de bu tam olarak yaşandı: buton yalnız ToolResultView'a konmuş,
// 18 aktif aracın 6'sı kapsam dışı kalmıştı.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";

vi.mock("@/lib/seo", () => ({ useSeo: () => undefined }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/hooks/useRelocationToolSession", () => ({
  useRelocationToolSession: () => ({
    result: null,
    isRunning: false,
    run: vi.fn(),
    reset: vi.fn(),
  }),
}));
vi.mock("@/lib/relocation-tools-api", () => ({
  getToolBySlug: vi.fn(async () => null),
  requestDiasporaIntro: vi.fn(),
}));
vi.mock("@/lib/standalone-tools", () => ({
  getStandaloneTool: (slug: string) =>
    slug === "vize-secim-almanya"
      ? {
          slug,
          title: "Vize Seçimi (Almanya)",
          summary: "test",
          load: async () => ({ default: () => <div>Standalone araç gövdesi</div> }),
        }
      : null,
}));

import RelocationToolPage from "@/pages/relocation/tools/RelocationToolPage";

function renderAt(slug: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/tools/${slug}`]}>
        <Routes>
          <Route path="/tools/:toolSlug" element={<RelocationToolPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("RelocationToolPage — standalone araç dalı", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("standalone aracın gövdesini çizer VE araçlara dönüş bağlantısını korur", async () => {
    renderAt("vize-secim-almanya");

    expect(await screen.findByText("Standalone araç gövdesi")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: new RegExp(TOOLS_UI_COPY.backToHub) });
    expect(link).toHaveAttribute("href", "/tools");
  });

  it("dönüş bağlantısı araç gövdesinin ALTINDA durur", async () => {
    const { container } = renderAt("vize-secim-almanya");
    await screen.findByText("Standalone araç gövdesi");

    const body = screen.getByText("Standalone araç gövdesi");
    const link = screen.getByRole("link", { name: new RegExp(TOOLS_UI_COPY.backToHub) });

    // DOCUMENT_POSITION_FOLLOWING: link, gövdeden SONRA geliyor.
    expect(body.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container).toContainElement(link);
  });
});

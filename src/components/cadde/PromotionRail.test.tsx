// PromotionRail'in ilk testleri — revizyon c1a3aaf0 ("Sağdaki billboard bölgesine
// maskot görseli konsun") ile birlikte yazıldı. Bileşen o güne kadar testsizdi;
// maskotun yanında `hideWhenEmpty` sözleşmesi de kilitleniyor, çünkü ikisi aynı
// boş-durum kutusunu paylaşıyor: soğuk başlangıçta kart hiç çizilmemeli, dolayısıyla
// maskot da çizilmemeli.

import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PromotionRail from "@/components/cadde/PromotionRail";
import type { CaddeFilterState, CaddePromotionCard } from "@/lib/cadde-types";

const listCaddePromotionsMock = vi.fn();

// KISMİ mock: SponsoredFeedCard aynı modülden `isExternalPromotionUrl` de okuyor.
// Tam mock yazılırsa kampanya dolu senaryosu "No export is defined" ile patlar.
vi.mock("@/lib/cadde-tanitim-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cadde-tanitim-api")>("@/lib/cadde-tanitim-api");
  return {
    ...actual,
    listCaddePromotions: (...args: unknown[]) => listCaddePromotionsMock(...args),
  };
});

const filters: CaddeFilterState = {
  mode: "real",
  countries: [],
  cities: [],
  bridge: false,
  hashtag: "",
  scope: "all",
};

const makePromotion = (): CaddePromotionCard => ({
  campaignId: "c1",
  placementKey: "cadde-right-rail",
  campaignType: "business",
  title: "Anadolu Mutfak",
  description: "Mekan tanıtımı",
  targetUrl: "https://example.com",
  imageUrl: null,
});

const renderRail = (props: { hideWhenEmpty?: boolean } = {}) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PromotionRail filters={filters} {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("PromotionRail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("puts the mascot into the empty promotion slot as a decorative image", async () => {
    listCaddePromotionsMock.mockResolvedValue([]);

    renderRail();

    const emptyState = await screen.findByTestId("cadde-promotions-empty-state");
    const mascot = emptyState.querySelector('img[src="/lmaskot.png"]');
    expect(mascot).not.toBeNull();
    // Dekoratif: erişilebilirlik ağacında HİÇ görünmemeli — metin zaten her şeyi söylüyor,
    // ekran okuyucuya "CorteQS maskot" diye okutmak gürültüden ibaret olurdu.
    expect(mascot).toHaveAttribute("alt", "");
    expect(mascot).toHaveAttribute("aria-hidden", "true");
    expect(within(emptyState).queryByRole("img")).not.toBeInTheDocument();
    // Ölçülü boyut: iki eksen de sabit, yoksa 320px'lik rail'de metni ezerdi.
    expect(mascot).toHaveClass("h-14", "w-14", "shrink-0", "object-contain");
    // Görsel metnin YERİNE geçmiyor, yanına geliyor.
    expect(emptyState).toHaveTextContent("Bu tanıtım alanı şu an boş.");
  });

  it("drops the whole card — mascot included — when the cold start hides it", async () => {
    listCaddePromotionsMock.mockResolvedValue([]);

    renderRail({ hideWhenEmpty: true });

    // Sorgu çözülene kadar bekle; kart hiçbir aşamada çizilmemeli.
    await vi.waitFor(() => expect(listCaddePromotionsMock).toHaveBeenCalled());
    expect(screen.queryByTestId("cadde-promotions-empty-state")).not.toBeInTheDocument();
    expect(document.querySelector('img[src="/lmaskot.png"]')).toBeNull();
  });

  it("shows campaigns instead of the mascot placeholder once one exists", async () => {
    listCaddePromotionsMock.mockResolvedValue([makePromotion()]);

    renderRail();

    expect(await screen.findByText("Anadolu Mutfak")).toBeInTheDocument();
    expect(screen.queryByTestId("cadde-promotions-empty-state")).not.toBeInTheDocument();
    expect(document.querySelector('img[src="/lmaskot.png"]')).toBeNull();
  });
});

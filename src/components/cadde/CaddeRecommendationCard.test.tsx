/**
 * M21 · CaddeRecommendationCard testleri + KARAR 2 KİLİDİ (kaynak sözleşmesi).
 *
 * İki sınıf:
 *   A) Kart davranışı: açık talepleri çizer (başlık+şehir) · GÖVDE ÇİZİLMEZ
 *      (iletişim sızıntı yüzeyi kapalı) · hata/boş → CTA'ya düşer, ÇÖKMEZ
 *      (Cadde akışı asla bloklanmaz).
 *   B) BULAŞMAZLIK kaynak kilidi: kart CaddeFeedView'da feedWithSponsor.map
 *      bloğunun DIŞINDA ve ÖNCESİNDE · ranking/composition dosyaları bu
 *      bileşenden import ALMAZ · feedWithSponsor.map satırı birebir yerinde.
 */
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listMock = vi.fn();

vi.mock("@/hooks/use-recommendations", () => ({
  useRecommendations: () => listMock(),
}));

import CaddeRecommendationCard from "./CaddeRecommendationCard";

const renderCard = () =>
  render(
    <MemoryRouter>
      <CaddeRecommendationCard />
    </MemoryRouter>,
  );

const row = (over: Partial<Record<string, unknown>> = {}) => ({
  id: "r1",
  user_id: "u9",
  title: "Dortmund'da güvenilir terzi",
  body: "Lütfen bana ulaşın: 0555 111 22 33, terzi@mail.com",
  category_slug: "terzi",
  country: "DE",
  city: "Dortmund",
  status: "open",
  diaspora_key: "tr",
  created_at: "2026-10-04T08:00:00Z",
  updated_at: "2026-10-04T08:00:00Z",
  ...over,
});

describe("CaddeRecommendationCard · davranış", () => {
  beforeEach(() => listMock.mockReset());

  it("açık talepleri başlık + şehir + detay linkiyle çizer", async () => {
    listMock.mockReturnValue({ data: [row()], isLoading: false, isError: false });
    renderCard();

    const link = await screen.findByRole("link", { name: /Dortmund'da güvenilir terzi/i });
    expect(link).toHaveAttribute("href", "/tavsiye/r1");
    expect(screen.getByText("Dortmund")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Tüm tavsiyelere git/i })).toHaveAttribute("href", "/tavsiye");
  });

  it("talep GÖVDESİNİ ÇİZMEZ — serbest metindeki iletişim DOM'a sızmaz", async () => {
    listMock.mockReturnValue({ data: [row()], isLoading: false, isError: false });
    renderCard();

    await screen.findByRole("link", { name: /güvenilir terzi/i });
    expect(screen.queryByText(/0555 111 22 33/)).not.toBeInTheDocument();
    expect(screen.queryByText(/terzi@mail\.com/)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("terzi@mail.com");
  });

  it("hata durumunda CTA'ya düşer, ÇÖKMEZ (akış bloklanmaz)", () => {
    listMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderCard();

    expect(screen.getByTestId("cadde-recommendation-card")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Tüm tavsiyelere git/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /güvenilir terzi/i })).not.toBeInTheDocument();
  });

  it("boş listede CTA'ya düşer", () => {
    listMock.mockReturnValue({ data: [], isLoading: false, isError: false });
    renderCard();

    expect(screen.getByTestId("cadde-recommendation-card")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Tüm tavsiyelere git/i })).toBeInTheDocument();
  });
});

describe("CaddeRecommendationCard · KARAR 2 kilidi (bant/skor sıralamasına BULAŞMAZ)", () => {
  const feedView = readFileSync("src/components/cadde/CaddeFeedView.tsx", "utf8");
  const card = readFileSync("src/components/cadde/CaddeRecommendationCard.tsx", "utf8");

  it("kart CaddeFeedView'da TEK kez ve feedWithSponsor.map bloğunun ÖNCESİNDE", () => {
    const occurrences = feedView.split("<CaddeRecommendationCard />").length - 1;
    expect(occurrences).toBe(1);
    expect(feedView.indexOf("<CaddeRecommendationCard />")).toBeLessThan(
      feedView.indexOf("feedWithSponsor.map("),
    );
  });

  it("feedWithSponsor.map satırı BİREBİR yerinde (kompozisyon değişmedi)", () => {
    expect(feedView).toContain("{feedWithSponsor.map((item, itemIndex) =>");
  });

  it("kart ranking/kompozisyon modüllerine DOKUNMAZ (import yok)", () => {
    expect(card).not.toContain("cadde-ranking");
    expect(card).not.toContain("useCaddeFeedState");
    expect(card).not.toContain("injectSponsoredPlacement");
    expect(card).not.toContain("interleavePromotions");
  });

  it("ranking ve kompozisyon dosyaları bu batch'te DEĞİŞMEDİ (kaynak kilidi)", () => {
    // Sıralama mantığının kalbi olan dosyalar kartı TANIMAZ — kart onlara bağlanamaz.
    const ranking = readFileSync("src/lib/cadde-ranking.ts", "utf8");
    const feedState = readFileSync("src/hooks/cadde/useCaddeFeedState.ts", "utf8");
    expect(ranking).not.toContain("recommendation");
    expect(feedState).not.toContain("recommendation");
    expect(feedState).not.toContain("CaddeRecommendationCard");
  });
});

/**
 * M09 · GettingStartedCard sözleşmesi.
 *
 * Kilitler:
 *   1. **Uydurma tamamlanma YOK** — her satır gerçek veri kaynağından:
 *      profil (profileCompletion sayımı), Çarşı (carsi_items), etkinlik
 *      (events). Davet satırı M13'e dek PASİF (sahte tik yok).
 *   2. Satır durumları veriyle değişir (0 → todo, >0 → done).
 *   3. requiredTotal=0 → profil tamamlanmış sayılır (SQL: total 0 → %100).
 *   4. Kablolama: sidebar overview'da quickActions'ın altında + premium
 *      düzende (tüm roller — M08 deseni).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GettingStartedCard } from "@/components/profile/GettingStartedCard";

const useMyEventsMock = vi.fn();
const listMyCarsiItemsMock = vi.fn();

vi.mock("@/hooks/use-events", () => ({
  useMyEvents: (...args: unknown[]) => useMyEventsMock(...args),
}));

vi.mock("@/lib/cadde-carsi-api", () => ({
  listMyCarsiItems: (...args: unknown[]) => listMyCarsiItemsMock(...args),
}));

const renderCard = (completion = { requiredTotal: 4, requiredCompleted: 2 }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <GettingStartedCard userId="u-1" completion={completion} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  useMyEventsMock.mockReturnValue({ data: [], isLoading: false, error: null });
  listMyCarsiItemsMock.mockResolvedValue([]);
});

describe("GettingStartedCard · satır durumları gerçek veriden", () => {
  it("profil eksik → 2/4 zorunlu alan yazılır, tik YOK", async () => {
    renderCard({ requiredTotal: 4, requiredCompleted: 2 });

    const row = await screen.findByTestId("getting-started-row-profile");
    expect(row).toHaveTextContent("2/4 zorunlu alan");
    // Başlık sayacı: yalnız tamamlananlar (davet pasif, sayılmaz)
    expect(screen.getByTestId("getting-started-card")).toHaveTextContent("Başlangıç · 0/4 tamam");
  });

  it("profil tam → done; requiredTotal=0 → tamamlanmış sayılır (SQL %100 kuralı)", async () => {
    renderCard({ requiredTotal: 0, requiredCompleted: 0 });

    expect(await screen.findByTestId("getting-started-row-profile")).toHaveTextContent(
      "Zorunlu alanın yok — profilin tamam.",
    );
    expect(screen.getByTestId("getting-started-card")).toHaveTextContent("1/4 tamam");
  });

  it("etkinlik var → done + sayı; yok → todo + /events/create linki", async () => {
    useMyEventsMock.mockReturnValue({ data: [{ id: "e1" }, { id: "e2" }], isLoading: false, error: null });
    renderCard();

    expect(await screen.findByTestId("getting-started-row-event")).toHaveTextContent("2 etkinliğin var");

    useMyEventsMock.mockReturnValue({ data: [], isLoading: false, error: null });
    renderCard();
    const rows = await screen.findAllByTestId("getting-started-row-event");
    const todoRow = rows[rows.length - 1];
    expect(todoRow).toHaveTextContent("İlk etkinlik onaydan geçer");
    expect(todoRow.querySelector("a")).toHaveAttribute("href", "/events/create");
  });

  it("Çarşı ilanı var → done + sayı (owner_user_id sorgusu)", async () => {
    listMyCarsiItemsMock.mockResolvedValue([{ id: "c1" }]);
    renderCard();

    // Sorgu asenkron — satır anında çizilir, DETAY query çözülünce güncellenir.
    expect(await screen.findByText("1 Çarşı ilanın var")).toBeInTheDocument();
    expect(screen.getByTestId("getting-started-row-listing")).toHaveTextContent("1 Çarşı ilanın var");
    expect(listMyCarsiItemsMock).toHaveBeenCalledWith("u-1");
  });

  it("davet satırı PASİF — sahte tik/ölçüm yok (M13'e dek veri kaynağı yok)", async () => {
    renderCard();

    const row = await screen.findByTestId("getting-started-row-invites");
    expect(row).toHaveTextContent("Davet sistemi yakında");
    // Pasif satır tamamlanan sayısına GİRMEZ: 0 tamamlanmışla 0/4
    expect(screen.getByTestId("getting-started-card")).toHaveTextContent("0/4 tamam");
  });
});

describe("GettingStartedCard · kablolama (kaynak sözleşmesi)", () => {
  it("sidebar overview: quickActions → gettingStarted → hero sırası", () => {
    const menu = readFileSync("src/components/profile/profile-sidebar-menu.tsx", "utf8");
    const idxQuick = menu.indexOf("{sections.quickActionsCard}");
    const idxStarted = menu.indexOf("{sections.gettingStartedCard}");
    const idxHero = menu.indexOf("{sections.legacyHeroCard}");

    expect(idxQuick).toBeGreaterThan(-1);
    expect(idxStarted).toBeGreaterThan(idxQuick);
    expect(idxHero).toBeGreaterThan(idxStarted);
  });

  it("premium düzende de çizilir (tüm roller)", () => {
    const premium = readFileSync("src/components/profile/premium/ProfilePremiumLayout.tsx", "utf8");
    const page = readFileSync("src/pages/ProfilePage.tsx", "utf8");

    expect(premium).toContain("{sections.gettingStartedCard ?? null}");
    expect(page).toContain("<GettingStartedCard");
    expect(page).toContain("gettingStartedCard,");
    // Tamamlanma gerçek kaynaktan: profile.profileCompletion prop olarak iner
    expect(page).toContain("profile?.profileCompletion.requiredTotal ?? 0");
  });
});

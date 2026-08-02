// Çarşı ticker/teaser kapısı (F10/m39+m40).
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { getCarsiVisibleMock, listCarsiItemsMock } = vi.hoisted(() => ({
  getCarsiVisibleMock: vi.fn(),
  listCarsiItemsMock: vi.fn(),
}));

vi.mock("@/lib/cadde-carsi-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cadde-carsi-api")>("@/lib/cadde-carsi-api");
  return { ...actual, getCarsiVisible: getCarsiVisibleMock, listCarsiItems: listCarsiItemsMock };
});
vi.mock("@/hooks/cadde/useCaddeDiasporaKey", () => ({ useCaddeDiasporaKey: () => "tr" }));

import CarsiGlobalTicker from "@/components/cadde/CarsiGlobalTicker";

const FILTERS = { countries: [], cities: [], bridge: false, scope: "all", hashtag: "", mode: "real" } as never;

const renderTicker = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CarsiGlobalTicker filters={FILTERS} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("CarsiGlobalTicker (m39+m40 kapısı)", () => {
  it("Çarşı gizliyken teaser çizer, hiç link vermez ve ilanları HİÇ çekmez", async () => {
    getCarsiVisibleMock.mockResolvedValue(false);
    renderTicker();

    await waitFor(() => expect(screen.getByTestId("carsi-teaser")).toBeInTheDocument());
    expect(screen.getByText("Çarşı yakında")).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(listCarsiItemsMock).not.toHaveBeenCalled();
  });

  it("ayar açıkken normal ticker + Tüm Çarşı linki döner", async () => {
    getCarsiVisibleMock.mockResolvedValue(true);
    listCarsiItemsMock.mockResolvedValue([]);
    renderTicker();

    await waitFor(() =>
      expect(screen.getByRole("link", { name: /Tüm Çarşı/ })).toHaveAttribute("href", "/cadde/carsi"),
    );
    expect(screen.queryByTestId("carsi-teaser")).not.toBeInTheDocument();
  });
});

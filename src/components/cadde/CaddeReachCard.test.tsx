import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CaddeReachCard from "@/components/cadde/CaddeReachCard";
import type { CaddeFeedReach } from "@/lib/cadde-reach";

const useAuthMock = vi.fn();
const getCaddeFeedReachMock = vi.fn();

vi.mock("@/components/auth/useAuth", () => ({ useAuth: () => useAuthMock() }));
vi.mock("@/lib/cadde-api", () => ({ getCaddeFeedReach: () => getCaddeFeedReachMock() }));

/** 06.08.2026 canlı ölçümü — Antalya/Türkiye izleyici, 158 hesap. */
const RESOLVED: CaddeFeedReach = {
  signedIn: true,
  resolved: true,
  countryName: "Turkiye",
  cityName: "Antalya",
  rawCountry: "Türkiye",
  rawCity: "Antalya",
  reach: { sameCity: 3, sameCountry: 41, unresolved: 46, total: 90, members: 158 },
  thresholds: { enabled: true, minReactions: 10, minComments: 5, minShares: 10 },
};

const renderCard = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CaddeReachCard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuthMock.mockReturnValue({ user: { id: "user-1" } });
  getCaddeFeedReachMock.mockResolvedValue(RESOLVED);
});

describe("CaddeReachCard", () => {
  it("çözülmüş konumu ve potansiyel erişimi gösterir", async () => {
    renderCard();

    const card = await screen.findByTestId("cadde-reach-card");
    expect(card).toHaveTextContent("Antalya");
    expect(card).toHaveTextContent("Turkiye");
    // Erişim: 3 + 41 + 46 = 90 üye, 158 üyenin %57'si.
    expect(card).toHaveTextContent("90");
    expect(card).toHaveTextContent("158");
    expect(card).toHaveTextContent("%57");
  });

  it("kapının dolu dallarını sayılarıyla listeler", async () => {
    renderCard();

    const rows = await screen.findAllByTestId("cadde-reach-row");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("Aynı şehir · Antalya");
    expect(rows[0]).toHaveTextContent("3");
    expect(rows[1]).toHaveTextContent("Aynı ülke · Turkiye");
    expect(rows[2]).toHaveTextContent("Konumu tanımsız üyeler");
  });

  it("global eşiği gösterir — paylaşımın yerelin dışına nasıl çıktığı", async () => {
    renderCard();

    const card = await screen.findByTestId("cadde-reach-card");
    expect(card).toHaveTextContent("10 reaksiyon · 5 yorum · 10 paylaşım");
  });

  it("erişim çubuğu ekran okuyucuya oranı bildirir", async () => {
    renderCard();

    const bar = await screen.findByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "57");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("konumu çözülemeyen üyeye durumu ve profil düzeltme yolunu gösterir", async () => {
    getCaddeFeedReachMock.mockResolvedValue({
      ...RESOLVED,
      resolved: false,
      countryName: null,
      cityName: null,
      rawCountry: "Belirtilmedi",
      rawCity: "Belirtilmedi",
      reach: { sameCity: 0, sameCountry: 0, unresolved: 46, total: 46, members: 158 },
    } satisfies CaddeFeedReach);

    renderCard();

    const card = await screen.findByTestId("cadde-reach-card");
    // Profildeki HAM değer gösterilmeli — üye neyin yazılı olduğunu görmeden düzeltemez.
    expect(card).toHaveTextContent("Belirtilmedi");
    expect(screen.getByTestId("cadde-reach-profile-link")).toHaveAttribute("href", "/profile");
  });

  it("veri gelmezse kart hiç çizilmez (akışı bozmaz)", async () => {
    getCaddeFeedReachMock.mockResolvedValue(null);

    renderCard();

    await waitFor(() => expect(getCaddeFeedReachMock).toHaveBeenCalled());
    expect(screen.queryByTestId("cadde-reach-card")).not.toBeInTheDocument();
  });

  it("oturum yoksa RPC'ye hiç gitmez", async () => {
    useAuthMock.mockReturnValue({ user: null });

    renderCard();

    await waitFor(() => expect(screen.queryByTestId("cadde-reach-card")).not.toBeInTheDocument());
    expect(getCaddeFeedReachMock).not.toHaveBeenCalled();
  });
});

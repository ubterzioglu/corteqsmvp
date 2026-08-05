// 05.08.2026 canlı olayının regresyon testi: Postgres düştü → özellik RPC'si hata verdi
// → kullanıcı hiçbir açıklama görmeden ana sayfaya atıldı. Hata ile "yetkin yok" artık
// AYRI ele alınıyor; bu dosya ikisinin bir daha birleşmesini engeller.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import RequireFeature from "@/components/auth/RequireFeature";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

vi.mock("@/hooks/useFeatureFlags", () => ({ useFeatureFlags: vi.fn() }));

const mockedUseFeatureFlags = vi.mocked(useFeatureFlags);

const setFlags = (overrides: Partial<ReturnType<typeof useFeatureFlags>>) => {
  mockedUseFeatureFlags.mockReturnValue({
    isLoading: false,
    errorMessage: null,
    isFeatureEnabled: () => true,
    getFeatureSource: () => "fallback",
    featureMap: {},
    featureSources: {},
    genericFeatureSources: {},
    refreshFeatures: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useFeatureFlags>);
};

const renderGate = () =>
  render(
    <RequireFeature feature={"cadde_access" as never} fallback={<div>ANA SAYFAYA ATILDI</div>}>
      <div>KORUNAN ICERIK</div>
    </RequireFeature>,
  );

describe("RequireFeature", () => {
  beforeEach(() => vi.clearAllMocks());

  it("yetki varsa içeriği gösterir", () => {
    setFlags({});
    renderGate();
    expect(screen.getByText("KORUNAN ICERIK")).toBeInTheDocument();
  });

  it("yükleniyorken ne içerik ne fallback gösterir", () => {
    setFlags({ isLoading: true });
    renderGate();
    expect(screen.queryByText("KORUNAN ICERIK")).not.toBeInTheDocument();
    expect(screen.queryByText("ANA SAYFAYA ATILDI")).not.toBeInTheDocument();
  });

  it("yetki yoksa fallback'e düşer", () => {
    setFlags({ isFeatureEnabled: () => false });
    renderGate();
    expect(screen.getByText("ANA SAYFAYA ATILDI")).toBeInTheDocument();
  });

  // Olayın çekirdeği: arka uç hatası "yetkin yok" DEĞİLDİR.
  it("HATA durumunda fallback'e DÜŞMEZ — açıklama gösterir", () => {
    setFlags({ errorMessage: "TypeError: fetch failed", isFeatureEnabled: () => false });
    renderGate();

    expect(screen.getByTestId("require-feature-error")).toBeInTheDocument();
    expect(screen.getByText("Bağlantı kurulamadı")).toBeInTheDocument();
    // Yönlendirmeyi tetikleyen fallback ÇİZİLMEMELİ.
    expect(screen.queryByText("ANA SAYFAYA ATILDI")).not.toBeInTheDocument();
    expect(screen.queryByText("KORUNAN ICERIK")).not.toBeInTheDocument();
  });

  it("'Tekrar dene' yetkileri yeniden yükler", async () => {
    const refreshFeatures = vi.fn();
    setFlags({ errorMessage: "boom", isFeatureEnabled: () => false, refreshFeatures });
    renderGate();

    await userEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    expect(refreshFeatures).toHaveBeenCalledTimes(1);
  });
});

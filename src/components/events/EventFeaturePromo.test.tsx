/**
 * M10 · EventFeaturePromo bileşen sözleşmesi.
 *
 * Kilitler: iki KİLİTLİ kart çizilir · "İlgileniyorum" → RPC (doğru anahtar) ·
 * kayıtlı ilgi "İlgin kaydedildi" olur (tekrar kayıt düğmesi çizilmez) ·
 * hata toast'a düşer (sessiz yutma yok).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventFeaturePromo } from "@/components/events/EventFeaturePromo";

const fetchInterestsSpy = vi.fn();
const registerSpy = vi.fn();

vi.mock("@/lib/feature-interest-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/feature-interest-api")>();
  return {
    ...actual,
    fetchMyFeatureInterests: () => fetchInterestsSpy(),
    registerFeatureInterest: (...args: unknown[]) => registerSpy(...args),
  };
});

const renderPromo = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <EventFeaturePromo />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  fetchInterestsSpy.mockResolvedValue([]);
  registerSpy.mockResolvedValue(true);
});

describe("EventFeaturePromo", () => {
  it("iki kilitli kart çizilir: Öne çıkar + Bilet sat", async () => {
    renderPromo();

    expect(await screen.findByTestId("event-feature-promo")).toBeInTheDocument();
    expect(screen.getByTestId("feature-promo-event.featured")).toBeInTheDocument();
    expect(screen.getByTestId("feature-promo-event.ticketing")).toBeInTheDocument();
    expect(screen.getByText("Öne çıkar")).toBeInTheDocument();
    expect(screen.getByText("Bilet sat")).toBeInTheDocument();
    // Kilit dili: ödeme değil, ilgi kaydı
    expect(screen.getAllByText("İlgileniyorum")).toHaveLength(2);
  });

  it("'İlgileniyorum' → registerFeatureInterest doğru anahtarla", async () => {
    renderPromo();

    fireEvent.click(await screen.findByTestId("feature-promo-event.featured-cta"));
    await waitFor(() => expect(registerSpy).toHaveBeenCalledWith("event.featured"));
  });

  it("kayıtlı ilgi → 'İlgin kaydedildi', CTA çizilmez", async () => {
    fetchInterestsSpy.mockResolvedValue(["event.ticketing"]);
    renderPromo();

    expect(await screen.findByTestId("feature-promo-event.ticketing-done")).toBeInTheDocument();
    expect(screen.queryByTestId("feature-promo-event.ticketing-cta")).not.toBeInTheDocument();
    // Kayıtsız olanın CTA'sı duruyor
    expect(screen.getByTestId("feature-promo-event.featured-cta")).toBeInTheDocument();
  });

  it("RPC hatası sessiz yutulmaz — CTA yerinde kalır (yeniden denenebilir)", async () => {
    registerSpy.mockRejectedValue(new Error("Bilinmeyen özellik anahtarı."));
    renderPromo();

    fireEvent.click(await screen.findByTestId("feature-promo-event.featured-cta"));
    await waitFor(() => expect(registerSpy).toHaveBeenCalled());
    // Kayıt başarısız → "İlgin kaydedildi" YOK
    expect(screen.queryByTestId("feature-promo-event.featured-done")).not.toBeInTheDocument();
  });
});

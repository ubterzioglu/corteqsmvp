/**
 * M22 · ProLockedInboxCard testleri.
 * Kilitler: kilitli yüzey çizilir · tıklama feature_interest 'pro.inbox' kaydeder ·
 * kayıtlıysa CTA yok ("İlgin kaydedildi") · İLETİŞİM/fiyat/ödeme UYDURULMAZ.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchInterestsMock = vi.fn();
const registerMock = vi.fn();
const toastMock = vi.fn();

vi.mock("@/lib/feature-interest-api", () => ({
  fetchMyFeatureInterests: () => fetchInterestsMock(),
  registerFeatureInterest: (...args: unknown[]) => registerMock(...args),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastMock }) }));

import ProLockedInboxCard from "./ProLockedInboxCard";

const renderCard = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<ProLockedInboxCard />, { wrapper });
};

describe("ProLockedInboxCard", () => {
  beforeEach(() => {
    fetchInterestsMock.mockReset();
    registerMock.mockReset();
    toastMock.mockReset();
    fetchInterestsMock.mockResolvedValue([]);
  });

  it("kilitli yüzey çizilir: başlık + kilit açıklaması + İlgileniyorum CTA", async () => {
    renderCard();

    expect(await screen.findByTestId("pro-locked-inbox-card")).toBeInTheDocument();
    expect(screen.getByText("Talep sahibine doğrudan ulaş")).toBeInTheDocument();
    expect(screen.getByText(/İletişim bilgisi kilitli/i)).toBeInTheDocument();
    expect(screen.getByTestId("pro-locked-inbox-cta")).toBeInTheDocument();
  });

  it("tıklama feature_interest 'pro.inbox' kaydeder (beyaz liste M22)", async () => {
    registerMock.mockResolvedValue(true);
    renderCard();

    fireEvent.click(await screen.findByTestId("pro-locked-inbox-cta"));
    await waitFor(() => expect(registerMock).toHaveBeenCalledWith("pro.inbox"));
    await waitFor(() => expect(toastMock).toHaveBeenCalled());
  });

  it("zaten kayıtlıysa CTA YOK — 'İlgin kaydedildi' (aynı kişi iki kez sayılmaz)", async () => {
    fetchInterestsMock.mockResolvedValue(["pro.inbox"]);
    renderCard();

    expect(await screen.findByTestId("pro-locked-inbox-done")).toBeInTheDocument();
    expect(screen.getByText(/İlgin kaydedildi/i)).toBeInTheDocument();
    expect(screen.queryByTestId("pro-locked-inbox-cta")).not.toBeInTheDocument();
  });

  it("fiyat/ödeme UI'ı UYDURULMAZ (K05 Stripe PARK) + iletişim çizilmez", async () => {
    renderCard();

    const card = await screen.findByTestId("pro-locked-inbox-card");
    const text = card.textContent ?? "";
    expect(text).not.toMatch(/₺|\$\d|EUR \d|\d+ TL|stripe|satın al|fiyat/i);
    expect(text).not.toContain("@");
    expect(text).not.toMatch(/\d{3}\s?\d{3}\s?\d{2}\s?\d{2}/);
  });
});

import { act, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PhoneVerificationCard } from "./PhoneVerificationCard";

const sendMock = vi.fn();

vi.mock("@/lib/phone-verification-api", () => ({
  PHONE_VERIFICATION_ERROR_MESSAGES: { send_failed: "gönderilemedi", verify_failed: "hatalı" },
  fetchPhoneVerificationStatus: vi.fn().mockResolvedValue({ isVerified: false, phone: null, verifiedAt: null }),
  sendPhoneVerificationCode: (...args: unknown[]) => sendMock(...args),
  verifyPhoneVerificationCode: vi.fn(),
}));

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PhoneVerificationCard />
    </QueryClientProvider>,
  );
}

async function sendFirstCode() {
  fireEvent.change(await screen.findByLabelText("Telefon Numarası"), { target: { value: "+491701234567" } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Doğrulama Kodu Gönder" }));
  });
}

describe("PhoneVerificationCard", () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue(undefined);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("anlatımı WhatsApp üzerinden yapar (SMS demez)", async () => {
    renderCard();
    expect(await screen.findByText(/WhatsApp ile kod göndereceğiz/)).toBeInTheDocument();
    expect(screen.queryByText(/SMS/)).not.toBeInTheDocument();
  });

  it("gönderimden sonra 'tekrar gönder' 60 sn kilitlidir ve süre dolunca açılır", async () => {
    renderCard();
    await sendFirstCode();

    const resend = await screen.findByRole("button", { name: /Kodu tekrar gönder \(60 sn\)/ });
    expect(resend).toBeDisabled();

    // Her tik yeni bir zamanlayıcı kurar; efektlerin arada çalışması için saniye saniye ilerlet.
    for (let second = 0; second < 60; second += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    }

    const unlocked = screen.getByRole("button", { name: "Kodu tekrar gönder" });
    expect(unlocked).toBeEnabled();
    expect(sendMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(unlocked);
    });
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it("gönderim hatasında hata mesajı gösterilir ve geri sayım başlamaz", async () => {
    sendMock.mockRejectedValueOnce(new Error("Çok fazla deneme yaptın. Yaklaşık 20 dk sonra tekrar dene."));
    renderCard();
    await sendFirstCode();

    expect(await screen.findByText(/Yaklaşık 20 dk sonra tekrar dene/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Kodu tekrar gönder/ })).not.toBeInTheDocument();
  });
});

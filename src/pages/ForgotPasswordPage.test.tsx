import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import ForgotPasswordPage from "@/pages/ForgotPasswordPage";

const resetPasswordForEmailMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: unknown[]) => resetPasswordForEmailMock(...args),
    },
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("ForgotPasswordPage", () => {
  it("resetPasswordForEmail'i /reset-password yönlendirmesiyle çağırır ve genel mesaj gösterir", async () => {
    resetPasswordForEmailMock.mockResolvedValue({ error: null });

    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/e-posta/i), {
      target: { value: "user@corteqs.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sıfırlama bağlantısı gönder/i }));

    await waitFor(() => {
      expect(resetPasswordForEmailMock).toHaveBeenCalledTimes(1);
    });

    expect(resetPasswordForEmailMock).toHaveBeenCalledWith("user@corteqs.test", {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    expect(await screen.findByText(/bu adres kayıtlıysa şifre sıfırlama bağlantısı gönderildi/i)).toBeInTheDocument();
  });

  it("hata durumunda da hesap varlığı sızdırmayan genel mesaj gösterir", async () => {
    resetPasswordForEmailMock.mockResolvedValue({ error: { message: "rate limit" } });

    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/e-posta/i), {
      target: { value: "yok@corteqs.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sıfırlama bağlantısı gönder/i }));

    expect(await screen.findByText(/sıfırlama isteği alınamadı/i)).toBeInTheDocument();
    expect(screen.queryByText(/bu adres kayıtlıysa/i)).not.toBeInTheDocument();
  });

  it("giriş ekranına dönüş bağlantısı içerir", () => {
    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", { name: /giriş ekranına dön/i });
    expect(backLink).toHaveAttribute("href", "/login");
  });
});

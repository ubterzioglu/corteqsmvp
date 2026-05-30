import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LansmanForm from "@/components/LansmanForm";

const createRegistrationMock = vi.fn();

vi.mock("@/lib/lansman", () => ({
  createRegistration: (...args: unknown[]) => createRegistrationMock(...args),
  isValidWhatsappPhone: (phone: string) => /^\+[1-9]\d{7,14}$/.test(phone.replace(/[\s\-().]/g, "")),
  validateOptionalUrl: (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    new URL(trimmed);
    return trimmed;
  },
}));

describe("LansmanForm", () => {
  it("shows validation errors for required fields and invalid phone", async () => {
    const { container } = render(<LansmanForm />);

    fireEvent.click(screen.getByRole("button", { name: /kaydı gönder/i }));

    expect(await screen.findByText("Ad alanı zorunludur.")).toBeInTheDocument();
    expect(screen.getByText("Soyad alanı zorunludur.")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp numarası zorunludur.")).toBeInTheDocument();
    expect(screen.getByText("Instagram kullanıcı adı zorunludur.")).toBeInTheDocument();
    expect(container.querySelector('[class*="sm:grid-cols-2"]')).toBeNull();
    expect(screen.getByLabelText("YouTube")).toBeInTheDocument();
    expect(screen.queryByLabelText("X / Twitter URL")).not.toBeInTheDocument();
    expect(screen.getByText("Zorunlu alanlar")).toBeInTheDocument();
    expect(screen.getByText("Opsiyonel")).toBeInTheDocument();
    expect(screen.getByLabelText("Sorular ve Yorumlar")).toBeInTheDocument();
  });

  it("allows submit when Instagram is filled and YouTube is empty", async () => {
    let resolveRequest: (() => void) | undefined;
    createRegistrationMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = () => resolve(undefined);
        }),
    );

    const onSuccess = vi.fn();
    render(<LansmanForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText("Ad"), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText("Soyad"), { target: { value: "Lovelace" } });
    fireEvent.change(screen.getByLabelText("WhatsApp Numarası"), {
      target: { value: "+491701234567" },
    });
    fireEvent.change(screen.getByLabelText("Instagram"), {
      target: { value: "adalovelace" },
    });

    fireEvent.click(screen.getByRole("button", { name: /kaydı gönder/i }));

    expect(screen.getByRole("button", { name: /gönderiliyor/i })).toBeDisabled();

    resolveRequest?.();

    await waitFor(() => {
      expect(screen.getByText("Kayıt alındı, onay bekliyor.")).toBeInTheDocument();
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(createRegistrationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        instagram: "adalovelace",
        youtube: "",
      }),
    );
  });
});

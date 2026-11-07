// ST00 (07.11): hizmet talebi formu gerçek bir üye akışıdır — talep GERÇEKTEN kaydedilir.
// Ödeme altyapısı (Stripe, U11) yokken form sahte bir kart ekranı açıp "Ödeme Başarılı"
// diyordu; üye gerçek kartını yazabilirdi. Akış artık dürüst: talep doğrudan gönderilir,
// ücret satırı bugün ücret alınmadığını söyler.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getAttributesBatch: vi.fn(),
  createServiceRequest: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser: mocks.getUser } },
}));
vi.mock("@/lib/profile-helpers", () => ({ getAttributesBatch: mocks.getAttributesBatch }));
vi.mock("@/lib/service-requests-api", () => ({ createServiceRequest: mocks.createServiceRequest }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }), toast: mocks.toast }));

import ServiceRequestForm from "@/components/ServiceRequestForm";

/** Bir bildirimin ödeme yapıldığını ima eden sözcükler ("öde", "ödeme", "Ödeme"...). */
const PAYMENT_CLAIM = /[öÖ]de|payment|stripe/i;

type ToastArg = { title?: string; description?: string; variant?: string };

const renderForm = (onSuccess?: () => void) =>
  render(
    <MemoryRouter>
      <ServiceRequestForm onSuccess={onSuccess} />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: null } });
});

describe("ServiceRequestForm — ödeme dürüstlüğü (ST00)", () => {
  it("gönder düğmesi ödeme değil talep gönderimi vaat eder", () => {
    renderForm();
    expect(screen.getByRole("button", { name: /Talebi Gönder/ })).toBeInTheDocument();
    expect(screen.queryByText(/Ödemeye Geç/)).not.toBeInTheDocument();
  });

  it("ücret satırı bugün ücret alınmadığını açıkça söyler", () => {
    renderForm();
    expect(screen.getByText(/şu an ücret alınmıyor/)).toBeInTheDocument();
    // Formun geri kalanı kullanıcıya "siz" diye hitap eder; not da öyle konuşur.
    expect(screen.getByText(/talebiniz doğrudan iletilir/)).toBeInTheDocument();
  });

  it("form sahte ödeme bileşenini kullanmaz", () => {
    const source = readFileSync(join(process.cwd(), "src/components/ServiceRequestForm.tsx"), "utf8");
    expect(source).not.toMatch(/MockStripeCheckout/);
  });
});

describe("ServiceRequestForm — gerçek gönderim (ST00)", () => {
  it("talebi doğrudan kaydeder; ödeme ekranı açmaz ve hiçbir bildirim ödeme iddia etmez", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "uye-1", email: "uye@example.com" } } });
    mocks.getAttributesBatch.mockResolvedValue({ city: "Berlin", country: "Almanya" });
    mocks.createServiceRequest.mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    renderForm(onSuccess);

    // Profilden otomatik doldurma bitsin; yoksa gönderimle aynı anda form state'i yazılır.
    expect(await screen.findByDisplayValue("Berlin")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Danışman/ }));
    // Radix Select: tetikleyiciye tıklama (pointer türü "touch" varsayılır) listeyi açar,
    // seçeneğe tıklama değeri yazar — gerçek kullanıcı yolu, gizli yerel <select> değil.
    const categoryTrigger = screen.getByText("Kategori seçin").closest<HTMLElement>('[role="combobox"]');
    expect(categoryTrigger).not.toBeNull();
    fireEvent.click(categoryTrigger as HTMLElement);
    fireEvent.click(await screen.findByRole("option", { name: "Finans & Vergi" }));

    fireEvent.change(screen.getByPlaceholderText(/GmbH kurulumu/), {
      target: { value: "Vergi beyannamesi desteği" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Hizmet talebinizi detaylı açıklayın/), {
      target: { value: "Serbest çalışan olarak ilk beyannamem için destek arıyorum." },
    });
    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(screen.getByRole("button", { name: /Talebi Gönder/ }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(mocks.createServiceRequest).toHaveBeenCalledTimes(1);
    expect(mocks.createServiceRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "uye-1",
        category: "Danışman › Finans & Vergi",
        title: "Vergi beyannamesi desteği",
        city: "Berlin",
        country: "Almanya",
        attachmentUrls: [],
      }),
    );

    // Sahte kart ekranı (dialog) geri gelmez.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const toasts = mocks.toast.mock.calls.map(([arg]) => arg as ToastArg);
    for (const t of toasts) {
      expect(`${t.title ?? ""} ${t.description ?? ""}`).not.toMatch(PAYMENT_CLAIM);
    }
    expect(toasts.filter((t) => t.variant === "destructive")).toEqual([]);
    expect(toasts).toContainEqual(expect.objectContaining({ title: expect.stringMatching(/talep oluşturuldu/i) }));
  });
});

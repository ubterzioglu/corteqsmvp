/**
 * KR06 sözleşmeleri: başvuru formu.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. KVKK onayının varsayılan olarak İŞARETLİ gelmesi — kullanıcı onay
 *      vermeden göndermiş sayılır; RPC `consent` zorunlu olduğu için hata da
 *      görünmez, çünkü istemci `true` gönderir.
 *   2. Dosya doğrulamasının `accept=` ile ayrışması (sürükle-bırak `accept`'i
 *      hiç dinlemez).
 *   3. Hata gösteriminin `instanceof Error` ile daraltılması → `[object Object]`.
 */
import { readFileSync } from "node:fs";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const submitSpy = vi.fn();
const uploadSpy = vi.fn();

vi.mock("@/lib/careers/careers-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/careers/careers-api")>(
    "@/lib/careers/careers-api",
  );
  return {
    ...actual,
    newCareerApplicationId: () => "11111111-2222-3333-4444-555555555555",
    uploadCareerFiles: (...args: unknown[]) => {
      uploadSpy(...args);
      return Promise.resolve({
        cvPath: "11111111-2222-3333-4444-555555555555/cv-ornek.pdf",
        coverLetterPath: null,
        presentationPath: null,
      });
    },
    submitCareerApplication: (...args: unknown[]) => {
      submitSpy(...args);
      return Promise.resolve("11111111-2222-3333-4444-555555555555");
    },
  };
});

const toastSpy = { success: vi.fn(), error: vi.fn() };
vi.mock("sonner", () => ({ toast: { success: (m: string) => toastSpy.success(m), error: (m: string) => toastSpy.error(m) } }));

import CareerApplicationForm from "@/components/career/CareerApplicationForm";

const formSource = () => readFileSync("src/components/career/CareerApplicationForm.tsx", "utf8");
const dropSource = () => readFileSync("src/components/career/CareerFileDrop.tsx", "utf8");

/**
 * Yorumları atılmış gövde.
 *
 * ⚠️ Gerekli: bu dosyalar yasakladıkları deseni KENDİ AÇIKLAMALARINDA anıyorlar
 * ("`instanceof Error` ile daraltmak `[object Object]` gösterir"). Ham metne
 * bakan bir iddia, yasağı kendi gerekçesinde bulup düşer — ilk yazımda tam
 * olarak bu oldu (aynı tuzak `career-applications-migration.test.ts`'te de
 * yaşandı).
 */
const stripComments = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//") && !line.trimStart().startsWith("*"))
    .join("\n");

const pdf = () => new File([new Uint8Array([37, 80, 68, 70])], "ozgecmis.pdf", { type: "application/pdf" });

beforeEach(() => {
  submitSpy.mockClear();
  uploadSpy.mockClear();
  toastSpy.success.mockClear();
  toastSpy.error.mockClear();
});

describe("kariyer başvuru formu", () => {
  it("KVKK onayı varsayılan olarak İŞARETSİZ gelir", () => {
    render(<CareerApplicationForm selectedPosition={null} />);

    expect(screen.getByRole("checkbox")).toHaveAttribute("data-state", "unchecked");
  });

  it("onay verilmeden gönderilemez", async () => {
    render(<CareerApplicationForm selectedPosition="coo" />);

    fireEvent.change(screen.getByLabelText(/Ad soyad/), { target: { value: "Ömer Çelik" } });
    fireEvent.change(screen.getByLabelText(/E-posta/), { target: { value: "omer@example.com" } });
    fireEvent.change(screen.getByLabelText(/Ülke/), { target: { value: "Türkiye" } });
    fireEvent.change(screen.getByLabelText("CV", { exact: false }), { target: { files: [pdf()] } });

    fireEvent.click(screen.getByRole("button", { name: /Başvurumu gönder/ }));

    await waitFor(() => expect(screen.getByText("Devam etmek için onay vermelisiniz.")).toBeInTheDocument());
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it("CV olmadan gönderilemez", async () => {
    render(<CareerApplicationForm selectedPosition="coo" />);

    fireEvent.change(screen.getByLabelText(/Ad soyad/), { target: { value: "Ömer Çelik" } });
    fireEvent.change(screen.getByLabelText(/E-posta/), { target: { value: "omer@example.com" } });
    fireEvent.change(screen.getByLabelText(/Ülke/), { target: { value: "Türkiye" } });
    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(screen.getByRole("button", { name: /Başvurumu gönder/ }));

    await waitFor(() => expect(screen.getByText("CV yüklemen gerekiyor.")).toBeInTheDocument());
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it("eksiksiz form önce dosyayı yükler, sonra RPC'yi çağırır", async () => {
    render(<CareerApplicationForm selectedPosition="coo" />);

    fireEvent.change(screen.getByLabelText(/Ad soyad/), { target: { value: "Ömer Çelik" } });
    fireEvent.change(screen.getByLabelText(/E-posta/), { target: { value: "omer@example.com" } });
    fireEvent.change(screen.getByLabelText(/Ülke/), { target: { value: "Türkiye" } });
    fireEvent.change(screen.getByLabelText("CV", { exact: false }), { target: { files: [pdf()] } });
    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(screen.getByRole("button", { name: /Başvurumu gönder/ }));

    await waitFor(() => expect(submitSpy).toHaveBeenCalledTimes(1));
    expect(uploadSpy).toHaveBeenCalledTimes(1);
    // Sıra önemli: yol tabloda `not null` ve anon satırı sonradan güncelleyemez.
    expect(uploadSpy.mock.invocationCallOrder[0]).toBeLessThan(submitSpy.mock.invocationCallOrder[0]);
    expect(toastSpy.success).toHaveBeenCalled();
  });

  it("seçilen pozisyon forma yansır — SONRADAN değişse bile", () => {
    // ⚠️ Bu testin ilk hâli formu doğrudan `selectedPosition="network"` ile
    // çiziyordu ve mutasyonu KAÇIRDI: `defaultValues` zaten seçimi taşıdığı için
    // senkron eden `useEffect` silinse de yeşil kalıyordu. Gerçek senaryo bu:
    // form zaten ekrandayken kullanıcı yukarıdaki ilan listesinden "Bu pozisyona
    // başvur"a basıyor, yani seçim MOUNT'TAN SONRA değişiyor.
    const { rerender } = render(<CareerApplicationForm selectedPosition={null} />);
    expect(screen.getByLabelText(/Pozisyon/)).toHaveValue("");

    rerender(<CareerApplicationForm selectedPosition="network" />);

    expect(screen.getByLabelText(/Pozisyon/)).toHaveValue("network");
  });

  it("KVKK ve gizlilik bağlantıları gerçek rotalara gider", () => {
    render(<CareerApplicationForm selectedPosition={null} />);

    expect(screen.getByRole("link", { name: /KVKK/ })).toHaveAttribute("href", "/legal/kvkk");
    expect(screen.getByRole("link", { name: /Gizlilik/ })).toHaveAttribute("href", "/legal/privacy");
  });

  it("hata gösterimi `instanceof Error` ile DARALTILMAZ", () => {
    // RPC hataları düz nesnedir; daraltma kullanıcıya `[object Object]` gösterir.
    const source = stripComments(formSource());

    expect(source).toContain("careerErrorMessage(error)");
    expect(source).not.toMatch(/instanceof Error/);
  });

  it("dosya denetimi `accept` niteliğine BAĞLI DEĞİL", () => {
    // Sürükle-bırak `accept`'i hiç dinlemez; gerçek denetim validate ile yapılır.
    const source = dropSource();

    expect(source).toContain("validate(candidate)");
    expect(source).toContain("onDrop");
  });
});

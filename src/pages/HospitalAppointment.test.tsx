/**
 * Hastane randevusu DEMO sayfasıdır (`DEMO_ROUTES` → `/hospital-appointment/:id`).
 *
 * Sayfa yalnız dosya içi örnek veriyle çalışır; gerçek randevu da ödeme de yoktur.
 * Bu test üç şeyi kilitler: (1) demo kart verisi TOPLAMAZ — özet adımında hiçbir
 * veri giriş alanı ve kart numarası / son kullanma / CVV ipucu yoktur; (2) düğme ve
 * bildirim ödeme ya da gerçek randevu İDDİA ETMEZ; (3) galeri başlığı ve kart düğmesi
 * gerçek/online randevu VAAT ETMEZ — demo olduğunu sayfa kendi metniyle de söyler.
 * Gevşetme — düzeltilecek olan sayfadır, iddia değil.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HospitalAppointment from "@/pages/HospitalAppointment";
import { compactSource } from "@/test/source-slice";

const toastSpy = vi.hoisted(() => vi.fn());

vi.mock("@/lib/seo", () => ({ useSeo: () => undefined }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastSpy }) }));
vi.mock("@/contexts/DiasporaContext", () => ({ useDiaspora: () => ({ selectedCountry: "all" }) }));

// Bilinmeyen kimlik → galeri modu. Randevu akışı (`renderBookingFlow`) galeri
// diyaloğu ile doğrudan mod arasında ORTAKTIR; burada sınanan adım ikisinde de aynıdır.
const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/hospital-appointment/bilinmeyen-kimlik"]}>
      <Routes>
        <Route path="/hospital-appointment/:id" element={<HospitalAppointment />} />
      </Routes>
    </MemoryRouter>,
  );

// Kart verisi isteyen bir alanın etiket / placeholder ipucu (`••••`: kart numarası maskesi).
const CARD_FIELD_PATTERN = /kart|cvv|cvc|son kullanma|AA\s*\/\s*YY|•{4}/i;

function walkToSummaryStep(): HTMLElement {
  fireEvent.click(screen.getAllByRole("button", { name: "Demo randevu al" })[0]);
  const dialog = screen.getByRole("dialog");

  fireEvent.click(within(dialog).getByRole("button", { name: /Genel Pratisyen/ }));
  fireEvent.click(within(dialog).getByRole("button", { name: /Devam/ }));

  const dateInput = dialog.querySelector('input[type="date"]');
  expect(dateInput, "tarih alanı bulunamadı").not.toBeNull();
  fireEvent.change(dateInput as HTMLInputElement, { target: { value: "2030-01-15" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "09:00" }));
  fireEvent.click(within(dialog).getByRole("button", { name: /Devam/ }));

  fireEvent.change(within(dialog).getByPlaceholderText("Tam adınız"), { target: { value: "Deneme Üye" } });
  fireEvent.change(within(dialog).getByPlaceholderText("+49 ..."), { target: { value: "+49 30 000000" } });
  fireEvent.click(within(dialog).getByRole("button", { name: /Özete geç/ }));

  return dialog;
}

describe("HospitalAppointment (demo)", () => {
  beforeEach(() => {
    toastSpy.mockClear();
  });

  it("özet adımında kart verisi toplayan hiçbir alan yoktur", () => {
    renderPage();
    const dialog = walkToSummaryStep();

    expect(within(dialog).getByRole("button", { name: /Demo randevuyu tamamla/ })).toBeInTheDocument();
    // Rol sorgusu YETMEZ: `queryAllByRole("textbox")` `type="password"` (rolü yok) ve
    // `type="number"` (rolü `spinbutton`) alanlarını kaçırır. DOM sorgusu her <input>'u
    // yakalar; iframe gömülü ödeme formunu (ör. Stripe Elements) yakalar.
    expect(dialog.querySelectorAll("input"), "özet adımında <input> var").toHaveLength(0);
    expect(dialog.querySelectorAll("textarea, select, iframe"), "özet adımında veri alanı var").toHaveLength(0);
    // `LabelText` yalnız kontrole BAĞLI etiketi bulur; eski kart alanındaki gibi
    // `htmlFor`'suz bir `<Label>` ancak `label` seçicili metin sorgusuyla yakalanır.
    expect(within(dialog).queryAllByLabelText(CARD_FIELD_PATTERN)).toEqual([]);
    expect(within(dialog).queryAllByText(CARD_FIELD_PATTERN, { selector: "label" })).toEqual([]);
    expect(within(dialog).queryAllByPlaceholderText(CARD_FIELD_PATTERN)).toEqual([]);
    expect(within(dialog).queryByText(/Kart Numarası/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /Öde/ })).not.toBeInTheDocument();
    // Ücret gösterilirse ÖRNEK olduğu ve tahsil edilmediği yazılı olmalı.
    expect(within(dialog).getByText(/Örnek ücret/)).toBeInTheDocument();
    expect(within(dialog).getByText(/tahsil edilmez/)).toBeInTheDocument();
  });

  it("tamamlama bildirimi gerçek randevu ya da ödeme iddia etmez", () => {
    renderPage();
    const dialog = walkToSummaryStep();

    fireEvent.click(within(dialog).getByRole("button", { name: /Demo randevuyu tamamla/ }));

    expect(toastSpy).toHaveBeenCalledTimes(1);
    const [{ title, description }] = toastSpy.mock.calls[0] as [{ title: string; description: string }];
    expect(title).toBe("Demo — gerçek randevu oluşturulmadı");
    expect(description).not.toMatch(/oluşturuldu|ödendi|ödeme alındı/i);
  });

  // Demo bandı `SiteHeader`'dan gelir (CLAUDE.md DEMO deseni: uyarı sayfaya elle yazılmaz);
  // sayfanın kendi başlığı yalnız dürüst tarif eder — gerçek randevu VAAT ETMEZ.
  it("galeri başlığı ve kart düğmesi gerçek randevu vaat etmez", () => {
    renderPage();

    expect(screen.queryByText(/online randevu/i)).not.toBeInTheDocument();
    expect(screen.getByText(/örnek hastanelerle deneyin/i)).toBeInTheDocument();
    expect(screen.getByText(/Örnek ücret/)).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: "Randevu Al" })).toEqual([]);
    expect(screen.getAllByRole("button", { name: "Demo randevu al" }).length).toBeGreaterThan(0);
  });

  it("kaynakta kart alanı ya da ödeme iddiası yoktur (doğrudan mod dahil)", () => {
    const source = readFileSync(path.resolve(process.cwd(), "src/pages/HospitalAppointment.tsx"), "utf8");

    for (const forbidden of [
      "Kart Numarası",
      "CVV",
      "AA/YY",
      "Öde & Randevu Al",
      "Randevu Oluşturuldu",
      "Ödemeye Geç",
      "online randevu alın",
    ]) {
      // Prettier JSX metnini satırlara bölebilir: iki taraf da sıkıştırılır (CLAUDE.md, compactSource).
      expect(compactSource(source), `${forbidden} kaynağa geri dönmüş`).not.toContain(compactSource(forbidden));
    }
  });
});

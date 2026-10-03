// A15 — Cadde kimlik işaretinin sözleşmesi.
//
// Kapattığı sessiz başarısızlık sınıfları:
//   1. **İşaretin kendi bloğuna taşınması.** Y1 (m151) kimlik ŞERİDİNİ, 05.08.2026
//      kararı da akışın üstündeki tam genişlik bloklarını kaldırmıştı. İşaret çip
//      satırının İÇİNDEN çıkarsa o iki karar sessizce geri alınır: test, işaretin
//      kapsam şeridinin içinde VE çip satırının ilk çocuğu olduğunu kilitler.
//   2. **Alt sayfalara sızma.** `brandSlot` isteğe bağlıdır; /cadde/cafe ve
//      /cadde/carsi aynı bileşeni prop'suz kullanır. Varsayılan bir değer
//      verilirse o iki sayfa haberi olmadan değişir.
//   3. **Ekran okuyucuda çift ad.** Sayfanın h1'i zaten "Diaspora Cadde" diyor.
//      İşarete metin verilirse aynı ad iki kez okunur.
//   4. **Saydamlığın kaybı — asıl tuzak.** Burak'ın verdiği kaynak PNG'de alfa
//      kanalı YOKTU (color type 2) ve zemini beyazdı; olduğu gibi konsaydı koyu
//      modda beyaz bir kutu olarak görünürdü. Dosya bir gün opak bir sürümle
//      değiştirilirse ne tsc ne lint ne de görsel test bunu yakalar — bu yüzden
//      PNG başlığı doğrudan okunur.
import { readFileSync } from "node:fs";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CaddeBrandMark from "@/components/cadde/CaddeBrandMark";
import CaddeFeedScopeBar from "@/components/cadde/CaddeFeedScopeBar";
import { sliceBetween } from "@/test/source-slice";

const LOGO = "public/cadde-logo.png";

const renderBar = (extra: Partial<Parameters<typeof CaddeFeedScopeBar>[0]> = {}) =>
  render(
    <CaddeFeedScopeBar
      scope="all"
      hashtag=""
      onScopeChange={vi.fn()}
      onClearHashtag={vi.fn()}
      {...extra}
    />,
  );

describe("A15 · kimlik işareti yerleşimi", () => {
  it("işaret kapsam şeridinin İÇİNDE durur — akışın üstünde ayrı blok değil", () => {
    renderBar({ brandSlot: <CaddeBrandMark /> });

    const bar = screen.getByTestId("cadde-feed-scope-bar");
    const mark = screen.getByTestId("cadde-brand-mark");
    // Şeridin dışına taşınırsa (kendi bloğuna) bu iddia düşer.
    expect(bar).toContainElement(mark);
  });

  it("işaret çip satırının İLK çocuğudur (sol uç) ve satıra ek yükseklik getirmez", () => {
    renderBar({ brandSlot: <CaddeBrandMark /> });

    const mark = screen.getByTestId("cadde-brand-mark");
    const row = mark.parentElement;
    expect(row).not.toBeNull();
    expect(row?.firstElementChild).toBe(mark);
    // ⚠️ `querySelectorAll("button")` YETMEZ — torunları da sayar, yani işaret
    // çip satırının DIŞINA, şeridin köküne taşınsa bile geçerdi (mutasyon M2 ilk
    // turda tam bunu yaptı ve test yeşil kaldı). Doğru koşul: işaretin ebeveyni,
    // çipleri DOĞRUDAN çocuk olarak taşıyan satırın ta kendisi olmalı.
    expect(row?.querySelector(":scope > button")).not.toBeNull();
    // 24px işaret, 30px çip satırının içinde kalır. h-6 dışına çıkmak satırı büyütür.
    expect(mark.className).toContain("h-6");
  });

  it("brandSlot verilmezse işaret HİÇ çizilmez (/cadde/cafe ve /cadde/carsi korunur)", () => {
    renderBar();
    expect(screen.queryByTestId("cadde-brand-mark")).not.toBeInTheDocument();
  });

  it("dekoratiftir: erişilebilirlik ağacına girmez, h1 adını tekrarlamaz", () => {
    renderBar({ brandSlot: <CaddeBrandMark /> });

    const mark = screen.getByTestId("cadde-brand-mark");
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark).toHaveAttribute("alt", "");
    // aria-hidden + boş alt => hiçbir img rolü duyurulmaz.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("akış görünümü işareti gerçekten geçiriyor", () => {
    const view = readFileSync("src/components/cadde/CaddeFeedView.tsx", "utf8");
    // ⚠️ Bitiş çıpası "/>" OLAMAZ: `<CaddeBrandMark />`'in kendi kapanışına denk
    // gelir ve dilim prop'un ortasında kesilir (ilk koşuda tam bu oldu).
    // `onClearHashtag` çağrının son prop'udur, güvenli çıpadır.
    const call = sliceBetween(view, "<CaddeFeedScopeBar", "onClearHashtag", "scope bar çağrısı");
    expect(call).toContain("brandSlot={<CaddeBrandMark />}");
  });
});

describe("A15 · varlık sözleşmesi", () => {
  const png = readFileSync(LOGO);

  it("PNG gerçekten saydamdır — koyu modda beyaz kutu olmaz", () => {
    // IHDR: 8 bayt imza + 4 uzunluk + 4 tip + 4 genişlik + 4 yükseklik + 1 bit derinliği
    const colorType = png[25];
    // 6 = RGBA, 4 = gri+alfa. 2 (RGB) veya 0 (gri) alfa TAŞIMAZ ve tuzağın ta kendisidir.
    expect([4, 6]).toContain(colorType);
  });

  it("işaret kare ve makul çözünürlükte", () => {
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    expect(width).toBe(height);
    // 24px'te net görünsün diye yeterince büyük, ama 2000px kaynak kadar şişkin değil.
    expect(width).toBeGreaterThanOrEqual(256);
    expect(width).toBeLessThanOrEqual(1024);
  });

  it("dosya boyutu akışın üstünde taşınacak kadar küçük", () => {
    // Kaynak 3.095 KB idi. 400 KB üstü bir varlık bu yüzeyde taşınmaz.
    expect(png.byteLength).toBeLessThan(400 * 1024);
  });

  it("bileşen bu dosyayı gösterir — yol kayarsa sessizce kırık görsel kalır", () => {
    const source = readFileSync("src/components/cadde/CaddeBrandMark.tsx", "utf8");
    expect(source).toContain('src="/cadde-logo.png"');
  });
});

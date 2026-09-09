// Y2 (m153) — header daraltma SÖZLEŞMESİ.
//
// Bu, "Değişmez sözleşmeler" ailesinden bir metin testidir (bkz. redirects.test.ts,
// cadde-style-contract.test.ts). Kapattığı sessiz kırılma sınıfı şu:
//
//   Daraltma üç ayrı dosyanın ANLAŞMASIYLA çalışır —
//     1. SiteHeader.tsx      : dört sınıf adını basar,
//     2. index.css           : aynı adları `:root[data-header-compact]` altında eşler,
//     3. useCompactHeaderOnScroll.ts : özniteliği documentElement'e yazar.
//   Üçünden BİRİ değişirse hiçbir test kırılmaz, build patlamaz, lint susar —
//   yalnızca header artık daralmaz. Kusur ancak gözle fark edilir.
//
// Bu yüzden anlaşma metin düzeyinde kilitleniyor.

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const HEADER = readFileSync("src/components/SiteHeader.tsx", "utf8");
const CSS = readFileSync("src/index.css", "utf8");
const HOOK = readFileSync("src/hooks/useCompactHeaderOnScroll.ts", "utf8");

/** Üç dosyanın da tanıması gereken sınıf adları. */
const CONTRACT_CLASSES = [
  "site-header",
  "site-header__nav",
  "site-header__brand",
  "site-header__logo",
] as const;

describe("header daraltma sözleşmesi", () => {
  // ⚠️ `toContain` BURADA YETMEZ ve bu ölçülerek görüldü (09.09.2026): sınıf adları
  // birbirinin ÖN EKİ ("site-header" ⊂ "site-header__nav") ve bir yeniden adlandırma
  // da ön ek bırakır ("site-header__logo" ⊂ "site-header__logoX"). İlk yazdığım
  // `toContain` testi, CSS'te adı `__logoX` yapınca DÜŞMEDİ — yani koruduğunu
  // sandığım şeyi hiç korumuyordu. Sınır (word-boundary) şart.
  const exact = (className: string) => new RegExp(`${className}(?![\\w-])`);

  it.each(CONTRACT_CLASSES)("'%s' hem SiteHeader'da hem CSS'te TAM adıyla geçer", (className) => {
    expect(HEADER).toMatch(exact(className));
    expect(CSS).toMatch(exact(className));
  });

  it("CSS kuralları YALNIZ öznitelik varken eşleşir", () => {
    // Öznitelik yokken (hook'u çağırmayan 60 public rota) hiçbir kural devreye
    // girmemeli — aksi halde Cadde için yapılan bir değişiklik tüm siteyi etkiler.
    const block = CSS.slice(CSS.indexOf("Y2 (m153)"));
    const selectorLines = block
      .split("\n")
      .filter((line) => line.includes(".site-header"));

    expect(selectorLines.length).toBeGreaterThan(0);
    for (const line of selectorLines) {
      expect(line).toContain(":root[data-header-compact");
    }
  });

  it("hook özniteliği documentElement'e yazar, React state kullanmaz", () => {
    // State'e geçmek SiteHeader'ı her scroll tikinde yeniden render ettirir —
    // 61 rotanın paylaştığı bileşende bu kabul edilemez.
    expect(HOOK).toContain("documentElement");
    expect(HOOK).not.toContain("useState");
  });

  it("SiteHeader scroll mantığı TAŞIMAZ", () => {
    // Y2'nin tüm tasarımı buna dayanıyor: paylaşılan bileşende sıfır scroll mantığı.
    // KELİMEYİ değil KODU denetliyoruz — dosyadaki açıklama yorumu "scroll" kelimesini
    // meşru olarak içeriyor; yasak olan dinleyici bağlamak ve konum okumak.
    expect(HEADER).not.toContain("addEventListener");
    expect(HEADER).not.toContain("scrollY");
    // Özniteliği YAZMAK yasak; ondan söz eden açıklama yorumu meşru.
    expect(HEADER).not.toContain("dataset");
    expect(HEADER).not.toContain("setAttribute");
  });

  it("histerezis eşikleri ayrıdır ve hook'ta tanımlıdır", () => {
    // Tek eşiğe indirmek titreme üretir; sözleşme burada da yazılı olsun.
    expect(HOOK).toContain("HEADER_COMPACT_ON_SCROLL_Y");
    expect(HOOK).toContain("HEADER_COMPACT_OFF_SCROLL_Y");
  });

  it("scroll dinleyicisi passive bağlanır", () => {
    expect(HOOK).toContain("passive: true");
  });
});

// T1 (m137) — marka renginin İKİ KAYNAĞI arasındaki sözleşme.
//
// `#aa8c42` iki yerde yaşıyor ve ikisi de dışarıya çıkıyor:
//   1. scripts/social-generate/config.mjs -> `bronze` (LinkedIn görselleri)
//   2. src/index.css -> `--cadde-brand` (arayüz)
// Biri değişip diğeri kalırsa marka rengi platformla görselleri arasında AYRIŞIR ve
// bunu hiçbir test/build yakalamaz — kusur ancak yan yana koyunca görülür.
//
// Bu test HSL token'ı hex'e çevirip karşılaştırır, yani "43 44% 46%" gerçekten
// #aa8c42 mi sorusunu da yanıtlar (elle çevirim hatası bu testte düşer).

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const CSS = readFileSync("src/index.css", "utf8");
const SOCIAL_CONFIG = readFileSync("scripts/social-generate/config.mjs", "utf8");
const CADDE_PAGE = readFileSync("src/pages/cadde/CaddePage.tsx", "utf8");
const SPONSORED_CARD = readFileSync("src/components/cadde/SponsoredFeedCard.tsx", "utf8");
const SCOPE_BAR = readFileSync("src/components/cadde/CaddeFeedScopeBar.tsx", "utf8");
const COMPOSER = readFileSync("src/components/cadde/CaddeComposer.tsx", "utf8");
const CAFES_PANEL = readFileSync("src/components/cadde/CaddeCafesPanel.tsx", "utf8");
const CAFE_PAGE = readFileSync("src/pages/cadde/CaddeCafePage.tsx", "utf8");
const CARSI_PAGE = readFileSync("src/pages/cadde/CaddeCarsiPage.tsx", "utf8");
const CARSI_ITEM_PAGE = readFileSync("src/pages/cadde/CaddeCarsiItemPage.tsx", "utf8");

/** `--cadde-brand: 43 44% 46%;` -> [43, 44, 46] */
function readHslToken(name: string): [number, number, number] {
  const match = CSS.match(new RegExp(`--${name}:\\s*([\\d.]+)\\s+([\\d.]+)%\\s+([\\d.]+)%`));
  if (!match) throw new Error(`Token bulunamadı: --${name}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const lig = l / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lig - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const toByte = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hex = hslToHex(h, s, l);
  return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255) as [number, number, number];
}

function contrastRatio(first: [number, number, number], second: [number, number, number]): number {
  const luminance = (rgb: [number, number, number]) =>
    rgb
      .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function countClass(source: string, className: string): number {
  return [...source.matchAll(new RegExp(`\\b${className}\\b`, "g"))].length;
}

describe("marka rengi sözleşmesi", () => {
  it("sosyal üretici bronze'u hâlâ #aa8c42", () => {
    // Bu satır değişirse arayüz token'ı da değişmeli — testin diğer yarısı onu tutar.
    expect(SOCIAL_CONFIG).toContain("bronze: '#aa8c42'");
  });

  it("--cadde-brand token'ı #aa8c42'ye çözülür", () => {
    const [h, s, l] = readHslToken("cadde-brand");
    // ±1 bayt tolerans: HSL->hex yuvarlaması tam sayı derece/yüzdede birebir tutmaz.
    const hex = hslToHex(h, s, l);
    const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const expected = [0xaa, 0x8c, 0x42];

    for (const [index, value] of channels.entries()) {
      expect(Math.abs(value - expected[index])).toBeLessThanOrEqual(1);
    }
  });

  it("brand varyantları aynı tonda kalır (yalnız açıklık/doygunluk değişir)", () => {
    const base = readHslToken("cadde-brand");
    for (const variant of ["cadde-brand-strong", "cadde-brand-soft", "cadde-brand-ink"]) {
      const [h] = readHslToken(variant);
      // Ton kayarsa varyant artık aynı rengin tonu değil, BAŞKA bir renk olur.
      expect(Math.abs(h - base[0])).toBeLessThanOrEqual(2);
    }
  });

  it("T2: beyaz metinli güçlü marka zemini AA kontrastını güvenli marjla geçer", () => {
    const white: [number, number, number] = [1, 1, 1];
    expect(contrastRatio(hslToRgb(...readHslToken("cadde-brand")), white)).toBeLessThan(4.5);
    expect(contrastRatio(hslToRgb(...readHslToken("cadde-brand-strong")), white)).toBeGreaterThanOrEqual(4.8);
  });

  it("T2: ayrılmış birincil eylemlerin tamamı ortak güçlü marka sınıfını kullanır", () => {
    expect(countClass(CADDE_PAGE, "cadde-primary-action")).toBeGreaterThan(0);
    expect(CSS).toMatch(/\.cadde-primary-action\s*{[^}]*var\(--cadde-brand-strong\)[^}]*color:\s*white/s);
    expect(CSS).toMatch(/\.cadde-primary-action:hover\s*{[^}]*var\(--cadde-brand-ink\)/s);
  });

  it("T3: üç seviyeli eylem dili ortak token sınıflarında tanımlıdır", () => {
    expect(CSS).toMatch(/\.cadde-secondary-action\s*{[^}]*border[^}]*var\(--cadde-line\)[^}]*background-color:\s*hsl\(var\(--cadde-panel\)\)[^}]*color:\s*hsl\(var\(--cadde-ink\)\)/s);
    expect(CSS).toMatch(/\.cadde-tertiary-action\s*{[^}]*background-color:\s*transparent[^}]*color:\s*hsl\(var\(--cadde-brand-ink\)\)/s);
  });

  it("T3: eylem token'ları portallı modal içeriklerinde de kökten erişilebilir", () => {
    const rootBlock = CSS.match(/:root\s*{([^}]*)}/s)?.[1] ?? "";
    for (const token of ["cadde-ink", "cadde-panel", "cadde-line", "cadde-brand", "cadde-brand-strong", "cadde-brand-soft", "cadde-brand-ink"]) {
      expect(rootBlock).toMatch(new RegExp(`--${token}:\\s`));
    }
  });

  it("T3: her Cadde giriş yüzeyi en fazla bir primary bildirir", () => {
    for (const source of [CADDE_PAGE, COMPOSER, CAFE_PAGE, CARSI_PAGE, CARSI_ITEM_PAGE]) {
      expect(countClass(source, "cadde-primary-action")).toBeLessThanOrEqual(1);
    }
    expect(countClass(COMPOSER, "cadde-primary-action")).toBe(1);
    expect(countClass(SPONSORED_CARD, "cadde-primary-action")).toBe(0);
    expect(countClass(CAFES_PANEL, "cadde-primary-action")).toBe(0);
  });

  it("T2: aktif kapsam çipi kimlik bronzunu erişilebilir koyu mürekkeple kullanır", () => {
    expect(SCOPE_BAR).toMatch(/active[\s\S]*?"cadde-filter-active"/);
    expect(CSS).toMatch(
      /\.cadde-filter-active\s*{[^}]*border-color:\s*hsl\(var\(--cadde-brand\)\)[^}]*background-color:\s*hsl\(var\(--cadde-brand\)\)[^}]*color:\s*hsl\(var\(--cadde-ink\)\)/s,
    );
    expect(contrastRatio(hslToRgb(...readHslToken("cadde-brand")), hslToRgb(...readHslToken("cadde-ink")))).toBeGreaterThanOrEqual(4.5);
  });

  it("dekoratif turuncu aksan SİLİNMEDİ", () => {
    // brand, accent'in yerine geçmez — biri kimlik, diğeri vurgu.
    expect(CSS).toMatch(/--cadde-accent:\s/);
  });

  it("token dokümanı mevcut", () => {
    // Kuralın yazılı olduğu tek yer; silinirse T2-T8 dayanaksız kalır.
    expect(() => readFileSync("docs/modules/cadde-design-tokens.md", "utf8")).not.toThrow();
  });
});

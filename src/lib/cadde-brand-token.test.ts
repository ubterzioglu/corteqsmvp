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

  it("dekoratif turuncu aksan SİLİNMEDİ", () => {
    // brand, accent'in yerine geçmez — biri kimlik, diğeri vurgu.
    expect(CSS).toMatch(/--cadde-accent:\s/);
  });

  it("token dokümanı mevcut", () => {
    // Kuralın yazılı olduğu tek yer; silinirse T2-T8 dayanaksız kalır.
    expect(() => readFileSync("docs/modules/cadde-design-tokens.md", "utf8")).not.toThrow();
  });
});

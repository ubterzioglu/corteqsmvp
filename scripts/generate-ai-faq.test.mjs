// public/ai/faq.json ↔ index.html FAQPage senkron sözleşmesi.
//
// faq.json eskiden ELLE yazılmış 3 soruydu (index.html'de 12 soru vardı) ve cevaplardan biri
// ("Premium: sınırsız iş ilanı…") ürün modeliyle doğrulanmamıştı. Tek kaynak index.html'deki
// FAQPage'dir; faq.json ondan BETİKLE üretilir, elle düzenlenmez.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildFaqJson, extractFaqPage } from "./generate-ai-faq.mjs";

const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
const faqFile = readFileSync(resolve(process.cwd(), "public/ai/faq.json"), "utf8");

describe("extractFaqPage", () => {
  it("index.html'deki FAQPage'i bulur (12 soru)", () => {
    const faq = extractFaqPage(html);

    expect(faq["@type"]).toBe("FAQPage");
    expect(faq.mainEntity.length).toBeGreaterThanOrEqual(10);
  });

  it("@graph içinde ya da düz nesne olarak verilen FAQPage'i de bulur", () => {
    const duz = `<script type="application/ld+json">{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"a","acceptedAnswer":{"@type":"Answer","text":"b"}}]}</script>`;
    const graf = `<script type="application/ld+json">{"@graph":[{"@type":"WebSite"},{"@type":"FAQPage","mainEntity":[]}]}</script>`;

    expect(extractFaqPage(duz).mainEntity).toHaveLength(1);
    expect(extractFaqPage(graf)["@type"]).toBe("FAQPage");
  });

  it("FAQPage yoksa AÇIKÇA düşer (sessizce boş dosya üretmez)", () => {
    expect(() => extractFaqPage("<html></html>")).toThrow("FAQPage");
    expect(() =>
      extractFaqPage(`<script type="application/ld+json">{"@type":"WebSite"}</script>`),
    ).toThrow("FAQPage");
  });
});

describe("public/ai/faq.json ↔ index.html senkronu", () => {
  it("faq.json, index.html'deki FAQPage'den üretilmiş olanla BİREBİR aynıdır", () => {
    const beklenen = buildFaqJson(extractFaqPage(html));

    expect(
      faqFile,
      "faq.json bayat/elle düzenlenmiş — `node scripts/generate-ai-faq.mjs` ile yeniden üret",
    ).toBe(beklenen);
  });

  it("soru sayısı ve soru metinleri index.html ile eşittir", () => {
    const kaynak = extractFaqPage(html).mainEntity;
    const dosya = JSON.parse(faqFile).mainEntity;

    expect(dosya.map((q) => q.name)).toEqual(kaynak.map((q) => q.name));
    expect(dosya.map((q) => q.acceptedAnswer.text)).toEqual(kaynak.map((q) => q.acceptedAnswer.text));
  });

  it("Türkçe karakterler bozulmadan korunur (ASCII'ye düşmez)", () => {
    const metin = JSON.parse(faqFile).mainEntity.map((q) => q.name + q.acceptedAnswer.text).join(" ");

    expect(metin).toMatch(/[çğıöşüÇĞİÖŞÜ]/);
    expect(faqFile).not.toMatch(/\\u[0-9a-f]{4}/i); // kaçış dizisi yok, ham karakter
    // Mojibake'yi ayrıca aramaya gerek yok: index.html ile BİREBİR eşitlik testi her bozulmayı yakalar.
  });

  it("doğrulanamayan sayısal iddiaları taşımaz (CLAUDE.md: 164 ülke / 8,8 milyon)", () => {
    expect(faqFile).not.toMatch(/164/);
    expect(faqFile).not.toMatch(/8[.,]8\s*milyon/i);
  });

  it("geçerli FAQPage şemasıdır: her soruda Question + acceptedAnswer.text", () => {
    const parsed = JSON.parse(faqFile);

    expect(parsed["@context"]).toBe("https://schema.org");
    expect(parsed["@type"]).toBe("FAQPage");
    for (const soru of parsed.mainEntity) {
      expect(soru["@type"]).toBe("Question");
      expect(soru.name.trim().length).toBeGreaterThan(5);
      expect(soru.acceptedAnswer["@type"]).toBe("Answer");
      expect(soru.acceptedAnswer.text.trim().length).toBeGreaterThan(20);
    }
  });
});

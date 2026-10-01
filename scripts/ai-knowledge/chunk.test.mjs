import { describe, expect, it } from "vitest";

import { DEFAULT_MAX_CHARS, MIN_CHUNK_CHARS, chunkText } from "./chunk.mjs";

describe("chunkText", () => {
  it("bos girdi icin bos dizi doner", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n  ")).toEqual([]);
    expect(chunkText(null)).toEqual([]);
    expect(chunkText(undefined)).toEqual([]);
  });

  it("ust sinirin altindaki metni tek parca birakir", () => {
    const text = "Almanya'da oturum izni basvurusu.\n\nRandevu almak gerekir.";
    expect(chunkText(text)).toEqual([text]);
  });

  it("paragraf sinirindan boler, cumle ortasindan kesmez", () => {
    const paragraph = "A".repeat(400);
    const text = [paragraph, paragraph, paragraph].join("\n\n");
    const chunks = chunkText(text, { maxChars: 900, overlapChars: 0 });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(900);
    }
  });

  it("her parca ust siniri asmaz — tek paragraf cok uzun olsa bile", () => {
    // Cumle sinirı bile olmayan tek kelimelik dev metin: sert kesme devreye girmeli.
    const text = "x".repeat(10_000);
    const chunks = chunkText(text, { maxChars: 500, overlapChars: 0 });

    expect(chunks.length).toBeGreaterThanOrEqual(20);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(500);
    }
  });

  it("hicbir icerik kaybolmaz (ortusmesiz halde)", () => {
    const text = Array.from({ length: 12 }, (_, index) => `Paragraf ${index}. ${"kelime ".repeat(40)}`).join("\n\n");
    const chunks = chunkText(text, { maxChars: 600, overlapChars: 0 });

    const rejoined = chunks.join(" ").replace(/\s+/g, " ");
    for (let index = 0; index < 12; index += 1) {
      expect(rejoined).toContain(`Paragraf ${index}.`);
    }
  });

  it("ortusme onceki parcanin kuyrugunu bir sonrakinin basina tasir", () => {
    const first = "BASLANGIC. " + "a".repeat(380) + " KUYRUKISARETI.";
    const second = "IKINCI PARAGRAF.";
    const chunks = chunkText([first, second].join("\n\n"), { maxChars: 420, overlapChars: 120 });

    expect(chunks.length).toBe(2);
    expect(chunks[1]).toContain("KUYRUKISARETI");
    expect(chunks[1]).toContain("IKINCI PARAGRAF");
  });

  it("cok kisa son parcayi bir oncekine yapistirir", () => {
    const long = "b".repeat(500);
    const chunks = chunkText([long, "kisa"].join("\n\n"), { maxChars: 700, overlapChars: 0 });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain("kisa");
  });

  it("Turkce karakterleri bozmaz", () => {
    const text = "İstanbul'da yaşayan mühendis. Çalışma izni gerekli. Öğrenci vizesi ayrıdır.";
    expect(chunkText(text)).toEqual([text]);
  });

  it("varsayilan sinirlar makul degerlerde", () => {
    expect(DEFAULT_MAX_CHARS).toBeGreaterThan(MIN_CHUNK_CHARS);
    expect(MIN_CHUNK_CHARS).toBeGreaterThan(0);
  });

  it("maxChars cok kucuk verilse bile sonsuz donguye girmez", () => {
    const chunks = chunkText("kelime ".repeat(200), { maxChars: 1, overlapChars: 50 });
    expect(chunks.length).toBeGreaterThan(0);
  });
});

describe("vekil cifti guvenligi (N07 kusuru — canli olcum 01.10)", () => {
  // Yalniz vekil: yuksek vekilin esligi olmayan alt vekil ya da tersi.
  // PostgREST (aeson) bunu "Empty or invalid json" diye reddeder.
  const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

  it("ortusme kuyrugu emojiyi ortasindan kesemez — gercek olay: KALANLAR.md chunk 5", () => {
    // 🔴 (U+1F534, iki UTF-16 birimi) tam slice(-overlapChars) kesimine denk gelir:
    // birinci paragraf 1401 birim; emoji 1200–1201'de; kesim 1201'den başlar.
    const first = "a".repeat(1200) + "🔴" + "a".repeat(199);
    const second = "b".repeat(300);
    const chunks = chunkText([first, second].join("\n\n"), { maxChars: 1500, overlapChars: 200 });

    expect(chunks.length).toBe(2);
    for (const chunk of chunks) {
      expect(chunk).not.toMatch(LONE_SURROGATE);
    }
    // Emoji ilk parçada BÜTÜN kalır; ikinci parçaya yarım karakter sızmaz.
    expect(chunks[0]).toContain("🔴");
    expect(chunks[1]).not.toContain("🔴");
    expect(chunks[1]).toContain("b".repeat(10));
  });

  it("sert kesim de vekil ciftini bolmez", () => {
    const text = "🔴".repeat(2000); // bosluksuz tek paragraf → hardSplit garantili
    const chunks = chunkText(text, { maxChars: 101, overlapChars: 0 }); // tek sayi sinir → çiftin ortası

    expect(chunks.length).toBeGreaterThan(10);
    for (const chunk of chunks) {
      expect(chunk).not.toMatch(LONE_SURROGATE);
    }
  });

  it("emoji dolu metinde hicbir sinir yalniz vekil uretmez (tarama)", () => {
    const text = Array.from({ length: 40 }, (_, index) => `Paragraf ${index}: ` + "🔴🟡🟢 x ".repeat(30)).join("\n\n");

    for (const maxChars of [80, 137, 200, 512, 1500]) {
      for (const overlapChars of [0, 50, 200]) {
        const chunks = chunkText(text, { maxChars, overlapChars });
        expect(chunks.length).toBeGreaterThan(0);
        for (const chunk of chunks) {
          expect(chunk, `maxChars=${maxChars} overlap=${overlapChars}`).not.toMatch(LONE_SURROGATE);
        }
      }
    }
  });
});

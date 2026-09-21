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

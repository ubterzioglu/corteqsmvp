import { describe, expect, it } from "vitest";

import { trCompare, trFold, trIncludes, trLower, trSlugify, trUpper } from "./text-normalization";

describe("trUpper / trLower", () => {
  it("İ/ı dönüşümlerini Türkçe kurala göre yapar", () => {
    expect(trUpper("istanbul")).toBe("İSTANBUL");
    expect(trUpper("ısparta")).toBe("ISPARTA");
    expect(trLower("İSTANBUL")).toBe("istanbul");
    expect(trLower("ISPARTA")).toBe("ısparta");
  });

  it("diğer Türkçe harfleri korur", () => {
    expect(trUpper("çağrı öğüt şen")).toBe("ÇAĞRI ÖĞÜT ŞEN");
    expect(trLower("ÇAĞRI ÖĞÜT ŞEN")).toBe("çağrı öğüt şen");
  });
});

describe("trFold", () => {
  it("aksanları ve ı/i ayrımını tek anahtara indirir", () => {
    expect(trFold("İstanbul")).toBe("istanbul");
    expect(trFold("ISPARTA")).toBe("isparta");
    expect(trFold("Üsküdar")).toBe("uskudar");
    expect(trFold("Çağrı")).toBe("cagri");
  });
});

describe("trIncludes", () => {
  it("kullanıcı sade ASCII yazsa da Türkçe kaydı bulur", () => {
    expect(trIncludes("İstanbul Boğazı", "istanbul")).toBe(true);
    expect(trIncludes("Üsküdar Çarşısı", "uskudar carsi")).toBe(true);
    expect(trIncludes("Üsküdar Çarşısı", "carsi")).toBe(true);
    expect(trIncludes("Diyarbakır", "DİYARBAKIR")).toBe(true);
  });

  it("boş arama her şeyi eşleştirir, null haystack güvenlidir", () => {
    expect(trIncludes("herhangi", "  ")).toBe(true);
    expect(trIncludes(null, "x")).toBe(false);
    expect(trIncludes(undefined, "x")).toBe(false);
  });
});

describe("trCompare", () => {
  it("Türkçe alfabe sırasını uygular", () => {
    const sorted = ["şehir", "istanbul", "çanakkale", "ankara", "izmir"].sort(trCompare);
    expect(sorted).toEqual(["ankara", "çanakkale", "istanbul", "izmir", "şehir"]);
  });
});

// 7 ayrı slugify kopyasının ortak hâli (W3, 07.11). Slug URL'de ve DB'de saklanır:
// mevcut kayıtlar yeniden hesaplanmaz, ama var olan bir slug'ı tekrar geçirmek onu
// DEĞİŞTİRMEMELİ (idempotent) — konsolosluk/marquee formları kaydedilmiş slug'ı yeniden geçirir.
describe("trSlugify", () => {
  it("Türkçe harfleri katlar — eski iki kopyanın hatası burada kapanır", () => {
    // WhatsApp/anket kopyası bare toLowerCase kullanıyordu: "İstanbul" → "i-stanbul".
    expect(trSlugify("İstanbul Türkleri")).toBe("istanbul-turkleri");
    // Brainstorming kopyası ı'yı eşlemiyordu: "Kış Okulu" → "k-s-okulu".
    expect(trSlugify("Kış Okulu")).toBe("kis-okulu");
    expect(trSlugify("IŞIK ÇĞÖÜ")).toBe("isik-cgou");
  });

  it("şapkalı ve yabancı aksanlı harfleri düşürür", () => {
    expect(trSlugify("Hâlâ Kâğıt")).toBe("hala-kagit");
    expect(trSlugify("Café Zürich")).toBe("cafe-zurich");
  });

  it("[a-z0-9] dışı her diziyi tek tireye indirir, baştaki/sondaki tireyi kırpar", () => {
    expect(trSlugify("  --Çok   Özel--  ")).toBe("cok-ozel");
    expect(trSlugify("Berlin Türk Girişimciler 2026!!")).toBe("berlin-turk-girisimciler-2026");
    expect(trSlugify("!!!")).toBe("");
  });

  it("maxLength kırpmadan SONRA uygulanır (eski kopyaların sırası)", () => {
    expect(trSlugify("a".repeat(100), 60)).toHaveLength(60);
    expect(trSlugify("--abc--", 2)).toBe("ab");
    expect(trSlugify("abc def", 4)).toBe("abc-");
  });

  it("var olan slug'ı değiştirmez (idempotent)", () => {
    for (const slug of ["berlin-turk-girisimciler-2026", "istanbul", "a-b-c-1"]) {
      expect(trSlugify(slug)).toBe(slug);
      expect(trSlugify(trSlugify(`${slug} İ`))).toBe(trSlugify(`${slug} İ`));
    }
  });
});

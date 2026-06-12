import { describe, expect, it } from "vitest";

import { trCompare, trFold, trIncludes, trLower, trUpper } from "./text-normalization";

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
    expect(trIncludes("Üsküdar Çarşısı", "uskudar carsi")).toBe(false); // tek geçiş aranır
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

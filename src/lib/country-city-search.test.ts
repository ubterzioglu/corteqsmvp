import { describe, expect, it } from "vitest";

import { filterByQuery, normalizeSearchText } from "./country-city-search";

describe("normalizeSearchText", () => {
  it("büyük noktalı İ, sade i'ye katlanır — birleşen nokta (U+0307) KALMAZ", () => {
    // Kök neden (2026-11-07): toLowerCase() "İ" → "i" + U+0307 üretir; sonraki
    // replace(/İ/g) hiç tetiklenmez ve "İstanbul" "istanbul" ile eşleşmezdi.
    expect(normalizeSearchText("İstanbul")).toBe("istanbul");
    expect(normalizeSearchText("İzmir")).toBe("izmir");
    expect(normalizeSearchText("İstanbul").length).toBe("istanbul".length);
  });

  it("Türkçe harfleri katlar", () => {
    expect(normalizeSearchText("Şanlıurfa")).toBe("sanliurfa");
    expect(normalizeSearchText("Çanakkale")).toBe("canakkale");
    expect(normalizeSearchText("Muğla")).toBe("mugla");
    expect(normalizeSearchText("Üsküdar")).toBe("uskudar");
    expect(normalizeSearchText("ISPARTA")).toBe("isparta");
  });

  it("Avrupa diasporası şehir adlarını katlar", () => {
    expect(normalizeSearchText("München")).toBe("munchen");
    expect(normalizeSearchText("Düsseldorf")).toBe("dusseldorf");
    expect(normalizeSearchText("Straße")).toBe("strasse");
    expect(normalizeSearchText("København")).toBe("kobenhavn");
    expect(normalizeSearchText("Łódź")).toBe("lodz");
    expect(normalizeSearchText("Malmö")).toBe("malmo");
    expect(normalizeSearchText("Århus")).toBe("arhus");
    expect(normalizeSearchText("Gdańsk")).toBe("gdansk");
  });
});

describe("filterByQuery", () => {
  const cities = ["İstanbul", "İzmir", "Ankara", "Münih", "München", "Şanlıurfa"];

  it("küçük harfle yazılan sorgu büyük İ ile başlayan şehri bulur", () => {
    expect(filterByQuery(cities, "istanbul")).toEqual(["İstanbul"]);
    expect(filterByQuery(cities, "izm")).toEqual(["İzmir"]);
  });

  it("büyük harfli ve aksansız sorgular da eşleşir", () => {
    expect(filterByQuery(cities, "İSTANBUL")).toEqual(["İstanbul"]);
    expect(filterByQuery(cities, "sanli")).toEqual(["Şanlıurfa"]);
    expect(filterByQuery(cities, "mun").sort()).toEqual(["München", "Münih"]);
  });

  it("boş sorgu listeyi olduğu gibi döner", () => {
    expect(filterByQuery(cities, "   ")).toBe(cities);
  });
});

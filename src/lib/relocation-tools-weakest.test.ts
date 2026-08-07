// parseWeakestAreas — `primary_result.weakest3` jsonb'si şekil garantisi taşımaz.
// Bu testler bozuk kaydın sonuç ekranını DÜŞÜRMEDİĞİNİ kilitler.
import { describe, expect, it } from "vitest";

import { parseWeakestAreas } from "@/lib/relocation-tools-weakest";

describe("parseWeakestAreas", () => {
  it("canlı payload şeklini olduğu gibi ayrıştırır", () => {
    const areas = parseWeakestAreas({
      score: 56.75,
      weakest3: [
        {
          key: "support_adaptability",
          title: "Destek & Uyum",
          score: 0.425,
          detail: "Bu alanı bu hafta güçlendir: Destek & Uyum.",
        },
      ],
    });

    expect(areas).toEqual([
      {
        key: "support_adaptability",
        title: "Destek & Uyum",
        score: 0.425,
        detail: "Bu alanı bu hafta güçlendir: Destek & Uyum.",
      },
    ]);
  });

  it("alan yoksa, dizi değilse veya primary_result boşsa boş dizi döner", () => {
    expect(parseWeakestAreas({})).toEqual([]);
    expect(parseWeakestAreas({ weakest3: null })).toEqual([]);
    expect(parseWeakestAreas({ weakest3: "bozuk" })).toEqual([]);
    expect(parseWeakestAreas({ weakest3: {} })).toEqual([]);
  });

  it("geçersiz satırları eler, geçerlileri korur — tek bozuk kayıt kartı düşürmez", () => {
    const areas = parseWeakestAreas({
      weakest3: [
        null,
        "metin",
        { title: "Anahtarsız", score: 0.1 },
        { key: "basliksiz", score: 0.1 },
        { key: "skorsuz", title: "Skorsuz", score: "abc" },
        { key: "gecerli", title: "Geçerli", score: 0.3 },
      ],
    });

    expect(areas).toEqual([{ key: "gecerli", title: "Geçerli", score: 0.3, detail: undefined }]);
  });

  it("sayıya çevrilebilen metin skoru kabul eder (jsonb numeric → string dönüşümü)", () => {
    const areas = parseWeakestAreas({
      weakest3: [{ key: "k", title: "T", score: "0.5000" }],
    });

    expect(areas[0].score).toBe(0.5);
  });

  it("detail yoksa undefined bırakır — kart copy metnine düşebilsin", () => {
    const areas = parseWeakestAreas({ weakest3: [{ key: "k", title: "T", score: 0.2 }] });
    expect(areas[0].detail).toBeUndefined();
  });
});

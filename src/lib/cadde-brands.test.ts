import { describe, expect, it } from "vitest";

import { checkBrandConflict, matchesBrandPattern, suggestParodyCafeName } from "@/lib/cadde-rules";

/**
 * SQL ↔ TS AYNA KÜLLİYATI (marka koruması).
 *
 * Beklenen sonuçlar canlı DB'de `public.cadde_check_brand_conflict` çalıştırılıp
 * ÖLÇÜLDÜ. Her iki taraf da kelime sınırında eşleşir: "Nike Cafe" yakalanır,
 * "Teknike Dair" yakalanmaz. Birini değiştiren diğerini de doğrulamalı.
 */
const BRANDS = [
  { brandName: "Starbucks", matchPattern: "starbucks" },
  { brandName: "Nike", matchPattern: "nike" },
  { brandName: "Metro", matchPattern: "metro" },
  { brandName: "Türk Hava Yolları", matchPattern: "turk hava yollari" },
  { brandName: "BigChefs", matchPattern: "bigchefs" },
];

describe("checkBrandConflict (SQL cadde_check_brand_conflict aynası)", () => {
  it.each([
    ["Starbucks Cafe", "Starbucks"],
    ["starbucks sohbet", "Starbucks"],
    ["Berlin NIKE Kosu", "Nike"],
    ["Türk Hava Yolları Kulübü", "Türk Hava Yolları"],
    ["BigChefs Buluşması", "BigChefs"],
  ])("catches %s as %s", (name, expected) => {
    expect(checkBrandConflict(name, BRANDS)).toBe(expected);
  });

  it.each([
    ["Teknike Dair Sohbet"], // "nike" kelime içinde — yakalanmamalı
    ["Metropol Gezisi"], // "metro" kelime içinde — yakalanmamalı
    ["Berlin Yazılım Sohbeti"],
    [""],
  ])("does not flag %s", (name) => {
    expect(checkBrandConflict(name, BRANDS)).toBeNull();
  });

  it("matches Turkish spellings through the accent fold", () => {
    // Kullanıcı "Turk Hava Yollari" yazsa da eşleşmeli (aksan-toleranslı).
    expect(checkBrandConflict("Turk Hava Yollari Dostlari", BRANDS)).toBe("Türk Hava Yolları");
  });

  it("prefers the longest matching pattern", () => {
    const brands = [
      { brandName: "Hava", matchPattern: "hava" },
      { brandName: "Türk Hava Yolları", matchPattern: "turk hava yollari" },
    ];
    expect(checkBrandConflict("Türk Hava Yolları Kulübü", brands)).toBe("Türk Hava Yolları");
  });
});

describe("matchesBrandPattern", () => {
  it("treats punctuation as a word boundary", () => {
    expect(matchesBrandPattern("Cafe-Nike!", "nike")).toBe(true);
  });

  it("returns false for an empty pattern", () => {
    expect(matchesBrandPattern("herhangi bir ad", "")).toBe(false);
  });
});

describe("suggestParodyCafeName", () => {
  it("prefixes the name with Parodi", () => {
    expect(suggestParodyCafeName("Starbucks Cafe")).toBe("Parodi Starbucks Cafe");
  });

  it("does not double the prefix", () => {
    expect(suggestParodyCafeName("Parodi Starbucks")).toBe("Parodi Starbucks");
  });

  it("respects the 80 character cafe name limit", () => {
    expect(suggestParodyCafeName("x".repeat(90)).length).toBeLessThanOrEqual(80);
  });
});

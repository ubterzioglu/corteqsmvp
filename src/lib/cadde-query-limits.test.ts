// PostgREST satır tavanı sözleşmesi — CLAUDE.md "Değişmez sözleşmeler" md.5.
//
// PostgREST sınırsız bir sorguyu 1000 satırda SESSİZCE keser: hata dönmez, eksik veri
// döner. Bu yüzden toplu veri çeken her sorgu ya `Range` sayfalaması ya da AÇIK bir
// `.limit()` taşımalıdır. 04.08.2026 denetiminde `listCaddeCafes` sınırsızdı; cafe
// sayısı 1000'i geçtiğinde liste sessizce eksilecekti (şu an cafe sayısı düşük olduğu
// için görünmüyordu — tam da bu sınıf hataların tehlikeli yanı).
//
// Test kaynak METNİNİ tarar: sınır kaldırılırsa düşer.

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { CADDE_CAFE_LIST_LIMIT } from "@/lib/cadde-internal";

const source = readFileSync("src/lib/cadde-api.ts", "utf8");

/** Adı verilen export'un gövdesini (bir sonraki üst düzey export'a kadar) döndürür. */
const functionBody = (name: string): string => {
  const start = source.indexOf(`export async function ${name}`);
  expect(start, `${name} bulunamadı`).toBeGreaterThan(-1);
  const rest = source.slice(start + 1);
  const end = rest.indexOf("\nexport ");
  return end === -1 ? rest : rest.slice(0, end);
};

describe("cadde liste sorgularında açık satır tavanı", () => {
  it("listCaddeCafes açık bir limit taşır (sınırsız sorgu 1000'de sessizce kesilir)", () => {
    const body = functionBody("listCaddeCafes");

    expect(body).toContain(".limit(CADDE_CAFE_LIST_LIMIT)");
  });

  it("cafe tavanı makul bir aralıkta ve PostgREST örtük sınırının altında", () => {
    expect(CADDE_CAFE_LIST_LIMIT).toBeGreaterThan(0);
    // 1000'e eşit/üstü olursa açık tavan anlamını yitirir — örtük kesme geri gelir.
    expect(CADDE_CAFE_LIST_LIMIT).toBeLessThan(1000);
  });

  it("cafe içi akış sabit tavanını korur", () => {
    const body = functionBody("listCaddeCafeFeed");

    expect(body).toContain(".limit(");
  });
});

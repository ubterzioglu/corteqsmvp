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

const cafeSource = readFileSync("src/lib/cadde-cafe-api.ts", "utf8");
const legacySource = readFileSync("src/lib/cadde-api.ts", "utf8");

/** Adı verilen export'un gövdesini (bir sonraki üst düzey export'a kadar) döndürür. */
const functionBody = (name: string): string => {
  const source = name === "listCaddeCafes" || name === "listCaddeCafeFeed" ? cafeSource : legacySource;
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

// S07a — kimlik listesiyle çekilen toplu profil sorguları PARÇALI olmalı.
//
// ⚠️ `.in("user_id", ids)` TEK BAŞINA GÜVENLİ DEĞİLDİR: dönen satır sayısı
// `ids.length × kullanıcı başına satır` kadardır. `user_profile_attributes`'tan iki
// nitelik çeken bir sorgu 500 kullanıcıda 1000 satıra ulaşır ve PostgREST **sessizce**
// keser — adı çözülemeyen üye arayüzde "Bir üye" olur, hata hiçbir yerde görünmez.
//
// Bu testin kilitlediği şey: bu sorgular ya `fetchInChunks` ile parçalı olacak, ya da
// AÇIK bir `.limit()` taşıyacak. Çıplak `.in(...)` bırakmak yasak.
describe("toplu profil sorgularında satır tavanı", () => {
  const SITES = [
    { file: "src/lib/profile-helpers.ts", fn: "getProfilesBasicBatch" },
    { file: "src/lib/cadde-api-support.ts", fn: "fetchCaddeUserNameMap" },
    { file: "src/lib/cadde-feed-location-api.ts", fn: "fetchUserNameMap" },
  ];

  it.each(SITES)("$fn parçalı sorgu kullanır", ({ file, fn }) => {
    const source = readFileSync(file, "utf8");
    const start = source.indexOf(`function ${fn}`);
    expect(start, `${fn} bulunamadı`).toBeGreaterThan(-1);
    const body = source.slice(start, start + 1400);

    expect(body).toContain("fetchInChunks");
  });

  it("messages-api açık bir tavan taşır (yukarıdaki .limit(200) sınırına yaslanmaz)", () => {
    const source = readFileSync("src/lib/messages-api.ts", "utf8");
    const start = source.indexOf("export async function fetchCounterpartNames");
    expect(start, "fetchCounterpartNames bulunamadı").toBeGreaterThan(-1);

    expect(source.slice(start, start + 600)).toContain(".limit(COUNTERPART_NAME_CAP)");
  });

  it("parça boyu PostgREST tavanının ALTINDA kalır", () => {
    // Parça tam tavana dayanırsa "kesildi mi, gerçekten o kadar mı var" ayırt edilemez.
    const source = readFileSync("src/lib/supabase-chunked.ts", "utf8");

    expect(source).toContain("POSTGREST_ROW_CAP / 2");
  });
});

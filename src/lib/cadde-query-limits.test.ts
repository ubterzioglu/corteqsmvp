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

// S07b — TAM olması gereken listeler sayfalanarak okunur.
//
// ⚠️ Buradaki listelerde açık bir `.limit(500)` de YANLIŞ olurdu: kesmeyi bilinçli
// yapar ama yine eksik veri üretir. Mali toplam, başvuru sayısı, anket yüzdesi ya da
// işlenmemiş talep sayısı eksik çıkarsa kimse fark etmez — kesme sessizdir.
describe("tam olması gereken listeler sayfalanır", () => {
  const SITES = [
    { file: "src/lib/whatsapp-landings.ts", fn: "listLandings", why: "onaylı gruplar" },
    { file: "src/lib/whatsapp-landings.ts", fn: "listAllSubmissions", why: "moderasyon kuyruğu" },
    { file: "src/lib/feedback.ts", fn: "fetchFeedbackList", why: "okunmamış geri bildirim" },
    { file: "src/lib/may19-campaign.ts", fn: "listMay19CampaignEntries", why: "katılım sayısı" },
    { file: "src/lib/muhasebe-api.ts", fn: "fetchExpenses", why: "gider toplamı" },
    { file: "src/lib/muhasebe-api.ts", fn: "fetchIncomes", why: "gelir toplamı" },
    { file: "src/lib/lansman.ts", fn: "getAllRegistrations", why: "başvuru sayısı" },
    { file: "src/lib/survey-responses.ts", fn: "getSurveyResponses", why: "anket yüzdeleri" },
    {
      file: "src/lib/admin-shell/revision-requests.ts",
      fn: "fetchRevisionRequests",
      why: "işlenmemiş talepler",
    },
  ];

  it.each(SITES)("$fn sayfalanır ($why eksik çıkamaz)", ({ file, fn }) => {
    const source = readFileSync(file, "utf8");
    const start = source.indexOf(`function ${fn}`);
    expect(start, `${fn} bulunamadı`).toBeGreaterThan(-1);
    const body = source.slice(start, start + 1200);

    expect(body).toContain("fetchAllRows");
    expect(body).toContain(".range(");
  });

  // S07c — `.in(...)` fan-out'u: kimlik başına ÇOK satır dönen sorgular.
  it.each([
    { file: "src/lib/cadde-cafe-api.ts", fn: "fetchPostReactions", why: "tepki sayısı" },
    { file: "src/lib/cadde-cafe-api.ts", fn: "fetchPostComments", why: "yorum sayısı" },
    { file: "src/lib/cadde-feed-location-api.ts", fn: "fetchPostReactions", why: "tepki sayısı" },
    {
      file: "src/lib/admin/admin-referral-api.ts",
      fn: "listReferralCodeUsages",
      why: "referans kullanım sayısı",
    },
  ])("$fn parçalı okur ($why eksik çıkamaz)", ({ file, fn }) => {
    const source = readFileSync(file, "utf8");
    const start = source.indexOf(`function ${fn}`);
    expect(start, `${fn} bulunamadı`).toBeGreaterThan(-1);

    expect(source.slice(start, start + 1200)).toContain("fetchInChunks");
  });

  it("gönderi başına satır tahmini tek kaynaktan gelir", () => {
    // İki dosya da aynı sabiti kullanmalı; ayrışırlarsa biri sessizce kesilmeye döner.
    const support = readFileSync("src/lib/cadde-api-support.ts", "utf8");
    expect(support).toContain("export const CADDE_ROWS_PER_POST");

    for (const file of ["src/lib/cadde-cafe-api.ts", "src/lib/cadde-feed-location-api.ts"]) {
      expect(readFileSync(file, "utf8")).toContain("CADDE_ROWS_PER_POST");
    }
  });

  // C01 — eşleme fonksiyonları BAĞLAM NESNESİ alır, konumsal parametre yığını değil.
  //
  // ⚠️ Gerekçe biçimsel değil, SESSİZ VERİ HATASI: eski imzalarda aynı tipte iki
  // parametre yan yanaydı (`countries`/`cities` ikisi de `Map<string, string>`,
  // `commentCounts`/`shareCounts` ikisi de `Map<string, number>`). Yerlerini
  // değiştirmek tsc'den GEÇERDİ ve kafeler yanlış şehirle, gönderiler yorum yerine
  // paylaşım sayısıyla çizilirdi — görünürde makul, tamamen yanlış.
  it.each([
    { file: "src/lib/cadde-cafe-api.ts", fn: "mapCafe", ctx: "CafeMapContext" },
    { file: "src/lib/cadde-cafe-api.ts", fn: "mapCafeFeedPost", ctx: "CafeFeedPostContext" },
    { file: "src/lib/cadde-feed-location-api.ts", fn: "mapRpcPost", ctx: "RpcPostContext" },
  ])("$fn bağlam nesnesi alır", ({ file, fn, ctx }) => {
    const source = readFileSync(file, "utf8");
    const start = source.indexOf(`function ${fn}(`);
    expect(start, `${fn} bulunamadı`).toBeGreaterThan(-1);

    const signature = source.slice(start, start + 200);
    expect(signature).toContain(`ctx: ${ctx}`);
    // İmza tek satıra sığmalı: aynı tipte iki parametreyi yan yana koyma kalıbı geri
    // gelirse bu iddia düşer.
    expect(signature.split("\n")[0]).toContain("): CaddePost {".slice(0, 3));
  });

  it("fetchAllRows sessizce eksik dönmez — tavana dayanırsa FIRLATIR", () => {
    // Sonsuz döngü freni gerekli, ama frene takılınca boş/eksik dizi dönmek tam da
    // kapatmaya çalıştığımız kusur olurdu.
    const source = readFileSync("src/lib/supabase-chunked.ts", "utf8");
    const start = source.indexOf("export async function fetchAllRows");
    expect(start).toBeGreaterThan(-1);

    expect(source.slice(start)).toContain("throw new Error(");
  });
});

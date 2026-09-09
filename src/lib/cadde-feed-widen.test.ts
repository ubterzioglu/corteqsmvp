// cadde-feed-widen birim testleri (B1/B2, m157-m158).
//
// Bu modülün kilitlediği sözleşmeler:
//   1. Filtresiz akış GENİŞLETİLMEZ (null döner) — orada B1'in öncülü bayat, global
//      kapı canlıda 0/0/0 + enabled olduğu için akış zaten daraltılmıyor. Buradan bir
//      hedef dönerse çağıran taraf gereksiz bir RPC açar.
//   2. Ülke adı YALNIZ katalogdan gelir; çözülemezse UYDURULMAZ, global'e düşülür.
//   3. Tek seferde YALNIZ BİR adım gevşetilir (maliyet tavanı 1 ek RPC).
//   4. Konum dışı filtreler (bridge, hashtag) ASLA düşürülmez — onlar içerik filtresi.

import { describe, expect, it } from "vitest";

import { describeCaddeWidenCount, widenCaddeFilters } from "./cadde-feed-widen";
import type { CaddeCity, CaddeCountry, CaddeFilterState } from "./cadde-types";

const COUNTRIES: CaddeCountry[] = [
  { id: "c-de", code: "DE", name: "Almanya" },
  { id: "c-tr", code: "TR", name: "Turkiye" },
];

const CITIES: CaddeCity[] = [
  { id: "ci-berlin", countryId: "c-de", name: "Berlin", timezone: "Europe/Berlin" },
  { id: "ci-izmir", countryId: "c-tr", name: "İzmir", timezone: "Europe/Istanbul" },
  // Kataloğu olan ama ülkesi listede OLMAYAN şehir — ad uydurulmadığını kanıtlar.
  { id: "ci-orphan", countryId: "c-yok", name: "Sahipsiz", timezone: "UTC" },
];

const base = (patch: Partial<CaddeFilterState> = {}): CaddeFilterState => ({
  mode: "real",
  countries: [],
  cities: [],
  bridge: false,
  hashtag: "",
  scope: "all",
  ...patch,
});

describe("widenCaddeFilters", () => {
  it("daraltan hiçbir şey yokken null döner (filtresiz akışta ek sorgu açılmaz)", () => {
    expect(widenCaddeFilters(base(), CITIES, COUNTRIES)).toBeNull();
  });

  it("demo modda null döner", () => {
    expect(widenCaddeFilters(base({ mode: "demo", cities: ["Berlin"] }), CITIES, COUNTRIES)).toBeNull();
  });

  it("şehir seçiminde ülkeye çıkar ve ülke adını KATALOGDAN çözer", () => {
    const target = widenCaddeFilters(base({ cities: ["Berlin"] }), CITIES, COUNTRIES);

    expect(target).not.toBeNull();
    expect(target?.kind).toBe("city");
    expect(target?.label).toBe("Almanya");
    expect(target?.next.cities).toEqual([]);
    expect(target?.next.countries).toEqual(["Almanya"]);
  });

  it("şehrin ülkesi katalogda çözülemezse ad UYDURMAZ, global'e düşer", () => {
    const target = widenCaddeFilters(base({ cities: ["Sahipsiz"] }), CITIES, COUNTRIES);

    // Uydurulmuş bir ad SQL'de birebir eşitlikle aranır, eşleşmez ve filtre sessizce
    // hiç uygulanmaz — kullanıcı "X akışı" yazısına tıklayıp global akış görürdü.
    expect(target?.label).toBe("tüm akış");
    expect(target?.next.countries).toEqual([]);
  });

  it("katalogda hiç olmayan şehir adında da global'e düşer", () => {
    const target = widenCaddeFilters(base({ cities: ["Böblingen"] }), CITIES, COUNTRIES);

    expect(target?.label).toBe("tüm akış");
    expect(target?.next.countries).toEqual([]);
  });

  it("ülke zaten seçiliyken şehir düşer, ülke KORUNUR", () => {
    const target = widenCaddeFilters(base({ countries: ["Almanya"], cities: ["Berlin"] }), CITIES, COUNTRIES);

    expect(target?.next.countries).toEqual(["Almanya"]);
    expect(target?.next.cities).toEqual([]);
    expect(target?.label).toBe("Almanya");
  });

  it("yalnız ülke seçiliyken global'e çıkar", () => {
    const target = widenCaddeFilters(base({ countries: ["Almanya"] }), CITIES, COUNTRIES);

    expect(target?.kind).toBe("country");
    expect(target?.label).toBe("tüm akış");
    expect(target?.next.countries).toEqual([]);
  });

  it("kapsam çipi tek hopta all'a düşer ve geo seçimini KORUR", () => {
    const target = widenCaddeFilters(base({ scope: "city", cities: ["Berlin"] }), CITIES, COUNTRIES);

    expect(target?.kind).toBe("scope");
    expect(target?.next.scope).toBe("all");
    // Ara "country" adımı yok; ayrıca geo seçimi bu adımda düşürülmez.
    expect(target?.next.cities).toEqual(["Berlin"]);
  });

  it("country kapsamı da tek hopta all'a düşer", () => {
    const target = widenCaddeFilters(base({ scope: "country" }), CITIES, COUNTRIES);

    expect(target?.next.scope).toBe("all");
  });

  it("konum dışı filtreleri (bridge, hashtag) ASLA düşürmez", () => {
    const target = widenCaddeFilters(
      base({ cities: ["Berlin"], bridge: true, hashtag: "vize" }),
      CITIES,
      COUNTRIES,
    );

    // Bunlar konum değil İÇERİK filtresidir; düşürmek kullanıcının sorduğu soruyu değiştirir.
    expect(target?.next.bridge).toBe(true);
    expect(target?.next.hashtag).toBe("vize");
  });

  it("tek seferde YALNIZ BİR adım gevşetir", () => {
    // scope + şehir birlikteyken önce scope gevşer, şehir DURUR.
    const first = widenCaddeFilters(base({ scope: "city", cities: ["Berlin"] }), CITIES, COUNTRIES);
    expect(first?.next.scope).toBe("all");
    expect(first?.next.cities).toEqual(["Berlin"]);

    // Bir sonraki adım ancak yeni durumdan hesaplanır.
    const second = widenCaddeFilters(first!.next, CITIES, COUNTRIES);
    expect(second?.next.cities).toEqual([]);
  });

  it("bridge/hashtag tek başınayken genişletilecek bir şey yoktur", () => {
    // Bunlar konum daraltması değil; global kapı zaten açık olduğu için akış boşsa
    // sebebi kapsam değil içeriktir.
    expect(widenCaddeFilters(base({ bridge: true }), CITIES, COUNTRIES)).toBeNull();
    expect(widenCaddeFilters(base({ hashtag: "vize" }), CITIES, COUNTRIES)).toBeNull();
  });

  it("girdi filtresini MUTASYONA UĞRATMAZ", () => {
    const filters = base({ cities: ["Berlin"] });
    const snapshot = JSON.parse(JSON.stringify(filters));

    widenCaddeFilters(filters, CITIES, COUNTRIES);

    expect(filters).toEqual(snapshot);
  });
});

describe("describeCaddeWidenCount", () => {
  it("sayfa dolmadıysa kesin sayıyı yazar", () => {
    expect(describeCaddeWidenCount(3, false)).toBe("3 paylaşım");
  });

  it("sayfa doluysa ASLA tavanı kesin sayı gibi yazmaz", () => {
    // CADDE_PAGE_SIZE = 20; sayfa dolduğunda toplam bilinmez.
    expect(describeCaddeWidenCount(20, true)).toBe("20+ paylaşım");
    expect(describeCaddeWidenCount(20, true)).not.toBe("20 paylaşım");
  });

  it("tek paylaşımı da dürüstçe yazar", () => {
    // Canlıda sayılar küçük (ölçüm: en dolu şehir 4, Berlin 1). Buton yalnız sayı
    // 0'dan büyükken çizilir; 1 de geçerli bir alternatiftir, 0 değildir.
    expect(describeCaddeWidenCount(1, false)).toBe("1 paylaşım");
  });
});

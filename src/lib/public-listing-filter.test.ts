import { describe, expect, it } from "vitest";

import type { PublicCatalogRow } from "@/lib/public-catalog-api";
import type { RoleGroup } from "@/lib/directory-role-groups";
import {
  deriveCityOptions,
  deriveCountryOptions,
  deriveGroupCounts,
  filterListingRows,
  trTitleCasePlace,
  EMPTY_LISTING_FILTER,
} from "@/lib/public-listing-filter";

const row = (overrides: Partial<PublicCatalogRow> & { id: string }): PublicCatalogRow => ({
  slug: `slug-${overrides.id}`,
  title: "Kayıt",
  headline: null,
  description: null,
  roleKey: "Consultant_LawTax",
  countryCode: "DE",
  countryName: "Almanya",
  city: "Berlin",
  isVerified: false,
  href: "/directory/catalog/x",
  ...overrides,
});

const GROUPS: readonly RoleGroup[] = [
  {
    key: "hukuk",
    label: "Hukuk",
    roles: [{ key: "Consultant_LawTax", label: "Hukuk & Vergi Danışmanı" }],
  },
  {
    key: "saglik",
    label: "Sağlık",
    roles: [{ key: "Healthcare_Doctor", label: "Doktor" }],
  },
];

describe("trTitleCasePlace", () => {
  it("küçük yazılmış şehri düzeltir", () => {
    expect(trTitleCasePlace("vancouver")).toBe("Vancouver");
    expect(trTitleCasePlace("kingston")).toBe("Kingston");
  });

  it("Türkçe i/İ kuralını uygular — bare toUpperCase() burada yanlış olurdu", () => {
    // "istanbul".toUpperCase()[0] === "I" (yanlış); tr-TR'de "İ" olmalı.
    expect(trTitleCasePlace("istanbul")).toBe("İstanbul");
    expect(trTitleCasePlace("ızmir")).toBe("Izmir");
  });

  it("eğik çizgi ve tireyle ayrılmış çok parçalı adları korur", () => {
    // Canlı veride gerçekten var: tek alanda iki şehir.
    expect(trTitleCasePlace("Düsseldorf/Grevenbroich")).toBe("Düsseldorf/Grevenbroich");
    expect(trTitleCasePlace("stoke-on-trent")).toBe("Stoke-On-Trent");
  });

  it("boş değerlerde boş string döner", () => {
    expect(trTitleCasePlace(null)).toBe("");
    expect(trTitleCasePlace(undefined)).toBe("");
  });
});

describe("filterListingRows", () => {
  const rows = [
    row({ id: "1", title: "Ali Palta", city: "Leipzig", countryName: "Almanya" }),
    row({ id: "2", title: "Erdem Ünal", city: "Doha", countryName: "Katar" }),
    row({
      id: "3",
      title: "Üsküdar Hukuk",
      city: "Berlin",
      countryName: "Almanya",
      roleKey: "Healthcare_Doctor",
    }),
  ];

  it("filtre boşken hepsini döner", () => {
    expect(filterListingRows(rows, EMPTY_LISTING_FILTER, GROUPS)).toHaveLength(3);
  });

  it("ülkeye göre süzer", () => {
    const result = filterListingRows(rows, { ...EMPTY_LISTING_FILTER, country: "Katar" }, GROUPS);
    expect(result.map((item) => item.id)).toEqual(["2"]);
  });

  it("şehre göre süzer", () => {
    const result = filterListingRows(rows, { ...EMPTY_LISTING_FILTER, city: "Berlin" }, GROUPS);
    expect(result.map((item) => item.id)).toEqual(["3"]);
  });

  it("gruba göre süzer ve grup dışındaki rolü dışlar", () => {
    const result = filterListingRows(rows, { ...EMPTY_LISTING_FILTER, groupKey: "saglik" }, GROUPS);
    expect(result.map((item) => item.id)).toEqual(["3"]);
  });

  it("bilinmeyen grup anahtarında boş döner (sessizce hepsini göstermez)", () => {
    const result = filterListingRows(rows, { ...EMPTY_LISTING_FILTER, groupKey: "yok" }, GROUPS);
    expect(result).toEqual([]);
  });

  it("aksan-toleranslı Türkçe arama yapar", () => {
    // trIncludes: "uskudar" yazan "Üsküdar"ı bulmalı.
    const result = filterListingRows(
      rows,
      { ...EMPTY_LISTING_FILTER, searchText: "uskudar" },
      GROUPS,
    );
    expect(result.map((item) => item.id)).toEqual(["3"]);
  });

  it("çok kelimeli aramada VE anlamı uygular", () => {
    const both = filterListingRows(
      rows,
      { ...EMPTY_LISTING_FILTER, searchText: "hukuk berlin" },
      GROUPS,
    );
    expect(both.map((item) => item.id)).toEqual(["3"]);

    const impossible = filterListingRows(
      rows,
      { ...EMPTY_LISTING_FILTER, searchText: "hukuk doha" },
      GROUPS,
    );
    expect(impossible).toEqual([]);
  });

  it("headline ve açıklamada da arar", () => {
    const withHeadline = [row({ id: "9", title: "Kayıt", headline: "Vize danışmanı" })];
    const result = filterListingRows(
      withHeadline,
      { ...EMPTY_LISTING_FILTER, searchText: "vize" },
      GROUPS,
    );
    expect(result).toHaveLength(1);
  });
});

describe("filtre seçenekleri veriden türetilir", () => {
  const rows = [
    row({ id: "1", countryName: "Almanya", city: "Berlin" }),
    row({ id: "2", countryName: "Almanya", city: "Leipzig" }),
    row({ id: "3", countryName: "Katar", city: "Doha" }),
    row({ id: "4", countryName: null, city: null }),
  ];

  it("ülkeleri sayarak ve Türkçe sıralayarak döner", () => {
    const options = deriveCountryOptions(rows);
    expect(options).toEqual([
      { value: "Almanya", label: "Almanya", count: 2 },
      { value: "Katar", label: "Katar", count: 1 },
    ]);
  });

  it("null ülke/şehir seçenek üretmez", () => {
    expect(deriveCountryOptions(rows).some((option) => option.value === "")).toBe(false);
    expect(deriveCityOptions(rows, "all")).toHaveLength(3);
  });

  it("şehir seçenekleri seçili ülkeye daralır", () => {
    const options = deriveCityOptions(rows, "Almanya");
    expect(options.map((option) => option.value)).toEqual(["Berlin", "Leipzig"]);
  });

  it("şehir etiketleri görüntüleme için düzeltilir, değer ham kalır", () => {
    const options = deriveCityOptions([row({ id: "1", city: "vancouver" })], "all");
    // Değer DB'deki hali olmalı, yoksa süzme eşleşmez; etiket okunabilir olmalı.
    expect(options[0]).toEqual({ value: "vancouver", label: "Vancouver", count: 1 });
  });
});

describe("deriveGroupCounts", () => {
  const rows = [
    row({ id: "1", roleKey: "Consultant_LawTax", countryName: "Almanya" }),
    row({ id: "2", roleKey: "Healthcare_Doctor", countryName: "Almanya" }),
    row({ id: "3", roleKey: "Healthcare_Doctor", countryName: "Katar" }),
  ];

  it("her grup için sayı ve toplam döner", () => {
    const counts = deriveGroupCounts(rows, EMPTY_LISTING_FILTER, GROUPS);
    expect(counts.get("all")).toBe(3);
    expect(counts.get("hukuk")).toBe(1);
    expect(counts.get("saglik")).toBe(2);
  });

  it("sayılar diğer süzgeçleri hesaba katar ama kendi grup seçimini yok sayar", () => {
    // Ülke Katar seçili + grup "hukuk" seçili olsa bile, sekme sayıları
    // ülkeye göre süzülmüş TÜM grupları göstermeli.
    const counts = deriveGroupCounts(
      rows,
      { ...EMPTY_LISTING_FILTER, country: "Katar", groupKey: "hukuk" },
      GROUPS,
    );
    expect(counts.get("all")).toBe(1);
    expect(counts.get("hukuk")).toBe(0);
    expect(counts.get("saglik")).toBe(1);
  });
});

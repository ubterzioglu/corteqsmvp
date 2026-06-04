import { describe, expect, it } from "vitest";
import { filterCatalogRows, type CatalogRow } from "@/lib/role-catalog";

const rows: CatalogRow[] = [
  {
    kind: "attribute",
    key: "bio",
    label: "Biyografi",
    description: "Kısa tanıtım metni",
    adminNote: null,
    dataType: "textarea",
    sortOrder: 10,
  },
  {
    kind: "feature",
    key: "profile.edit_own",
    label: "Profil Düzenle",
    description: null,
    adminNote: "Temel yetki",
    isActiveGlobally: true,
    sortOrder: 0,
  },
  {
    kind: "profile_section",
    key: "about_section",
    label: "Hakkında Bölümü",
    description: "Kullanıcı hakkında bölümü",
    adminNote: null,
    sectionArea: "detail_card",
    sortOrder: 5,
  },
  {
    kind: "attribute",
    key: "education",
    label: "Eğitim Durumu",
    description: null,
    adminNote: null,
    dataType: "text",
    sortOrder: 20,
  },
];

describe("filterCatalogRows", () => {
  it("returns all rows when search is empty and kind is all", () => {
    const result = filterCatalogRows(rows, { search: "", kind: "all" });
    expect(result).toHaveLength(4);
  });

  it("filters by kind=attribute", () => {
    const result = filterCatalogRows(rows, { search: "", kind: "attribute" });
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.kind === "attribute")).toBe(true);
  });

  it("filters by kind=feature", () => {
    const result = filterCatalogRows(rows, { search: "", kind: "feature" });
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("profile.edit_own");
  });

  it("filters by kind=profile_section", () => {
    const result = filterCatalogRows(rows, { search: "", kind: "profile_section" });
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("about_section");
  });

  it("filters by label text search", () => {
    const result = filterCatalogRows(rows, { search: "profil", kind: "all" });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((r) => r.key === "profile.edit_own")).toBe(true);
  });

  it("filters by key text search", () => {
    const result = filterCatalogRows(rows, { search: "bio", kind: "all" });
    expect(result.some((r) => r.key === "bio")).toBe(true);
  });

  it("filters by description text search", () => {
    const result = filterCatalogRows(rows, { search: "tanıtım", kind: "all" });
    expect(result.some((r) => r.key === "bio")).toBe(true);
  });

  it("filters by adminNote text search", () => {
    const result = filterCatalogRows(rows, { search: "temel yetki", kind: "all" });
    expect(result.some((r) => r.key === "profile.edit_own")).toBe(true);
  });

  it("handles Turkish character normalization (ı vs i)", () => {
    const result = filterCatalogRows(rows, { search: "biyografi", kind: "all" });
    expect(result.some((r) => r.key === "bio")).toBe(true);
  });

  it("is case-insensitive", () => {
    const result = filterCatalogRows(rows, { search: "BİYOGRAFİ", kind: "all" });
    expect(result.some((r) => r.key === "bio")).toBe(true);
  });

  it("returns empty array when no match", () => {
    const result = filterCatalogRows(rows, { search: "xyznotfound123", kind: "all" });
    expect(result).toHaveLength(0);
  });

  it("combines kind and search filters", () => {
    const result = filterCatalogRows(rows, { search: "eğitim", kind: "attribute" });
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("education");
  });

  it("does not match attribute when kind=feature", () => {
    const result = filterCatalogRows(rows, { search: "bio", kind: "feature" });
    expect(result).toHaveLength(0);
  });
});

import { describe, expect, it } from "vitest";

import type { UnifiedDirectoryRow } from "@/lib/catalog-directory";
import { groupDirectoryResults } from "@/lib/directory-grouping";

function row(overrides: Partial<UnifiedDirectoryRow> = {}): UnifiedDirectoryRow {
  return {
    recordType: "member",
    id: "1",
    href: "/directory/x",
    title: "Kayıt",
    roleKey: "User_DiasporaMember",
    roleLabel: "Bireysel",
    description: null,
    country: null,
    city: null,
    imageUrl: null,
    specialLabel: null,
    specialValue: null,
    isFeatured: false,
    isVerified: false,
    isClaimable: false,
    itemType: "member",
    ...overrides,
  };
}

describe("groupDirectoryResults", () => {
  it("kurum ve kişi kayıtlarını ayırır", () => {
    const rows = [
      row({ id: "1", recordType: "catalog_item", title: "Dernek" }),
      row({ id: "2", recordType: "member", title: "Ayşe" }),
      row({ id: "3", recordType: "catalog_item", title: "Klinik" }),
    ];

    const result = groupDirectoryResults(rows);
    expect(result.catalogItems.map((entry) => entry.title)).toEqual(["Dernek", "Klinik"]);
    expect(result.members.map((entry) => entry.title)).toEqual(["Ayşe"]);
  });

  it("her grup GELİŞ SIRASINI korur — sunucudaki alaka sıralaması bozulmamalı", () => {
    const rows = [
      row({ id: "9", recordType: "catalog_item", title: "Önce" }),
      row({ id: "1", recordType: "catalog_item", title: "Sonra" }),
    ];

    expect(groupDirectoryResults(rows).catalogItems.map((entry) => entry.title)).toEqual([
      "Önce",
      "Sonra",
    ]);
  });

  it("tek tip sonuçta diğer grup boş kalır", () => {
    const onlyMembers = groupDirectoryResults([row({ id: "1" }), row({ id: "2" })]);
    expect(onlyMembers.catalogItems).toEqual([]);
    expect(onlyMembers.members).toHaveLength(2);
  });

  it("boş listede iki boş grup döner", () => {
    expect(groupDirectoryResults([])).toEqual({ catalogItems: [], members: [] });
  });
});

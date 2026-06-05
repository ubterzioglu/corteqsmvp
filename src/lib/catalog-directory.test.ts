import { describe, expect, it } from "vitest";

import {
  mapCatalogSearchToDirectoryRow,
  mapUserProfileToDirectoryRow,
  toCountryCode,
  type CatalogSearchRow,
} from "@/lib/catalog-directory";

describe("catalog-directory", () => {
  it("normalizes user profile rows into directory cards", () => {
    expect(
      mapUserProfileToDirectoryRow({
        user_id: "user-1",
        role_key: "danisman",
        role_label: "Danışman",
        role_slug: "consultant",
        display_name: "Ayşe Kaya",
        short_bio: "Vergi danışmanı",
        country: "Almanya",
        city: "Berlin",
        profile_image_url: null,
        special_attribute_key: "expertise_area",
        special_attribute_label: "Uzmanlık",
        special_attribute_value: "Vergi",
        is_featured: true,
        is_verified: true,
      }),
    ).toMatchObject({
      recordType: "user_profile",
      href: "/directory/profile/user-1",
      title: "Ayşe Kaya",
      roleKey: "danisman",
      isClaimable: false,
    });
  });

  it("normalizes catalog search rows into claimable directory cards", () => {
    const row: CatalogSearchRow = {
      item_id: "item-1",
      item_type: "advisor",
      slug: "dortmund-turkce-doktor-arkin-kara",
      title: "Arkin Kara",
      headline: "Genel Tıp",
      short_description: "Dortmund'da Türkçe hizmet veren doktor.",
      city: "Dortmund",
      country_code: "DE",
      verification_status: "unverified",
      category_slugs: ["advisor-healthcare-doctor"],
      language_codes: ["tr", "de"],
      thumbnail_url: null,
      score: 1,
      filter_data: {
        platform_role_key: "Healthcare_Doctor",
        platform_role_label: "Doktor",
        specialty_summary: "Genel Tıp",
      },
    };

    expect(mapCatalogSearchToDirectoryRow(row, new Map())).toMatchObject({
      recordType: "catalog_item",
      href: "/directory/catalog/dortmund-turkce-doktor-arkin-kara",
      roleKey: "Healthcare_Doctor",
      roleLabel: "Doktor",
      country: "Almanya",
      isClaimable: true,
    });
  });

  it("maps known country labels and codes to catalog country filters", () => {
    expect(toCountryCode("Almanya")).toBe("DE");
    expect(toCountryCode("de")).toBe("DE");
    expect(toCountryCode("Fransa")).toBe("FR");
  });
});

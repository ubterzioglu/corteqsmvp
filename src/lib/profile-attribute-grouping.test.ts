import { describe, expect, it } from "vitest";

import { groupProfileAttributes } from "@/lib/profile-attribute-grouping";
import type { ProfileAttributeState } from "@/lib/member-profile";

/** Testin ilgilendiği tek alan `attributeKey`; gerisi sözleşmeyi doldurur. */
const attr = (attributeKey: string): ProfileAttributeState =>
  ({ attributeKey, valueText: null, valueJson: null }) as unknown as ProfileAttributeState;

const keysOf = (items: ProfileAttributeState[]): string[] =>
  items.map((item) => item.attributeKey);

describe("groupProfileAttributes", () => {
  it("boş/tanımsız girdide dört boş bölüm döndürür", () => {
    expect(groupProfileAttributes(undefined)).toEqual({
      common: [],
      education: [],
      socialMedia: [],
      roleSpecific: [],
    });
    expect(groupProfileAttributes([])).toEqual({
      common: [],
      education: [],
      socialMedia: [],
      roleSpecific: [],
    });
  });

  it("ortak alanları 'common' bölümüne koyar", () => {
    const grouped = groupProfileAttributes([attr("country"), attr("city"), attr("bio_short")]);

    expect(keysOf(grouped.common)).toEqual(["country", "city", "bio_short"]);
    expect(grouped.roleSpecific).toEqual([]);
  });

  it("tanınmayan anahtarı role özel sayar (varsayılan dal)", () => {
    const grouped = groupProfileAttributes([attr("hicbir_kurala_uymayan_alan")]);

    expect(keysOf(grouped.roleSpecific)).toEqual(["hicbir_kurala_uymayan_alan"]);
  });

  it("sosyal medya alanlarını kanonik sıraya sokar, girdi sırasına DEĞİL", () => {
    // Kanonik sıra `SOCIAL_ATTRIBUTE_CONFIGS`ten gelir:
    // instagram → facebook → youtube → tiktok → x → reddit.
    // Bilerek ters sırada veriliyor.
    const grouped = groupProfileAttributes([
      attr("youtube_url"),
      attr("facebook_url"),
      attr("instagram_url"),
    ]);

    expect(keysOf(grouped.socialMedia)).toEqual([
      "instagram_url",
      "facebook_url",
      "youtube_url",
    ]);
  });

  it("bir nitelik yalnız TEK bölüme girer", () => {
    const grouped = groupProfileAttributes([
      attr("country"),
      attr("instagram_url"),
      attr("serbest_alan"),
    ]);

    const all = [
      ...keysOf(grouped.common),
      ...keysOf(grouped.education),
      ...keysOf(grouped.socialMedia),
      ...keysOf(grouped.roleSpecific),
    ];

    expect(all.length).toBe(new Set(all).size);
  });
});

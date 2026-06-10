import { describe, expect, it, vi } from "vitest";

import {
  parsePublicCatalogProfilePage,
  publicCatalogProfilePageSchema,
} from "@/lib/public-catalog-profile-schemas";

const makeRawPayload = (overrides: Record<string, unknown> = {}) => ({
  item: {
    id: "item-1",
    slug: "member-arkin-kara",
    title: "Arkin Kara",
    itemType: "member",
    roleKey: "Member",
    roleLabel: "Üye",
    headline: "Genel Tıp",
    shortDescription: "Dortmund'da Türkçe hizmet veren doktor.",
    longDescription: null,
    avatarUrl: null,
    coverImageUrl: null,
    verificationStatus: "unverified",
    isVerified: false,
    isClaimable: true,
    city: "Dortmund",
    countryCode: "DE",
    countryLabel: "Almanya",
    addressLine: null,
    categories: [{ slug: "doctor", name: "Doktor", isPrimary: true }],
  },
  sections: [
    {
      sectionKey: "detail.hakkinda_bio",
      label: "Hakkında",
      description: null,
      sectionArea: "detail_card",
      componentKey: "rich_text",
      sortOrder: 110,
      content: { text: "Merhaba" },
    },
  ],
  attributes: [],
  contacts: [],
  links: [],
  services: [],
  languages: [],
  media: [],
  claim: { canClaim: true, verificationStatus: "unverified" },
  ...overrides,
});

describe("parsePublicCatalogProfilePage", () => {
  it("returns null for a NULL rpc result", () => {
    expect(parsePublicCatalogProfilePage(null)).toBeNull();
    expect(parsePublicCatalogProfilePage(undefined)).toBeNull();
  });

  it("parses a complete payload", () => {
    const parsed = parsePublicCatalogProfilePage(makeRawPayload());
    expect(parsed).not.toBeNull();
    expect(parsed!.item.title).toBe("Arkin Kara");
    expect(parsed!.sections).toHaveLength(1);
    expect(parsed!.sections[0].componentKey).toBe("rich_text");
  });

  it("returns null (and logs) for a structurally broken payload instead of throwing", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(parsePublicCatalogProfilePage({ item: { id: "" } })).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("normalizes empty optional strings to null", () => {
    const parsed = parsePublicCatalogProfilePage(
      makeRawPayload({
        item: { ...makeRawPayload().item, headline: "  ", addressLine: undefined },
      }),
    );
    expect(parsed!.item.headline).toBeNull();
    expect(parsed!.item.addressLine).toBeNull();
  });

  it("defaults missing arrays to []", () => {
    const raw = makeRawPayload({ sections: undefined, contacts: undefined, media: "garbage" });
    const parsed = parsePublicCatalogProfilePage(raw);
    expect(parsed!.sections).toEqual([]);
    expect(parsed!.contacts).toEqual([]);
    expect(parsed!.media).toEqual([]);
  });

  it("keeps unknown component keys and falls back on bad section areas", () => {
    const raw = makeRawPayload({
      sections: [
        {
          sectionKey: "detail.yeni_bolum",
          label: "Yeni Bölüm",
          description: null,
          sectionArea: "weird_area",
          componentKey: "brand_new_widget",
          sortOrder: "not-a-number",
          content: { anything: ["a", "b"] },
        },
      ],
    });
    const parsed = parsePublicCatalogProfilePage(raw);
    expect(parsed!.sections[0].componentKey).toBe("brand_new_widget");
    expect(parsed!.sections[0].sectionArea).toBe("detail_card");
    expect(parsed!.sections[0].sortOrder).toBe(100);
  });

  it("defaults claim block when missing", () => {
    const parsed = parsePublicCatalogProfilePage(makeRawPayload({ claim: undefined }));
    expect(parsed!.claim).toEqual({ canClaim: false, verificationStatus: null });
  });

  it("exposes the schema for direct safeParse usage", () => {
    expect(publicCatalogProfilePageSchema.safeParse(makeRawPayload()).success).toBe(true);
  });
});

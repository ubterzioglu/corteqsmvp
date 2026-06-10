import { z } from "zod";

/**
 * Zod contract for the `get_catalog_item_public_page_v2` RPC payload.
 * The RPC already emits camelCase keys; this layer normalizes nulls,
 * defaults missing arrays to [] and refuses structurally broken payloads.
 */

const nullableText = z.string().nullish().transform((value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
});

export const publicProfileCategorySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  isPrimary: z.boolean().catch(false),
});

export const publicProfileSectionSchema = z.object({
  sectionKey: z.string().min(1),
  label: z.string().min(1),
  description: nullableText,
  sectionArea: z.enum(["preview_card", "detail_card"]).catch("detail_card"),
  componentKey: z.string().nullish().transform((value) => value ?? null),
  sortOrder: z.number().int().catch(100),
  content: z.record(z.unknown()).catch({}),
});

export const publicProfileAttributeSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  dataType: z.string().catch("text"),
  sortOrder: z.number().int().catch(100),
  valueText: nullableText,
  valueJson: z.unknown().nullish().transform((value) => value ?? null),
});

export const publicProfileContactSchema = z.object({
  type: z.string().min(1),
  value: z.string().min(1),
  label: nullableText,
  isPrimary: z.boolean().catch(false),
});

export const publicProfileLinkSchema = z.object({
  type: z.string().catch("link"),
  label: nullableText,
  url: z.string().min(1),
  isPrimary: z.boolean().catch(false),
});

export const publicProfileServiceSchema = z.object({
  name: z.string().min(1),
  description: nullableText,
});

export const publicProfileLanguageSchema = z.object({
  code: z.string().min(1),
  proficiency: nullableText,
});

export const publicProfileMediaSchema = z.object({
  type: z.string().min(1),
  url: z.string().min(1),
  altText: nullableText,
  isPrimary: z.boolean().catch(false),
});

export const publicCatalogProfilePageSchema = z.object({
  item: z.object({
    id: z.string().min(1),
    slug: z.string().min(1),
    title: z.string().min(1),
    itemType: z.string().catch(""),
    roleKey: nullableText,
    roleLabel: nullableText,
    headline: nullableText,
    shortDescription: nullableText,
    longDescription: nullableText,
    avatarUrl: nullableText,
    coverImageUrl: nullableText,
    verificationStatus: nullableText,
    isVerified: z.boolean().catch(false),
    isClaimable: z.boolean().catch(false),
    city: nullableText,
    countryCode: nullableText,
    countryLabel: nullableText,
    addressLine: nullableText,
    categories: z.array(publicProfileCategorySchema).catch([]),
  }),
  sections: z.array(publicProfileSectionSchema).catch([]),
  attributes: z.array(publicProfileAttributeSchema).catch([]),
  contacts: z.array(publicProfileContactSchema).catch([]),
  links: z.array(publicProfileLinkSchema).catch([]),
  services: z.array(publicProfileServiceSchema).catch([]),
  languages: z.array(publicProfileLanguageSchema).catch([]),
  media: z.array(publicProfileMediaSchema).catch([]),
  claim: z
    .object({
      canClaim: z.boolean().catch(false),
      verificationStatus: nullableText,
    })
    .catch({ canClaim: false, verificationStatus: null }),
});

export type PublicProfileCategory = z.infer<typeof publicProfileCategorySchema>;
export type PublicProfileSectionPayload = z.infer<typeof publicProfileSectionSchema>;
export type PublicProfileAttribute = z.infer<typeof publicProfileAttributeSchema>;
export type PublicProfileContact = z.infer<typeof publicProfileContactSchema>;
export type PublicProfileLink = z.infer<typeof publicProfileLinkSchema>;
export type PublicProfileService = z.infer<typeof publicProfileServiceSchema>;
export type PublicProfileLanguage = z.infer<typeof publicProfileLanguageSchema>;
export type PublicProfileMedia = z.infer<typeof publicProfileMediaSchema>;
export type PublicCatalogProfilePagePayload = z.infer<typeof publicCatalogProfilePageSchema>;

/**
 * Parses the raw RPC response. Returns `null` both for a NULL RPC result
 * (private/unpublished/missing item) and for a structurally invalid payload —
 * the page shows the same leak-free not-found state in both cases.
 */
export function parsePublicCatalogProfilePage(raw: unknown): PublicCatalogProfilePagePayload | null {
  if (raw === null || raw === undefined) return null;

  const result = publicCatalogProfilePageSchema.safeParse(raw);
  if (!result.success) {
    console.error("public-catalog-profile payload parse error", result.error.flatten());
    return null;
  }
  return result.data;
}

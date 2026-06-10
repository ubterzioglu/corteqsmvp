import {
  formatLocationLabel,
  getInitials,
  resolveProfileAccent,
  toMapHref,
  toSafeExternalUrl,
  toSafeMailHref,
  toSafePhoneHref,
  type ProfileAccent,
} from "@/components/directory/public-profile/public-profile-utils";
import type {
  PublicCatalogProfilePagePayload,
  PublicProfileAttribute,
  PublicProfileContact,
  PublicProfileLink,
} from "@/lib/public-catalog-profile-schemas";

/**
 * Maps the validated RPC payload onto UI decisions: hero data, badge list,
 * quick actions, safe hrefs and the resolved section list (DB sections +
 * derived sections), split into main / sidebar placements.
 */

export type PublicProfileBadgeViewModel = {
  key: string;
  label: string;
  tone: "category" | "verified" | "managed" | "claimable";
};

export type PublicProfileQuickAction = {
  key: "website" | "email" | "phone" | "map";
  label: string;
  href: string;
  external: boolean;
};

export type PublicProfileSectionViewModel = {
  key: string;
  label: string;
  description: string | null;
  componentKey: string | null;
  placement: "main" | "sidebar";
  sortOrder: number;
  content: Record<string, unknown>;
};

export type PublicProfileHeroViewModel = {
  title: string;
  initials: string;
  avatarUrl: string | null;
  avatarAlt: string;
  coverImageUrl: string | null;
  roleLabel: string | null;
  headline: string | null;
  locationLabel: string | null;
  accent: ProfileAccent;
  badges: PublicProfileBadgeViewModel[];
};

export type PublicProfileClaimViewModel = {
  itemId: string;
  slug: string;
  canClaim: boolean;
  isManaged: boolean;
};

export type PublicCatalogProfileViewModel = {
  hero: PublicProfileHeroViewModel;
  quickActions: PublicProfileQuickAction[];
  mainSections: PublicProfileSectionViewModel[];
  sidebarSections: PublicProfileSectionViewModel[];
  claim: PublicProfileClaimViewModel;
};

/** Registry-level placement metadata; unknown component keys fall back to "main". */
const SECTION_PLACEMENTS: Record<string, "main" | "sidebar"> = {
  rich_text: "main",
  attributes: "main",
  services: "main",
  contact_list: "sidebar",
  languages: "sidebar",
  links: "sidebar",
  badges: "sidebar",
};

/**
 * preview_card sections duplicate hero content (title/location/image/badges);
 * the hero renders them, so they are excluded from the card list.
 */
const HERO_SECTION_AREAS = new Set(["preview_card"]);

/** Attribute keys already rendered by the hero — never repeated in the grid. */
const HERO_DUPLICATE_ATTRIBUTE_KEYS = new Set([
  "full_name",
  "profile_photo_url",
  "avatar_url",
  "city",
  "country",
  "bio_short",
]);

export type AttributeRowViewModel = {
  key: string;
  label: string;
  value: string;
  href: string | null;
};

function formatAttributeValue(attribute: PublicProfileAttribute): string | null {
  if (attribute.dataType === "boolean") {
    if (attribute.valueJson === true || attribute.valueText === "true") return "Evet";
    if (attribute.valueJson === false || attribute.valueText === "false") return "Hayır";
  }
  if (Array.isArray(attribute.valueJson)) {
    const joined = attribute.valueJson
      .filter((entry): entry is string => typeof entry === "string" && entry.trim() !== "")
      .join(", ");
    if (joined) return joined;
  }
  if (typeof attribute.valueJson === "string" && attribute.valueJson.trim()) {
    return attribute.valueJson.trim();
  }
  return attribute.valueText;
}

export function buildAttributeRows(attributes: PublicProfileAttribute[]): AttributeRowViewModel[] {
  return attributes
    .filter((attribute) => !HERO_DUPLICATE_ATTRIBUTE_KEYS.has(attribute.key))
    .map((attribute) => {
      const value = formatAttributeValue(attribute);
      if (!value) return null;
      const href = attribute.dataType === "url" ? toSafeExternalUrl(value) : null;
      return { key: attribute.key, label: attribute.label, value, href };
    })
    .filter((row): row is AttributeRowViewModel => row !== null);
}

export type ContactRowViewModel = {
  key: string;
  type: string;
  label: string;
  value: string;
  href: string | null;
  external: boolean;
};

const CONTACT_TYPE_LABELS: Record<string, string> = {
  phone: "Telefon",
  email: "E-posta",
  website: "Web Sitesi",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  youtube: "YouTube",
  appointment_url: "Randevu",
};

function resolveContactHref(contact: PublicProfileContact): { href: string | null; external: boolean } {
  if (contact.type === "phone") {
    return { href: toSafePhoneHref(contact.value), external: false };
  }
  if (contact.type === "whatsapp") {
    // Canlı veride whatsapp contact'ları hem telefon hem chat.whatsapp.com linki olabiliyor.
    const url = toSafeExternalUrl(contact.value);
    if (url) return { href: url, external: true };
    return { href: toSafePhoneHref(contact.value), external: false };
  }
  if (contact.type === "email") {
    return { href: toSafeMailHref(contact.value), external: false };
  }
  return { href: toSafeExternalUrl(contact.value), external: true };
}

export function buildContactRows(contacts: PublicProfileContact[]): ContactRowViewModel[] {
  const seen = new Set<string>();
  return contacts
    .map((contact) => {
      const dedupeKey = `${contact.type}|${contact.value}`;
      if (seen.has(dedupeKey)) return null;
      seen.add(dedupeKey);
      const { href, external } = resolveContactHref(contact);
      return {
        key: dedupeKey,
        type: contact.type,
        label: contact.label ?? CONTACT_TYPE_LABELS[contact.type] ?? contact.type,
        value: contact.value,
        href,
        external,
      };
    })
    .filter((row): row is ContactRowViewModel => row !== null);
}

export type LinkRowViewModel = {
  key: string;
  label: string;
  url: string;
};

export function buildLinkRows(links: PublicProfileLink[]): LinkRowViewModel[] {
  const seen = new Set<string>();
  return links
    .map((link) => {
      const url = toSafeExternalUrl(link.url);
      if (!url || seen.has(url)) return null;
      seen.add(url);
      return {
        key: url,
        label: link.label ?? CONTACT_TYPE_LABELS[link.type] ?? link.type,
        url,
      };
    })
    .filter((row): row is LinkRowViewModel => row !== null);
}

function buildBadges(payload: PublicCatalogProfilePagePayload): PublicProfileBadgeViewModel[] {
  const badges: PublicProfileBadgeViewModel[] = payload.item.categories.map((category) => ({
    key: `category-${category.slug}`,
    label: category.name,
    tone: "category" as const,
  }));

  if (payload.item.isVerified) {
    badges.push({ key: "verified", label: "Doğrulanmış Profil", tone: "verified" });
  }

  if (payload.item.verificationStatus === "claimed") {
    badges.push({ key: "managed", label: "Yönetilen Profil", tone: "managed" });
  } else if (payload.item.isClaimable) {
    badges.push({ key: "claimable", label: "Sahiplenilebilir Profil", tone: "claimable" });
  }

  return badges;
}

function buildQuickActions(payload: PublicCatalogProfilePagePayload): PublicProfileQuickAction[] {
  const actions: PublicProfileQuickAction[] = [];

  const websiteContact = payload.contacts.find(
    (contact) => contact.type === "website" && toSafeExternalUrl(contact.value),
  );
  const websiteLink = payload.links.find((link) => toSafeExternalUrl(link.url));
  const websiteHref = websiteContact
    ? toSafeExternalUrl(websiteContact.value)
    : websiteLink
      ? toSafeExternalUrl(websiteLink.url)
      : null;
  if (websiteHref) {
    actions.push({ key: "website", label: "Web Sitesi", href: websiteHref, external: true });
  }

  const emailContact = payload.contacts.find(
    (contact) => contact.type === "email" && toSafeMailHref(contact.value),
  );
  if (emailContact) {
    actions.push({
      key: "email",
      label: "E-posta Gönder",
      href: toSafeMailHref(emailContact.value)!,
      external: false,
    });
  }

  const phoneContact = payload.contacts.find(
    (contact) => contact.type === "phone" && toSafePhoneHref(contact.value),
  );
  if (phoneContact) {
    actions.push({
      key: "phone",
      label: "Telefon Et",
      href: toSafePhoneHref(phoneContact.value)!,
      external: false,
    });
  }

  const mapHref = toMapHref([
    payload.item.addressLine,
    payload.item.city,
    payload.item.countryLabel ?? payload.item.countryCode,
  ]);
  if (mapHref && (payload.item.addressLine || payload.item.city)) {
    actions.push({ key: "map", label: "Haritada Aç", href: mapHref, external: true });
  }

  return actions;
}

function isSectionEmpty(section: PublicProfileSectionViewModel): boolean {
  const content = section.content;
  if (!content || Object.keys(content).length === 0) {
    // Unknown/contentless DB sections still render via the generic fallback
    // when they carry a description; otherwise there is nothing to show.
    return !section.description;
  }
  if (typeof content.text === "string") return content.text.trim() === "";
  if (Array.isArray(content.badges)) return content.badges.length === 0;
  if (Array.isArray(content.links)) return content.links.length === 0;
  if (Array.isArray(content.rows)) return content.rows.length === 0;
  if (Array.isArray(content.services)) return content.services.length === 0;
  if (Array.isArray(content.languages)) return content.languages.length === 0;
  if (Array.isArray(content.contacts)) return content.contacts.length === 0;
  if (typeof content.url === "string") return content.url.trim() === "";
  return false;
}

function resolveSectionPlacement(componentKey: string | null): "main" | "sidebar" {
  if (!componentKey) return "main";
  return SECTION_PLACEMENTS[componentKey] ?? "main";
}

/** Sort orders that keep DB-managed sections (typically 100-200) ahead of derived ones. */
const DERIVED_SORT_ORDERS = {
  attributes: 900,
  services: 905,
  contactList: 910,
  languages: 915,
  links: 920,
} as const;

function buildDerivedSections(
  payload: PublicCatalogProfilePagePayload,
  dbSections: PublicProfileSectionViewModel[],
): PublicProfileSectionViewModel[] {
  const derived: PublicProfileSectionViewModel[] = [];
  const dbComponentKeys = new Set(dbSections.map((section) => section.componentKey));

  const attributeRows = buildAttributeRows(payload.attributes);
  if (attributeRows.length > 0 && !dbComponentKeys.has("attributes")) {
    derived.push({
      key: "derived.attributes",
      label: "Profil Bilgileri",
      description: null,
      componentKey: "attributes",
      placement: "main",
      sortOrder: DERIVED_SORT_ORDERS.attributes,
      content: { rows: attributeRows },
    });
  }

  if (payload.services.length > 0 && !dbComponentKeys.has("services")) {
    derived.push({
      key: "derived.services",
      label: "Hizmetler",
      description: null,
      componentKey: "services",
      placement: "main",
      sortOrder: DERIVED_SORT_ORDERS.services,
      content: { services: payload.services },
    });
  }

  const contactRows = buildContactRows(payload.contacts);
  if (contactRows.length > 0 && !dbComponentKeys.has("contact_list")) {
    derived.push({
      key: "derived.contact_list",
      label: "İletişim",
      description: null,
      componentKey: "contact_list",
      placement: "sidebar",
      sortOrder: DERIVED_SORT_ORDERS.contactList,
      content: { contacts: contactRows },
    });
  }

  if (payload.languages.length > 0 && !dbComponentKeys.has("languages")) {
    derived.push({
      key: "derived.languages",
      label: "Diller",
      description: null,
      componentKey: "languages",
      placement: "sidebar",
      sortOrder: DERIVED_SORT_ORDERS.languages,
      content: { languages: payload.languages },
    });
  }

  const linkRows = buildLinkRows(payload.links);
  if (linkRows.length > 0 && !dbComponentKeys.has("links")) {
    derived.push({
      key: "derived.links",
      label: "Bağlantılar",
      description: null,
      componentKey: "links",
      placement: "sidebar",
      sortOrder: DERIVED_SORT_ORDERS.links,
      content: { links: linkRows },
    });
  }

  return derived;
}

export function buildPublicCatalogProfileViewModel(
  payload: PublicCatalogProfilePagePayload,
): PublicCatalogProfileViewModel {
  const { item } = payload;

  const dbSections: PublicProfileSectionViewModel[] = payload.sections
    .filter((section) => !HERO_SECTION_AREAS.has(section.sectionArea))
    .map((section) => ({
      key: section.sectionKey,
      label: section.label,
      description: section.description,
      componentKey: section.componentKey,
      placement: resolveSectionPlacement(section.componentKey),
      sortOrder: section.sortOrder,
      content: section.content,
    }));

  // DB sections win over derived duplicates; sanitize DB link sections too.
  const sanitizedDbSections = dbSections.map((section) => {
    if (section.componentKey !== "links" || !Array.isArray(section.content.links)) return section;
    const safeLinks = buildLinkRows(
      (section.content.links as Array<Record<string, unknown>>).map((link) => ({
        type: typeof link.type === "string" ? link.type : "link",
        label: typeof link.label === "string" ? link.label : null,
        url: typeof link.url === "string" ? link.url : "",
        isPrimary: false,
      })),
    );
    return { ...section, content: { links: safeLinks } };
  });

  const allSections = [...sanitizedDbSections, ...buildDerivedSections(payload, sanitizedDbSections)]
    .filter((section) => !isSectionEmpty(section));

  const sortSections = (a: PublicProfileSectionViewModel, b: PublicProfileSectionViewModel) =>
    a.sortOrder - b.sortOrder || a.key.localeCompare(b.key);

  const headline = item.headline ?? item.shortDescription;
  const hasRichText = allSections.some((section) => section.componentKey === "rich_text");

  return {
    hero: {
      title: item.title,
      initials: getInitials(item.title),
      avatarUrl: toSafeExternalUrl(item.avatarUrl),
      avatarAlt: item.title,
      coverImageUrl: toSafeExternalUrl(item.coverImageUrl),
      roleLabel: item.roleLabel ?? item.itemType ?? null,
      // Headline duplicates the rich_text body when it falls back to
      // shortDescription and a rich_text section exists — prefer the section.
      headline: item.headline ?? (hasRichText ? null : headline),
      locationLabel: formatLocationLabel(item.city, item.countryLabel, item.countryCode),
      accent: resolveProfileAccent(item.roleKey ?? item.itemType),
      badges: buildBadges(payload),
    },
    quickActions: buildQuickActions(payload),
    mainSections: allSections.filter((section) => section.placement === "main").sort(sortSections),
    sidebarSections: allSections.filter((section) => section.placement === "sidebar").sort(sortSections),
    claim: {
      itemId: item.id,
      slug: item.slug,
      canClaim: payload.claim.canClaim && item.verificationStatus !== "claimed",
      isManaged: item.verificationStatus === "claimed",
    },
  };
}

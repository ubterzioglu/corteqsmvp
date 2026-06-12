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
import {
  resolveProfilePresentation,
  type ProfilePresentationConfig,
  type ProfileQuickActionKey,
} from "@/lib/profile-presentation";
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
  tone: "category" | "verified" | "managed" | "claimable" | "job" | "mentor" | "moving";
};

export type PublicProfileLinkPill = {
  key: string;
  label: string;
  url: string;
};

export type PublicProfileQuickAction = {
  key: ProfileQuickActionKey;
  label: string;
  href: string;
  external: boolean;
  variant: "primary" | "secondary";
};

export type PublicProfileTrustSignal = {
  key: "verified" | "managed" | "claimable";
  label: string;
  description: string;
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
  eyebrow: string | null;
  tagline: string | null;
  headline: string | null;
  locationLabel: string | null;
  accent: ProfileAccent;
  badges: PublicProfileBadgeViewModel[];
  linkPills: PublicProfileLinkPill[];
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
  trustSignals: PublicProfileTrustSignal[];
  mainSections: PublicProfileSectionViewModel[];
  sidebarSections: PublicProfileSectionViewModel[];
  claim: PublicProfileClaimViewModel;
  presentation: ProfilePresentationConfig;
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

/** Opt-in boolean attributes that surface as icon badges in the hero. */
const HERO_BADGE_ATTRIBUTES: Record<string, { label: string; tone: "job" | "mentor" | "moving" }> = {
  job_seeking_opt_in: { label: "İş Arıyorum", tone: "job" },
  volunteer_mentorship_opt_in: { label: "Gönüllü Mentör", tone: "mentor" },
  moving_soon_opt_in: { label: "Yakında Taşınacak", tone: "moving" },
};

/** Social URL attributes rendered as hero link pills instead of the grid. */
const SOCIAL_LINK_ATTRIBUTES: Record<string, string> = {
  linkedin_url: "LinkedIn",
  website_url: "Website",
  instagram_url: "Instagram",
  facebook_url: "Facebook",
  youtube_url: "YouTube",
  tiktok_url: "TikTok",
  x_url: "X (Twitter)",
  reddit_url: "Reddit",
};

/** Contact types that read as social links (rendered as hero pills, not sidebar rows). */
const SOCIAL_CONTACT_TYPES = new Set([
  "linkedin",
  "instagram",
  "facebook",
  "youtube",
  "tiktok",
  "telegram",
]);

/** Attribute keys already rendered by the hero — never repeated in the grid. */
const HERO_DUPLICATE_ATTRIBUTE_KEYS = new Set([
  "full_name",
  "profile_photo_url",
  "avatar_url",
  "city",
  "country",
  "bio_short",
  ...Object.keys(HERO_BADGE_ATTRIBUTES),
  ...Object.keys(SOCIAL_LINK_ATTRIBUTES),
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

function isAttributeTrue(attribute: PublicProfileAttribute): boolean {
  return attribute.valueJson === true || attribute.valueText === "true";
}

function buildBadges(payload: PublicCatalogProfilePagePayload): PublicProfileBadgeViewModel[] {
  const badges: PublicProfileBadgeViewModel[] = payload.item.categories.map((category) => ({
    key: `category-${category.slug}`,
    label: category.name,
    tone: "category" as const,
  }));

  for (const attribute of payload.attributes) {
    const heroBadge = HERO_BADGE_ATTRIBUTES[attribute.key];
    if (heroBadge && isAttributeTrue(attribute)) {
      badges.push({ key: attribute.key, label: heroBadge.label, tone: heroBadge.tone });
    }
  }

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

/**
 * Hero link pills (IndividualPublicView pattern): catalog links + social
 * contacts + social URL attributes merged and deduped by safe URL.
 */
export function buildHeroLinkPills(payload: PublicCatalogProfilePagePayload): PublicProfileLinkPill[] {
  const seen = new Set<string>();
  const pills: PublicProfileLinkPill[] = [];

  const push = (label: string, rawUrl: string | null) => {
    const url = toSafeExternalUrl(rawUrl);
    if (!url || seen.has(url)) return;
    seen.add(url);
    pills.push({ key: url, label, url });
  };

  for (const link of payload.links) {
    push(link.label ?? CONTACT_TYPE_LABELS[link.type] ?? link.type, link.url);
  }
  for (const contact of payload.contacts) {
    if (SOCIAL_CONTACT_TYPES.has(contact.type)) {
      push(contact.label ?? CONTACT_TYPE_LABELS[contact.type] ?? contact.type, contact.value);
    }
  }
  for (const attribute of payload.attributes) {
    const label = SOCIAL_LINK_ATTRIBUTES[attribute.key];
    if (label) push(label, attribute.valueText);
  }

  return pills;
}

/**
 * WhatsApp values arrive both as chat/group URLs and as phone numbers; URLs
 * pass the http(s) gate, numbers turn into a wa.me deep link.
 */
export function toWhatsAppHref(value: string | null | undefined): string | null {
  if (!value) return null;
  const url = toSafeExternalUrl(value);
  if (url) return url;
  const digits = value.replace(/[^\d]/g, "");
  return digits.length >= 7 ? `https://wa.me/${digits}` : null;
}

type QuickActionDraft = Omit<PublicProfileQuickAction, "variant">;

function buildQuickActions(
  payload: PublicCatalogProfilePagePayload,
  presentation: ProfilePresentationConfig,
): PublicProfileQuickAction[] {
  const actions: QuickActionDraft[] = [];

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

  const whatsappContact = payload.contacts.find(
    (contact) => contact.type === "whatsapp" && toWhatsAppHref(contact.value),
  );
  if (whatsappContact) {
    actions.push({
      key: "whatsapp",
      label: "WhatsApp",
      href: toWhatsAppHref(whatsappContact.value)!,
      external: true,
    });
  }

  const appointmentContact = payload.contacts.find(
    (contact) => contact.type === "appointment_url" && toSafeExternalUrl(contact.value),
  );
  if (appointmentContact) {
    actions.push({
      key: "appointment",
      label: "Randevu Al",
      href: toSafeExternalUrl(appointmentContact.value)!,
      external: true,
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

  // Presentation decides which present actions become primary CTAs; the
  // generic config has an empty priority list, so everything stays secondary.
  const primaryKeys = new Set(
    presentation.primaryActionPriority
      .filter((key) => actions.some((action) => action.key === key))
      .slice(0, presentation.maxPrimaryActions),
  );

  return actions.map((action) => ({
    ...action,
    variant: primaryKeys.has(action.key) ? "primary" : "secondary",
  }));
}

function buildTrustSignals(payload: PublicCatalogProfilePagePayload): PublicProfileTrustSignal[] {
  const signals: PublicProfileTrustSignal[] = [];

  if (payload.item.isVerified) {
    signals.push({
      key: "verified",
      label: "Doğrulanmış Profil",
      description: "Bu profil CorteQS ekibi tarafından doğrulandı.",
    });
  }

  if (payload.item.verificationStatus === "claimed") {
    signals.push({
      key: "managed",
      label: "Yönetilen Profil",
      description: "Bu profil sahibi tarafından aktif olarak yönetiliyor.",
    });
  } else if (payload.item.isClaimable) {
    signals.push({
      key: "claimable",
      label: "Sahiplenilebilir Profil",
      description: "Bu profilin sahibiysen düzenleme yetkisi talep edebilirsin.",
    });
  }

  return signals;
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

  // Social contact types render as hero link pills, not sidebar rows.
  const contactRows = buildContactRows(
    payload.contacts.filter((contact) => !SOCIAL_CONTACT_TYPES.has(contact.type)),
  );
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

  // Links are rendered as hero link pills (IndividualPublicView pattern);
  // no derived "Bağlantılar" card is produced anymore.

  return derived;
}

/**
 * Applies the presentation-preferred component order as a stable pre-sort:
 * listed componentKeys come first (in list order), everything else keeps the
 * DB-driven sortOrder comparator. Empty preference = untouched generic order.
 */
function sortSectionsWithPreference(
  sections: PublicProfileSectionViewModel[],
  preferredOrder: string[],
): PublicProfileSectionViewModel[] {
  const baseComparator = (a: PublicProfileSectionViewModel, b: PublicProfileSectionViewModel) =>
    a.sortOrder - b.sortOrder || a.key.localeCompare(b.key);

  if (preferredOrder.length === 0) {
    return [...sections].sort(baseComparator);
  }

  const preferenceIndex = (section: PublicProfileSectionViewModel) => {
    const index = section.componentKey ? preferredOrder.indexOf(section.componentKey) : -1;
    return index === -1 ? preferredOrder.length : index;
  };

  return [...sections].sort(
    (a, b) => preferenceIndex(a) - preferenceIndex(b) || baseComparator(a, b),
  );
}

export function buildPublicCatalogProfileViewModel(
  payload: PublicCatalogProfilePagePayload,
): PublicCatalogProfileViewModel {
  const { item } = payload;
  const presentation = resolveProfilePresentation(item.roleKey);

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

  const linkPills = buildHeroLinkPills(payload);

  const allSections = [...sanitizedDbSections, ...buildDerivedSections(payload, sanitizedDbSections)]
    .filter((section) => !isSectionEmpty(section))
    // Link sections are superseded by the hero link pills (same data source);
    // they reappear automatically if no pill can be built.
    .filter((section) => !(section.componentKey === "links" && linkPills.length > 0));

  const hasRichText = allSections.some((section) => section.componentKey === "rich_text");

  return {
    hero: {
      title: item.title,
      initials: getInitials(item.title),
      avatarUrl: toSafeExternalUrl(item.avatarUrl),
      avatarAlt: item.title,
      coverImageUrl: toSafeExternalUrl(item.coverImageUrl),
      roleLabel: item.roleLabel ?? item.itemType ?? null,
      eyebrow: presentation.eyebrow,
      // Tagline pill next to the name (IndividualPublicView pattern);
      // the short description only shows when no rich_text section covers it.
      tagline: item.headline,
      headline: hasRichText ? null : item.shortDescription,
      locationLabel: formatLocationLabel(item.city, item.countryLabel, item.countryCode),
      accent: presentation.accent ?? resolveProfileAccent(item.roleKey ?? item.itemType),
      badges: buildBadges(payload),
      linkPills,
    },
    quickActions: buildQuickActions(payload, presentation),
    trustSignals: buildTrustSignals(payload),
    mainSections: sortSectionsWithPreference(
      allSections.filter((section) => section.placement === "main"),
      presentation.preferredSectionOrder,
    ),
    sidebarSections: sortSectionsWithPreference(
      allSections.filter((section) => section.placement === "sidebar"),
      presentation.preferredSectionOrder,
    ),
    claim: {
      itemId: item.id,
      slug: item.slug,
      canClaim: payload.claim.canClaim && item.verificationStatus !== "claimed",
      isManaged: item.verificationStatus === "claimed",
    },
    presentation,
  };
}

import type { CurrentUserProfilePayload, ProfileAttributeState, ProfileFeatureState } from "@/lib/member-profile";
import { getAttributeStringValue } from "@/lib/member-profile";
import { GENERIC_FEATURE_KEYS, INDIVIDUAL_FEATURE_KEYS } from "@/lib/features";
import { getRoleMeta, getUiProfileType } from "@/lib/profile-types";

export type PublicProfileSectionRow = {
  section_key: string;
  section_area: "preview_card" | "detail_card";
  label: string;
  component_name: string | null;
  sort_order: number;
  content: Record<string, unknown> | null;
};

export type PublicProfileLink = {
  label: string;
  url: string;
};

export type PublicProfileSection = {
  key: string;
  label: string;
  content: string;
};

export type PublicProfileViewModel = {
  userId: string;
  roleKey: string | null;
  roleLabel: string;
  roleTitle: string;
  roleDescription: string;
  displayName: string;
  headline: string;
  locationLabel: string;
  imageUrl: string | null;
  badges: string[];
  links: PublicProfileLink[];
  sections: PublicProfileSection[];
  emptyMessage: string;
};

export type SelfProfileViewModel = {
  userId: string;
  roleKey: string;
  roleLabel: string;
  displayName: string;
  headline: string;
  locationLabel: string;
  email: string | null;
  completionPercentage: number;
  publicAttributeCount: number;
  pendingCount: number;
  dashboardCount: number;
  preview: PublicProfileViewModel;
};

const COMMON_PUBLIC_ATTRIBUTE_KEYS = new Set([
  "full_name",
  "bio_short",
  "country",
  "city",
  "profile_photo_url",
]);

const LINK_LABELS: Record<string, string> = {
  facebook_url: "Facebook",
  facebook: "Facebook",
  reddit_url: "Reddit",
  reddit: "Reddit",
  linkedin: "LinkedIn",
  linkedin_url: "LinkedIn",
  instagram: "Instagram",
  instagram_url: "Instagram",
  x_url: "X (Twitter)",
  x: "X (Twitter)",
  twitter_url: "X (Twitter)",
  twitter: "X (Twitter)",
  website: "Website",
  website_url: "Website",
  portfolio_url: "Portfolyo",
  calendly_url: "Calendly",
  whatsapp_url: "WhatsApp",
  youtube_url: "YouTube",
  tiktok_url: "TikTok",
};

const LINK_ATTRIBUTE_KEYS = new Set(Object.keys(LINK_LABELS));
const FEATURE_GATED_PUBLIC_LINK_KEYS = new Map<string, string>([
  ["linkedin_url", GENERIC_FEATURE_KEYS.profileLinkedinCard],
  ["website_url", GENERIC_FEATURE_KEYS.profileWebsiteCard],
]);

const getStringValue = (attribute: ProfileAttributeState) => {
  const displayValue = getAttributeStringValue(attribute).trim();
  if (displayValue) return displayValue;
  if (typeof attribute.valueJson === "boolean") return attribute.valueJson ? "Evet" : "Hayır";
  return "";
};

const isLikelyUrl = (value: string) => /^https?:\/\//i.test(value);

const getPublicAttributes = (attributes: ProfileAttributeState[]) =>
  attributes.filter((attribute) => attribute.visibility === "public" && getStringValue(attribute));

const uniqueLinks = (links: PublicProfileLink[]) => {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = `${link.label}|${link.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const isFeatureEnabled = (features: ProfileFeatureState[], featureKey: string) => {
  return features.some((feature) => feature.key === featureKey && feature.isEnabled);
};

const buildLinksFromAttributes = (attributes: ProfileAttributeState[], features: ProfileFeatureState[]): PublicProfileLink[] =>
  uniqueLinks(
    attributes.flatMap((attribute) => {
      const raw = getStringValue(attribute);
      if (!raw || !isLikelyUrl(raw)) return [];
      const requiredFeatureKey = FEATURE_GATED_PUBLIC_LINK_KEYS.get(attribute.attributeKey);
      if (requiredFeatureKey && !isFeatureEnabled(features, requiredFeatureKey)) {
        return [];
      }
      const label = LINK_LABELS[attribute.attributeKey] ?? attribute.label;
      return [{ label, url: raw }];
    }),
  );

const getLocationLabel = (attributes: ProfileAttributeState[]) => {
  const country = attributes.find((attribute) => attribute.attributeKey === "country");
  const city = attributes.find((attribute) => attribute.attributeKey === "city");
  return [city ? getStringValue(city) : "", country ? getStringValue(country) : ""].filter(Boolean).join(", ");
};

const getImageUrl = (attributes: ProfileAttributeState[]) => {
  const imageAttribute = attributes.find((attribute) => attribute.attributeKey === "profile_photo_url");
  const value = imageAttribute ? getStringValue(imageAttribute) : "";
  return isLikelyUrl(value) ? value : null;
};

const buildRoleSpecificSections = (profile: CurrentUserProfilePayload, publicAttributes: ProfileAttributeState[]) => {
  const roleMeta = getRoleMeta(getUiProfileType(profile.profileType));
  const roleSpecificAttributes = publicAttributes.filter(
    (attribute) =>
      !COMMON_PUBLIC_ATTRIBUTE_KEYS.has(attribute.attributeKey) &&
      !LINK_ATTRIBUTE_KEYS.has(attribute.attributeKey),
  );
  const spotlightAttribute = roleSpecificAttributes.find(
    (attribute) => attribute.attributeKey === roleMeta?.defaultAttributeKey,
  );

  const sections: PublicProfileSection[] = [];

  const shortBio = publicAttributes.find((attribute) => attribute.attributeKey === "bio_short");
  if (shortBio) {
    sections.push({
      key: "about",
      label: "Hakkında",
      content: getStringValue(shortBio),
    });
  }

  if (spotlightAttribute) {
    sections.push({
      key: spotlightAttribute.attributeKey,
      label: spotlightAttribute.label,
      content: getStringValue(spotlightAttribute),
    });
  }

  roleSpecificAttributes
    .filter((attribute) => attribute.attributeKey !== spotlightAttribute?.attributeKey)
    .slice(0, 4)
    .forEach((attribute) => {
      sections.push({
        key: attribute.attributeKey,
        label: attribute.label,
        content: getStringValue(attribute),
      });
    });

  return sections;
};

const getBooleanAttributeValue = (attributes: ProfileAttributeState[], attributeKey: string) => {
  const attribute = attributes.find((item) => item.attributeKey === attributeKey);
  return attribute?.valueJson === true;
};

export const buildPublicProfileViewModelFromCurrentUser = (
  profile: CurrentUserProfilePayload,
): PublicProfileViewModel => {
  const roleMeta = getRoleMeta(getUiProfileType(profile.profileType));
  const publicAttributes = getPublicAttributes(profile.attributes);
  // Yeni kullanıcıda attribute listesi tamamen boş olabilir — find sonuçlarını guard'la.
  const displayNameAttribute =
    profile.attributes.find((attribute) => attribute.attributeKey === "full_name") ?? publicAttributes[0] ?? null;
  const displayName =
    (displayNameAttribute ? getStringValue(displayNameAttribute) : "") ||
    profile.fullName ||
    "CorteQS Üyesi";
  const shortBioAttribute =
    profile.attributes.find((attribute) => attribute.attributeKey === "bio_short") ?? publicAttributes[0] ?? null;
  const shortBio =
    (shortBioAttribute ? getStringValue(shortBioAttribute) : "") ||
    roleMeta?.description ||
    "Bu profil henüz detaylandırılmadı.";
  const links = buildLinksFromAttributes(publicAttributes, profile.features);
  const extraBadges = [
    isFeatureEnabled(profile.features, INDIVIDUAL_FEATURE_KEYS.jobSeekingBadge) && getBooleanAttributeValue(publicAttributes, "job_seeking_opt_in")
      ? "İş Arıyorum"
      : "",
    isFeatureEnabled(profile.features, INDIVIDUAL_FEATURE_KEYS.movingSoonBadge) && getBooleanAttributeValue(publicAttributes, "moving_soon_opt_in")
      ? "Yakında Taşınacağım"
      : "",
    isFeatureEnabled(profile.features, INDIVIDUAL_FEATURE_KEYS.volunteerMentorship) && getBooleanAttributeValue(publicAttributes, "volunteer_mentorship_opt_in")
      ? "Gönüllü Mentör"
      : "",
  ].filter(Boolean);

  return {
    userId: profile.userId,
    roleKey: profile.profileType,
    roleLabel: profile.roleLabel,
    roleTitle: profile.roleLabel || (roleMeta?.title ?? ""),
    roleDescription: roleMeta?.description ?? "",
    displayName,
    headline: shortBio,
    locationLabel: getLocationLabel(publicAttributes),
    imageUrl: getImageUrl(publicAttributes),
    badges: [
      profile.roleLabel,
      `${publicAttributes.length} public alan`,
      `Tamamlanma %${profile.profileCompletion.percentage}`,
      ...extraBadges,
    ],
    links,
    sections: buildRoleSpecificSections(profile, publicAttributes),
    emptyMessage: "Bu profil için henüz yayınlanmış public alan bulunmuyor.",
  };
};

export const buildSelfProfileViewModel = (
  profile: CurrentUserProfilePayload,
  dashboardCount: number,
): SelfProfileViewModel => {
  const preview = buildPublicProfileViewModelFromCurrentUser(profile);

  return {
    userId: profile.userId,
    roleKey: profile.profileType,
    roleLabel: profile.roleLabel,
    displayName: preview.displayName,
    headline: preview.headline,
    locationLabel: preview.locationLabel,
    email: profile.email,
    completionPercentage: profile.profileCompletion.percentage,
    publicAttributeCount: profile.attributes.filter((attribute) => attribute.visibility === "public").length,
    pendingCount: profile.pendingRequests.length,
    dashboardCount,
    preview,
  };
};

const normalizeSectionContent = (section: PublicProfileSectionRow): string | null => {
  const content = section.content ?? {};

  if (section.component_name === "rich_text") {
    return typeof content.text === "string" ? content.text : null;
  }

  if (section.component_name === "badges") {
    if (content.groups && typeof content.groups === "object") {
      const labels = Object.values(content.groups as Record<string, unknown[]>)
        .flatMap((items) => items)
        .map((item) =>
          item && typeof item === "object" && "label" in item && typeof item.label === "string"
            ? item.label
            : null,
        )
        .filter((item): item is string => Boolean(item));
      return labels.join(", ");
    }
  }

  if (section.component_name === "links" && Array.isArray(content.links)) {
    const labels = content.links
      .map((item) =>
        item && typeof item === "object" && "label" in item && typeof item.label === "string"
          ? item.label
          : null,
      )
      .filter((item): item is string => Boolean(item));
    return labels.length ? labels.join(", ") : null;
  }

  return null;
};

export const buildPublicProfileViewModelFromSections = (
  userId: string,
  sections: PublicProfileSectionRow[],
): PublicProfileViewModel => {
  const previewSections = sections
    .filter((section) => section.section_area === "preview_card")
    .sort((left, right) => left.sort_order - right.sort_order);
  const detailSections = sections
    .filter((section) => section.section_area === "detail_card")
    .sort((left, right) => left.sort_order - right.sort_order);

  const displayName =
    previewSections.find((section) => section.section_key === "preview.isim_kurulus_adi")?.content?.text;
  const locationSection = previewSections.find((section) => section.section_key === "preview.konum");
  const imageSection = previewSections.find((section) => section.section_key === "preview.profil_logo_gorseli");
  const categorySection = previewSections.find(
    (section) => section.section_key === "preview.kategori_sektor_etiketi",
  );

  const extraBadges = Array.isArray(categorySection?.content?.extra_badges)
    ? categorySection.content.extra_badges.filter((item): item is string => typeof item === "string")
    : [];
  const primaryLabel =
    typeof categorySection?.content?.primary_label === "string" ? categorySection.content.primary_label : null;

  const links = uniqueLinks(
    detailSections.flatMap((section) => {
      const content = section.content ?? {};
      if (!Array.isArray(content.links)) return [];
      return content.links
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const label = "label" in item && typeof item.label === "string" ? item.label : null;
          const url = "url" in item && typeof item.url === "string" ? item.url : null;
          if (!label || !url) return null;
          return { label, url };
        })
        .filter((item): item is PublicProfileLink => Boolean(item));
    }),
  );

  return {
    userId,
    roleKey: null,
    roleLabel: primaryLabel ?? "Profil",
    roleTitle: primaryLabel ?? "Profil",
    roleDescription: "",
    displayName: typeof displayName === "string" ? displayName : "Profil",
    headline: primaryLabel ?? "Public profil görünümü",
    locationLabel: [locationSection?.content?.city, locationSection?.content?.country].filter(Boolean).join(", "),
    imageUrl: typeof imageSection?.content?.url === "string" ? imageSection.content.url : null,
    badges: [primaryLabel, ...extraBadges].filter((item): item is string => Boolean(item)).slice(0, 6),
    links,
    sections: detailSections
      .map((section) => {
        const content = normalizeSectionContent(section);
        if (!content) return null;
        return {
          key: section.section_key,
          label: section.label,
          content,
        };
      })
      .filter((section): section is PublicProfileSection => Boolean(section)),
    emptyMessage: "Bu profil görünür değil veya yayınlanmış public section içermiyor.",
  };
};


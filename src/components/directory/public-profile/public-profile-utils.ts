/**
 * Pure helpers for the public catalog profile page.
 * Single home for URL sanitization, semantic hrefs and visual accents.
 */

export const PROFILE_ACCENTS = ["orange", "blue", "green", "red", "purple"] as const;

export type ProfileAccent = (typeof PROFILE_ACCENTS)[number];

/** Deterministic accent from a stable seed (roleKey/itemType). Never role-specific layout. */
export function resolveProfileAccent(seed: string | null | undefined): ProfileAccent {
  if (!seed) return "blue";
  const total = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PROFILE_ACCENTS[total % PROFILE_ACCENTS.length];
}

/** Accepts only http(s) URLs; everything else (javascript:, data:, relative...) returns null. */
export function toSafeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Normalizes a phone value into a tel: href; null when no digits remain. */
export function toSafePhoneHref(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.replace(/[^\d+]/g, "");
  return normalized.replace(/\+/g, "").length > 0 ? `tel:${normalized}` : null;
}

/** Validates a basic e-mail shape and returns a mailto: href. */
export function toSafeMailHref(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? `mailto:${trimmed}` : null;
}

/** Builds a Google Maps search link from address parts; query is always encoded. */
export function toMapHref(parts: Array<string | null | undefined>): string | null {
  const query = parts
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(", ");
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Initials fallback when no avatar/logo media exists. */
export function getInitials(title: string | null | undefined): string {
  if (!title) return "?";
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toLocaleUpperCase("tr-TR");
  return (words[0][0] + words[1][0]).toLocaleUpperCase("tr-TR");
}

/** "Şehir • Ülke" label; country label preferred over raw code. */
export function formatLocationLabel(
  city: string | null,
  countryLabel: string | null,
  countryCode: string | null,
): string | null {
  const label = [city, countryLabel ?? countryCode].filter(Boolean).join(" • ");
  return label || null;
}

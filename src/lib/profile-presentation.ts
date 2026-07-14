import type { ProfileAccent } from "@/components/directory/public-profile/public-profile-utils";
import { getUiProfileType } from "@/lib/profile-types";

/**
 * Presentation config layer: resolves the *visual* profile experience from the
 * flat role key (roles.key). Public page and authenticated editor share the
 * same resolver so a role always renders with one consistent visual language.
 *
 * Scope rules:
 * - Pure presentation decisions only — no permission, visibility or backend
 *   rules belong here (those stay in RPC payloads / AFS).
 * - Resolution order: (1) exact-match on `supportedRoleKeys` (pilot roles),
 *   (2) explicit presentation exclusions (roles that are Bireysel by category
 *   but should keep the plain/generic layout), (3) every remaining flat role
 *   in the "Bireysel" UI category (per profile-types.ts' getUiProfileType —
 *   the single source of truth for that classification) gets the individual
 *   premium config, (4) everything else falls back to generic.
 * - Category classification is intentionally NOT reimplemented here; it is
 *   imported from profile-types.ts so there is one place that decides "is
 *   this role Bireysel". Presentation exclusions are a visual-only carve-out
 *   on top of that classification — they do not change the role's category,
 *   permissions, or data model.
 */

export type ProfileHeroVariant = "member" | "professional" | "business" | "organization" | "experimental";

export type ProfileQuickActionKey = "website" | "email" | "phone" | "map" | "whatsapp" | "appointment";

export type ProfilePresentationConfig = {
  /** Stable identifier; components check this key, never the role key directly. */
  key: string;
  /** Flat role keys (roles.key) that resolve to this config. Exact match only. */
  supportedRoleKeys: string[];
  /**
   * Accent override for the hero surface. `null` keeps the deterministic
   * accent derived from the role key (existing generic behavior).
   */
  accent: ProfileAccent | null;
  heroVariant: ProfileHeroVariant;
  /** Small label rendered above the name in the hero (pilot styling only). */
  eyebrow: string | null;
  /**
   * Quick action keys that should render as primary CTAs, in priority order.
   * At most `maxPrimaryActions` of the present actions become primary; an
   * empty list keeps every action secondary (generic behavior).
   */
  primaryActionPriority: ProfileQuickActionKey[];
  maxPrimaryActions: number;
  /**
   * Preferred section order by componentKey. Sections whose componentKey is
   * listed are pulled ahead (stable, per placement column); everything else
   * keeps the DB sortOrder. Empty list = untouched DB order (generic).
   */
  preferredSectionOrder: string[];
  /** Whether the public page renders the sticky mobile action bar. */
  showMobileActionBar: boolean;
};

export const EXPERIMENTAL_2_PRESENTATION_KEY = "experimental-2-premium";
export const INDIVIDUAL_PRESENTATION_KEY = "individual-premium";
export const GENERIC_PRESENTATION_KEY = "generic";

const EXPERIMENTAL_2_PRESENTATION: ProfilePresentationConfig = {
  key: EXPERIMENTAL_2_PRESENTATION_KEY,
  // Experimental_3, premium pilotunun bir klonudur ve aynı premium görünümü alır.
  supportedRoleKeys: ["Experimental_2", "Experimental_3"],
  accent: "purple",
  heroVariant: "experimental",
  eyebrow: "Premium Profil",
  primaryActionPriority: ["email", "whatsapp", "phone"],
  maxPrimaryActions: 2,
  preferredSectionOrder: ["rich_text", "attributes", "services", "contact_list", "languages", "badges"],
  showMobileActionBar: true,
};

// Tüm "Bireysel" UI kategorisindeki flat roller (User_*/Admin_* prefix'leri,
// Job_Candidate, Marketplace_IndividualSeller vb. — bkz. getUiProfileType) için
// Experimental_2/3 pilotuyla aynı görsel değerlere sahip kalıcı config. Ayrı bir
// config olarak tutulur (pilot ile birleştirilmez) ki ileride ayrışma esnekliği
// korunsun; bugün ikisi aynı görünümü üretir.
const INDIVIDUAL_PRESENTATION: ProfilePresentationConfig = {
  key: INDIVIDUAL_PRESENTATION_KEY,
  supportedRoleKeys: [],
  accent: "purple",
  heroVariant: "experimental",
  eyebrow: "Premium Profil",
  primaryActionPriority: ["email", "whatsapp", "phone"],
  maxPrimaryActions: 2,
  preferredSectionOrder: ["rich_text", "attributes", "services", "contact_list", "languages", "badges"],
  showMobileActionBar: true,
};

const GENERIC_PRESENTATION: ProfilePresentationConfig = {
  key: GENERIC_PRESENTATION_KEY,
  supportedRoleKeys: [],
  accent: null,
  heroVariant: "member",
  eyebrow: null,
  primaryActionPriority: [],
  maxPrimaryActions: 0,
  preferredSectionOrder: [],
  showMobileActionBar: false,
};

const PRESENTATION_CONFIGS: ProfilePresentationConfig[] = [EXPERIMENTAL_2_PRESENTATION];

const PRESENTATION_BY_ROLE_KEY: ReadonlyMap<string, ProfilePresentationConfig> = new Map(
  PRESENTATION_CONFIGS.flatMap((config) =>
    config.supportedRoleKeys.map((roleKey) => [roleKey, config] as const),
  ),
);

/**
 * Flat role keys that are classified as "Bireysel" (per getUiProfileType) but
 * must keep the plain/generic profile layout instead of the individual
 * premium presentation. Today this is exactly the platform SuperAdmin role
 * (assigned to the two founder accounts) — their profiles are kept visually
 * separate from the member-facing premium design on request.
 */
const INDIVIDUAL_PRESENTATION_EXCLUDED_ROLE_KEYS: ReadonlySet<string> = new Set([
  "Admin_SuperAdmin",
]);

export function resolveProfilePresentation(
  roleKey: string | null | undefined,
): ProfilePresentationConfig {
  if (!roleKey) return GENERIC_PRESENTATION;

  const pilotMatch = PRESENTATION_BY_ROLE_KEY.get(roleKey);
  if (pilotMatch) return pilotMatch;

  if (INDIVIDUAL_PRESENTATION_EXCLUDED_ROLE_KEYS.has(roleKey)) return GENERIC_PRESENTATION;

  if (getUiProfileType(roleKey) === "bireysel") return INDIVIDUAL_PRESENTATION;

  return GENERIC_PRESENTATION;
}

export function isExperimental2Presentation(config: ProfilePresentationConfig): boolean {
  return config.key === EXPERIMENTAL_2_PRESENTATION_KEY;
}

export function isPremiumPresentation(config: ProfilePresentationConfig): boolean {
  return config.key === EXPERIMENTAL_2_PRESENTATION_KEY || config.key === INDIVIDUAL_PRESENTATION_KEY;
}

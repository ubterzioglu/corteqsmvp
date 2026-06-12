import type { ProfileAccent } from "@/components/directory/public-profile/public-profile-utils";

/**
 * Presentation config layer: resolves the *visual* profile experience from the
 * flat role key (roles.key). Public page and authenticated editor share the
 * same resolver so a role always renders with one consistent visual language.
 *
 * Scope rules (pilot contract):
 * - Pure presentation decisions only — no permission, visibility or backend
 *   rules belong here (those stay in RPC payloads / AFS).
 * - Resolution is exact-match on `supportedRoleKeys`; every unknown role gets
 *   the generic fallback, so production roles are never affected by a pilot.
 * - The Experimental_2 premium pilot is the only non-generic config today;
 *   rollout to other roles = adding a config entry, not touching components.
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
export const GENERIC_PRESENTATION_KEY = "generic";

const EXPERIMENTAL_2_PRESENTATION: ProfilePresentationConfig = {
  key: EXPERIMENTAL_2_PRESENTATION_KEY,
  supportedRoleKeys: ["Experimental_2"],
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

export function resolveProfilePresentation(
  roleKey: string | null | undefined,
): ProfilePresentationConfig {
  if (!roleKey) return GENERIC_PRESENTATION;
  return PRESENTATION_BY_ROLE_KEY.get(roleKey) ?? GENERIC_PRESENTATION;
}

export function isExperimental2Presentation(config: ProfilePresentationConfig): boolean {
  return config.key === EXPERIMENTAL_2_PRESENTATION_KEY;
}

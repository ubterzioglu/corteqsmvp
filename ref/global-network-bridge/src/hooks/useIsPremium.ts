import { useAuth } from "@/contexts/AuthContext";

/**
 * Premium membership flag.
 *
 * TODO (monetization): tie this to an actual subscription record once the
 * Premium package is wired up (Stripe/Paddle). For now, only admins are
 * treated as premium so we can demo the unrestricted UX. Free users are
 * capped (e.g. max 3 countries on the Feed filter); premium has no cap.
 *
 * When the Premium tier ships, also add the "unlimited Feed scope" perk to
 * the package description on /pricing.
 */
export const useIsPremium = () => {
  const { accountType } = useAuth();
  return accountType === "admin";
};

export const FREE_COUNTRY_LIMIT = 3;

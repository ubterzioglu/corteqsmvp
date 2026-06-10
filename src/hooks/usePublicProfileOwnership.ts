import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/auth/useAuth";
import { resolveCatalogSlugForLinkedUser } from "@/lib/public-catalog-profile-api";

export const ownCatalogSlugKeys = {
  detail: (userId: string) => ["own-catalog-slug", userId] as const,
};

/**
 * Detects whether the signed-in user owns the public catalog profile at `slug`
 * (their member catalog item resolves to the same slug). Read-only and cheap:
 * a single slug lookup, no change to the public-page RPC security contract.
 */
export function usePublicProfileOwnership(slug: string | undefined) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ownCatalogSlugKeys.detail(user?.id ?? "anon"),
    queryFn: () => resolveCatalogSlugForLinkedUser(user!.id),
    enabled: Boolean(user?.id && slug),
    staleTime: 5 * 60_000,
    retry: false,
  });

  return {
    isOwner: Boolean(user && slug && query.data === slug),
    isLoading: Boolean(user) && query.isLoading,
  };
}

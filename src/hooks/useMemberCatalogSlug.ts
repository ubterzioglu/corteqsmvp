import { useQuery } from "@tanstack/react-query";

import { getMyEditableCatalogItems } from "@/lib/member-catalog";

export const memberCatalogItemsKeys = {
  mine: ["my-editable-catalog-items"] as const,
};

/**
 * Resolves the current user's member catalog slug through the existing
 * member-catalog API layer. Returns `null` when no member item exists —
 * callers must hide/disable public-preview CTAs instead of inventing a slug.
 */
export function useMemberCatalogSlug(enabled = true) {
  const query = useQuery({
    queryKey: memberCatalogItemsKeys.mine,
    queryFn: getMyEditableCatalogItems,
    enabled,
    staleTime: 60_000,
  });

  const memberItem = query.data?.find((item) => item.itemType === "member") ?? null;

  return {
    slug: memberItem?.slug ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

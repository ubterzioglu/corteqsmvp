import { useMutation } from "@tanstack/react-query";

import { submitCatalogClaim } from "@/lib/public-catalog-claim-api";

type SubmitCatalogClaimInput = {
  itemId: string;
  slug: string;
};

export function useSubmitCatalogClaim() {
  return useMutation({
    mutationFn: ({ itemId, slug }: SubmitCatalogClaimInput) => submitCatalogClaim(itemId, slug),
  });
}

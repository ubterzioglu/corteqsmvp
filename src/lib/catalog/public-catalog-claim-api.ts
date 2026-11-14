import { supabase } from "@/integrations/supabase/client";

type QueryError = { message: string };

type CatalogClaimRpcClient = {
  rpc: (
    functionName: "submit_catalog_claim_request",
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: QueryError | null }>;
};

const claimRpcClient = supabase as unknown as CatalogClaimRpcClient;

/** Submits an editor-access claim for a catalog item. Requires an authenticated session. */
export async function submitCatalogClaim(itemId: string, slug: string): Promise<unknown> {
  const { data, error } = await claimRpcClient.rpc("submit_catalog_claim_request", {
    target_item_id: itemId,
    claim_type: "editor_access",
    evidence: {
      source: "directory_catalog_page",
      slug,
    },
    note: "Directory catalog item editor access request",
  });

  if (error) throw new Error(error.message);
  return data;
}

import { supabase } from "@/integrations/supabase/client";
import {
  parsePublicCatalogProfilePage,
  type PublicCatalogProfilePagePayload,
} from "@/lib/public-catalog-profile-schemas";

type QueryError = { message: string };

type PublicCatalogProfileRpcClient = {
  rpc: (
    functionName: "get_catalog_item_public_page_v2",
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: QueryError | null }>;
};

type CatalogSlugQueryClient = {
  from: (tableName: "catalog_items") => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => {
        order: (orderColumn: string, options: { ascending: boolean }) => {
          limit: (count: number) => {
            maybeSingle: () => Promise<{
              data: { slug: string } | null;
              error: QueryError | null;
            }>;
          };
        };
      };
    };
  };
};

const rpcClient = supabase as unknown as PublicCatalogProfileRpcClient;
const slugQueryClient = supabase as unknown as CatalogSlugQueryClient;

/**
 * Fetches the public profile page payload for a catalog slug.
 * Returns `null` when the item is missing, private or unpublished —
 * callers must render the same not-found state for all three.
 */
export async function getPublicCatalogProfilePage(
  slug: string,
): Promise<PublicCatalogProfilePagePayload | null> {
  const { data, error } = await rpcClient.rpc("get_catalog_item_public_page_v2", {
    p_slug: slug,
  });

  if (error) throw new Error(error.message);

  return parsePublicCatalogProfilePage(data);
}

/**
 * Resolves the catalog slug for a legacy `/directory/profile/:userId` link.
 * Returns `null` when the user has no catalog item.
 */
export async function resolveCatalogSlugForLinkedUser(userId: string): Promise<string | null> {
  const { data, error } = await slugQueryClient
    .from("catalog_items")
    .select("slug")
    .eq("linked_user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.slug) return null;
  return data.slug;
}

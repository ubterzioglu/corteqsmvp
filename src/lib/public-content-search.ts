import { supabase } from "@/integrations/supabase/client";
import { STANDALONE_TOOLS } from "@/lib/standalone-tools";

export type PublicContentSearchResult = {
  type: "blog" | "tool";
  id: string;
  title: string;
  description: string | null;
  href: string;
};

type PublicContentRpcRow = {
  content_type: string;
  external_id: string;
  title: string;
  description: string | null;
  href: string;
};

type PublicContentRpcClient = {
  rpc: (
    functionName: "search_public_content",
    args: { p_search_text: string; p_limit: number },
  ) => Promise<{ data: PublicContentRpcRow[] | null; error: Error | null }>;
};

const rpcClient = supabase as unknown as PublicContentRpcClient;
const MAX_PUBLIC_CONTENT_RESULTS = 24;

const foldSearchText = (value: string): string =>
  value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function searchStaticTools(query: string, limit = 6): PublicContentSearchResult[] {
  const foldedQuery = foldSearchText(query);
  const boundedLimit = Math.min(Math.max(Math.trunc(limit), 0), STANDALONE_TOOLS.length);
  if (foldedQuery.length < 2 || boundedLimit === 0) return [];

  return STANDALONE_TOOLS
    .filter((tool) => foldSearchText(`${tool.title} ${tool.summary}`).includes(foldedQuery))
    .slice(0, boundedLimit)
    .map((tool) => ({
      type: "tool",
      id: tool.slug,
      title: tool.title,
      description: tool.summary,
      href: `/tools/${tool.slug}`,
    }));
}

export async function searchPublicContent(
  query: string,
  limit = 12,
): Promise<PublicContentSearchResult[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) return [];

  const boundedLimit = Math.min(Math.max(Math.trunc(limit), 1), MAX_PUBLIC_CONTENT_RESULTS);
  const toolResults = searchStaticTools(normalizedQuery, boundedLimit);
  const { data, error } = await rpcClient.rpc("search_public_content", {
    p_search_text: normalizedQuery,
    p_limit: boundedLimit,
  });
  if (error) throw error;

  const blogResults = (data ?? []).flatMap((row) => {
    if (
      row.content_type !== "blog" ||
      typeof row.external_id !== "string" ||
      typeof row.title !== "string" ||
      typeof row.href !== "string" ||
      !row.href.startsWith("/blog/")
    ) {
      return [];
    }

    return [{
      type: "blog" as const,
      id: row.external_id,
      title: row.title,
      description: typeof row.description === "string" ? row.description : null,
      href: row.href,
    }];
  });

  return [...blogResults, ...toolResults].slice(0, boundedLimit);
}

import { estimateSerpApiSearchCost } from "../costs.js";
import { extractDomain } from "../dedupe.js";
import {
  AuthOrConfigError,
  ProviderRateLimitError,
  ProviderTemporaryError,
} from "../errors.js";
import type { SearchInput, SearchOutput, SearchProvider } from "./types.js";

const SERPAPI_BASE_URL = "https://serpapi.com/search.json";
const REQUEST_TIMEOUT_MS = 30_000;

interface SerpApiResponse {
  search_metadata?: { id?: string; status?: string };
  organic_results?: Array<{ link: string; title?: string; snippet?: string }>;
  error?: string;
}

/**
 * SerpAPI Google Search — hassas yerelleştirme fallback'i.
 * request_defaults (provider config) gl/hl/google_domain değerlerini taşır.
 */
export function createSerpApiSearchProvider(
  apiKey: string,
  requestDefaults: Record<string, unknown> = {},
): SearchProvider {
  return {
    key: "serpapi",
    async search(input: SearchInput): Promise<SearchOutput> {
      const params = new URLSearchParams({
        engine: "google",
        q: input.query,
        api_key: apiKey,
        num: String(input.maxResults),
      });
      for (const [key, value] of Object.entries(requestDefaults)) {
        if (typeof value === "string" || typeof value === "number") {
          params.set(key, String(value));
        }
      }
      if (input.locationLabel) params.set("location", input.locationLabel);
      if (input.languageCode && !params.has("hl")) params.set("hl", input.languageCode);

      let response: Response;
      try {
        response = await fetch(`${SERPAPI_BASE_URL}?${params.toString()}`, {
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (error: unknown) {
        throw new ProviderTemporaryError("serpapi", error instanceof Error ? error.message : "network error");
      }

      if (response.status === 401 || response.status === 403) {
        throw new AuthOrConfigError("SerpAPI anahtarı geçersiz veya yetkisiz");
      }
      if (response.status === 429) {
        throw new ProviderRateLimitError("serpapi");
      }
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new ProviderTemporaryError("serpapi", `HTTP ${response.status}: ${detail.slice(0, 300)}`);
      }

      const payload = (await response.json()) as SerpApiResponse;
      if (payload.error) {
        throw new ProviderTemporaryError("serpapi", payload.error);
      }

      const usage = estimateSerpApiSearchCost();
      return {
        requestId: payload.search_metadata?.id,
        results: (payload.organic_results ?? []).map((result) => ({
          url: result.link,
          title: result.title,
          snippet: result.snippet,
          domain: extractDomain(result.link),
        })),
        usage: {
          units: usage.units,
          estimatedCostUsd: usage.amountUsd,
          billingUnit: "serpapi_search",
        },
      };
    },
  };
}

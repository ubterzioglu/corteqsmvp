import { estimateTavilyExtractCost, estimateTavilySearchCost } from "../costs.js";
import { extractDomain } from "../dedupe.js";
import {
  AuthOrConfigError,
  ProviderRateLimitError,
  ProviderTemporaryError,
} from "../errors.js";
import type {
  ExtractOutput,
  ExtractProvider,
  SearchInput,
  SearchOutput,
  SearchProvider,
} from "./types.js";

const TAVILY_BASE_URL = "https://api.tavily.com";
const REQUEST_TIMEOUT_MS = 30_000;

interface TavilySearchResponse {
  results?: Array<{ url: string; title?: string; content?: string; raw_content?: string }>;
  request_id?: string;
}

interface TavilyExtractResponse {
  results?: Array<{ url: string; raw_content?: string; title?: string }>;
  failed_results?: Array<{ url: string; error?: string }>;
}

async function tavilyPost<T>(apiKey: string, path: string, body: Record<string, unknown>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${TAVILY_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error: unknown) {
    throw new ProviderTemporaryError("tavily", error instanceof Error ? error.message : "network error");
  }

  if (response.status === 401 || response.status === 403) {
    throw new AuthOrConfigError("Tavily API anahtarı geçersiz veya yetkisiz");
  }
  if (response.status === 429) {
    throw new ProviderRateLimitError("tavily");
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ProviderTemporaryError("tavily", `HTTP ${response.status}: ${detail.slice(0, 300)}`);
  }
  return (await response.json()) as T;
}

export function createTavilySearchProvider(apiKey: string): SearchProvider {
  return {
    key: "tavily",
    async search(input: SearchInput): Promise<SearchOutput> {
      const depth = input.searchDepth ?? "basic";
      const payload = await tavilyPost<TavilySearchResponse>(apiKey, "/search", {
        query: input.query,
        search_depth: depth,
        max_results: input.maxResults,
        ...input.options,
      });
      const usage = estimateTavilySearchCost(depth);
      return {
        requestId: payload.request_id,
        results: (payload.results ?? []).map((result) => ({
          url: result.url,
          title: result.title,
          snippet: result.content,
          domain: extractDomain(result.url),
        })),
        usage: {
          units: usage.units,
          estimatedCostUsd: usage.amountUsd,
          billingUnit: "tavily_credit",
        },
      };
    },
  };
}

export function createTavilyExtractProvider(apiKey: string): ExtractProvider {
  return {
    key: "tavily",
    async extract(input): Promise<ExtractOutput> {
      const payload = await tavilyPost<TavilyExtractResponse>(apiKey, "/extract", {
        urls: input.urls,
        extract_depth: input.depth,
        ...input.options,
      });
      const docs = (payload.results ?? []).map((result) => ({
        url: result.url,
        title: result.title,
        text: result.raw_content,
      }));
      const usage = estimateTavilyExtractCost(docs.length, input.depth);
      return {
        docs,
        failedUrls: (payload.failed_results ?? []).map((failed) => failed.url),
        usage: {
          units: usage.units,
          estimatedCostUsd: usage.amountUsd,
          billingUnit: "tavily_credit",
        },
      };
    },
  };
}

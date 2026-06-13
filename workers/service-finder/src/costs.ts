/**
 * Sağlayıcı fiyat sabitleri ve maliyet tahmini (scrapper_plan.md §Costs).
 * Tutarlar USD; fiyat değişirse yalnızca bu dosya güncellenir.
 */

export const TAVILY_USD_PER_CREDIT = 0.008;
export const TAVILY_SEARCH_CREDITS: Record<string, number> = {
  basic: 1,
  fast: 1,
  "ultra-fast": 1,
  advanced: 2,
};
/** Tavily Extract: basic = 1 kredi / 5 başarılı URL, advanced = 2 kredi / 5 URL. */
export const TAVILY_EXTRACT_CREDITS_PER_5_URLS: Record<string, number> = {
  basic: 1,
  advanced: 2,
};

/** SerpAPI Developer planı baz alınır ($75 / 5.000 arama). */
export const SERPAPI_USD_PER_SEARCH = 0.015;

export interface GeminiPricing {
  inputUsdPerMTokens: number;
  outputUsdPerMTokens: number;
}

export const GEMINI_PRICING: Record<string, GeminiPricing> = {
  "gemini-2.5-flash-lite": { inputUsdPerMTokens: 0.1, outputUsdPerMTokens: 0.4 },
  "gemini-2.5-flash": { inputUsdPerMTokens: 0.3, outputUsdPerMTokens: 2.5 },
};

const round4 = (value: number): number => Math.round(value * 10_000) / 10_000;

export function estimateTavilySearchCost(searchDepth: string): {
  units: number;
  amountUsd: number;
} {
  const credits = TAVILY_SEARCH_CREDITS[searchDepth] ?? 1;
  return { units: credits, amountUsd: round4(credits * TAVILY_USD_PER_CREDIT) };
}

export function estimateTavilyExtractCost(
  successfulUrlCount: number,
  extractDepth: string,
): { units: number; amountUsd: number } {
  const creditsPer5 = TAVILY_EXTRACT_CREDITS_PER_5_URLS[extractDepth] ?? 1;
  const credits = (successfulUrlCount / 5) * creditsPer5;
  return { units: round4(credits), amountUsd: round4(credits * TAVILY_USD_PER_CREDIT) };
}

export function estimateSerpApiSearchCost(): { units: number; amountUsd: number } {
  return { units: 1, amountUsd: SERPAPI_USD_PER_SEARCH };
}

export function estimateGeminiCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): { amountUsd: number } {
  const pricing = GEMINI_PRICING[model] ?? GEMINI_PRICING["gemini-2.5-flash"];
  const amount =
    (inputTokens / 1_000_000) * pricing.inputUsdPerMTokens +
    (outputTokens / 1_000_000) * pricing.outputUsdPerMTokens;
  return { amountUsd: round4(amount) };
}

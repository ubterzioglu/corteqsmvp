/** Sağlayıcı soyutlamaları (scrapper_plan.md §Provider interfaces). */

export interface SearchResultItem {
  url: string;
  title?: string;
  snippet?: string;
  domain: string;
  language?: string;
  raw?: Record<string, unknown>;
}

export interface SearchUsage {
  units: number;
  estimatedCostUsd: number;
  billingUnit: string;
}

export interface SearchInput {
  query: string;
  locationLabel?: string;
  countryCode?: string;
  languageCode?: string;
  maxResults: number;
  searchDepth?: "basic" | "advanced";
  options?: Record<string, unknown>;
}

export interface SearchOutput {
  requestId?: string;
  results: SearchResultItem[];
  usage: SearchUsage;
  raw?: Record<string, unknown>;
}

export interface SearchProvider {
  readonly key: "tavily" | "serpapi";
  search(input: SearchInput): Promise<SearchOutput>;
}

export interface ExtractedDoc {
  url: string;
  title?: string;
  text?: string;
  markdown?: string;
  metadata?: Record<string, unknown>;
}

export interface ExtractOutput {
  docs: ExtractedDoc[];
  failedUrls: string[];
  usage: SearchUsage;
}

export interface ExtractProvider {
  readonly key: "tavily";
  extract(input: {
    urls: string[];
    query?: string;
    depth: "basic" | "advanced";
    options?: Record<string, unknown>;
  }): Promise<ExtractOutput>;
}

export interface ClassifyUsage {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  model: string;
}

export interface ClassifierProvider {
  readonly key: "gemini";
  classify(input: {
    systemPrompt: string;
    userPrompt: string;
    model?: string;
  }): Promise<{ parsed: unknown; usage: ClassifyUsage }>;
}

import type { RadarNewsAdapter, RadarNewsSource, RawNewsItem } from "../lib/types.ts";
import { validateSourceUrl } from "../lib/source-security.ts";
import { getApiKeyForProvider } from "../lib/provider-config.ts";

type NewsApiResponse = {
  status: string;
  totalResults: number;
  articles: Array<{
    source?: { id?: string; name?: string };
    author?: string;
    title?: string;
    description?: string;
    url?: string;
    urlToImage?: string;
    publishedAt?: string;
    content?: string;
    language?: string;
    country?: string;
  }>;
};

export const newsapiAdapter: RadarNewsAdapter = {
  async fetchItems(source: RadarNewsSource): Promise<RawNewsItem[]> {
    const security = validateSourceUrl(source.endpoint_url);
    if (!security.ok) throw new Error(`SSRF engeli: ${security.reason}`);

    const apiKey = getApiKeyForProvider("newsapi");
    if (!apiKey) throw new Error("NewsAPI API key bulunamadı (NEWSAPI_KEY)");

    const cfg = source.config as Record<string, string>;
    const params = new URLSearchParams({
      q: cfg["query"] ?? "Turkish diaspora",
      language: cfg["language"] ?? source.language ?? "en",
      sortBy: cfg["sortBy"] ?? "publishedAt",
      pageSize: String(Math.min(Number(cfg["pageSize"] ?? 50), source.max_items_per_scan)),
      apiKey,
    });

    if (cfg["country"]) params.set("country", cfg["country"]);
    if (cfg["from"]) params.set("from", cfg["from"]);
    if (cfg["to"]) params.set("to", cfg["to"]);

    const url = `${source.endpoint_url}?${params.toString()}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), source.timeout_ms);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "CorteQS-Radar/1.0 (+https://corteqs.net)",
          "X-Api-Key": apiKey,
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      if (response.status === 429) throw new Error("NewsAPI rate limit aşıldı (429)");
      if (response.status === 401) throw new Error("NewsAPI geçersiz API key (401)");
      throw new Error(`NewsAPI HTTP ${response.status}`);
    }

    const data = (await response.json()) as NewsApiResponse;
    if (data.status !== "ok") {
      throw new Error(`NewsAPI hata: ${data.status}`);
    }

    const items: RawNewsItem[] = [];
    for (const article of data.articles.slice(0, source.max_items_per_scan)) {
      if (!article.url || !article.title) continue;

      items.push({
        title: article.title,
        url: article.url,
        summary: article.description ?? article.content,
        publishedAt: article.publishedAt,
        imageUrl: article.urlToImage ?? undefined,
        language: article.language ?? source.language ?? undefined,
        country: article.country ?? undefined,
        rawPayload: article,
      });
    }

    return items;
  },
};

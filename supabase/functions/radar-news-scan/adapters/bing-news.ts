import type { RadarNewsAdapter, RadarNewsSource, RawNewsItem } from "../lib/types.ts";
import { validateSourceUrl } from "../lib/source-security.ts";
import { getApiKeyForProvider } from "../lib/provider-config.ts";

type BingNewsResponse = {
  _type: string;
  value: Array<{
    name?: string;
    url?: string;
    description?: string;
    datePublished?: string;
    image?: { thumbnail?: { contentUrl?: string } };
    provider?: Array<{ _type?: string; name?: string }>;
    category?: string;
  }>;
};

export const bingNewsAdapter: RadarNewsAdapter = {
  async fetchItems(source: RadarNewsSource): Promise<RawNewsItem[]> {
    const security = validateSourceUrl(source.endpoint_url);
    if (!security.ok) throw new Error(`SSRF engeli: ${security.reason}`);

    const apiKey = getApiKeyForProvider("bing");
    if (!apiKey) throw new Error("Bing News API key bulunamadı (BING_NEWS_KEY)");

    const cfg = source.config as Record<string, string>;
    const params = new URLSearchParams({
      q: cfg["query"] ?? "Turkish diaspora",
      count: String(Math.min(Number(cfg["count"] ?? 50), source.max_items_per_scan)),
      sortBy: cfg["sortBy"] ?? "Date",
      freshness: cfg["freshness"] ?? "Day",
    });

    if (cfg["market"]) params.set("mkt", cfg["market"]);
    if (cfg["language"]) params.set("setLang", cfg["language"]);

    const url = `${source.endpoint_url}?${params.toString()}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), source.timeout_ms);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "CorteQS-Radar/1.0 (+https://corteqs.net)",
          "Ocp-Apim-Subscription-Key": apiKey,
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      if (response.status === 429) throw new Error("Bing News rate limit aşıldı (429)");
      if (response.status === 401) throw new Error("Bing News geçersiz API key (401)");
      throw new Error(`Bing News HTTP ${response.status}`);
    }

    const data = (await response.json()) as BingNewsResponse;

    const items: RawNewsItem[] = [];
    for (const article of data.value.slice(0, source.max_items_per_scan)) {
      if (!article.url || !article.name) continue;

      items.push({
        title: article.name,
        url: article.url,
        summary: article.description,
        publishedAt: article.datePublished,
        imageUrl: article.image?.thumbnail?.contentUrl,
        language: source.language ?? undefined,
        category: article.category,
        rawPayload: article,
      });
    }

    return items;
  },
};

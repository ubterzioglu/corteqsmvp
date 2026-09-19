import type { RadarNewsAdapter, RadarNewsSource, RawNewsItem } from "../lib/types.ts";
import { validateSourceUrl } from "../lib/source-security.ts";
import { getApiKeyForProvider } from "../lib/provider-config.ts";

type TheNewsApiResponse = {
  data: Array<{
    id?: string;
    title?: string;
    description?: string;
    url?: string;
    image_url?: string;
    published_at?: string;
    language?: string;
    source_name?: string;
    source_icon?: string;
    country?: string[];
    category?: string[];
    sentiment?: string;
    sentiment_stats?: Record<string, number>;
  }>;
};

export const thenewsapiAdapter: RadarNewsAdapter = {
  async fetchItems(source: RadarNewsSource): Promise<RawNewsItem[]> {
    const security = validateSourceUrl(source.endpoint_url);
    if (!security.ok) throw new Error(`SSRF engeli: ${security.reason}`);

    const apiKey = getApiKeyForProvider("thenewsapi");
    if (!apiKey) throw new Error("TheNewsAPI API key bulunamadı (THENEWSAPI_KEY)");

    const cfg = source.config as Record<string, string>;
    const params = new URLSearchParams({
      api_token: apiKey,
      search: cfg["query"] ?? "Turkish diaspora",
      language: cfg["language"] ?? source.language ?? "en",
      limit: String(Math.min(Number(cfg["limit"] ?? 50), source.max_items_per_scan)),
      sort: cfg["sort"] ?? "published_at",
    });

    if (cfg["country"]) params.set("location", cfg["country"]);
    if (cfg["categories"]) params.set("categories", cfg["categories"]);
    if (cfg["from"]) params.set("publish_date_start", cfg["from"]);
    if (cfg["to"]) params.set("publish_date_end", cfg["to"]);

    const url = `${source.endpoint_url}?${params.toString()}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), source.timeout_ms);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "CorteQS-Radar/1.0 (+https://corteqs.net)" },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      if (response.status === 429) throw new Error("TheNewsAPI rate limit aşıldı (429)");
      if (response.status === 401) throw new Error("TheNewsAPI geçersiz API key (401)");
      throw new Error(`TheNewsAPI HTTP ${response.status}`);
    }

    const data = (await response.json()) as TheNewsApiResponse;

    const items: RawNewsItem[] = [];
    for (const article of data.data.slice(0, source.max_items_per_scan)) {
      if (!article.url || !article.title) continue;

      items.push({
        title: article.title,
        url: article.url,
        summary: article.description,
        publishedAt: article.published_at,
        imageUrl: article.image_url,
        language: article.language ?? source.language ?? undefined,
        country: article.country?.[0],
        category: article.category?.[0],
        rawPayload: article,
      });
    }

    return items;
  },
};

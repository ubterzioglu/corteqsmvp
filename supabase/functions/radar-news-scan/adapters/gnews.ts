import type { RadarNewsAdapter, RadarNewsSource, RawNewsItem } from "../lib/types.ts";
import { validateSourceUrl } from "../lib/source-security.ts";
import { getApiKeyForProvider } from "../lib/provider-config.ts";

type GNewsResponse = {
  totalArticles: number;
  articles: Array<{
    title?: string;
    description?: string;
    content?: string;
    url?: string;
    image?: string;
    publishedAt?: string;
    source?: { name?: string; url?: string };
    author?: string;
  }>;
};

export const gnewsAdapter: RadarNewsAdapter = {
  async fetchItems(source: RadarNewsSource): Promise<RawNewsItem[]> {
    const security = validateSourceUrl(source.endpoint_url);
    if (!security.ok) throw new Error(`SSRF engeli: ${security.reason}`);

    const apiKey = getApiKeyForProvider("gnews");
    if (!apiKey) throw new Error("GNews API key bulunamadı (GNEWS_KEY)");

    const cfg = source.config as Record<string, string>;
    const params = new URLSearchParams({
      q: cfg["query"] ?? "Turkish diaspora",
      lang: cfg["lang"] ?? source.language ?? "en",
      max: String(Math.min(Number(cfg["max"] ?? 50), source.max_items_per_scan)),
      apikey: apiKey,
    });

    if (cfg["country"]) params.set("country", cfg["country"]);
    if (cfg["from"]) params.set("from", cfg["from"]);
    if (cfg["to"]) params.set("to", cfg["to"]);
    if (cfg["topic"]) params.set("topic", cfg["topic"]);

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
      if (response.status === 429) throw new Error("GNews rate limit aşıldı (429)");
      if (response.status === 401) throw new Error("GNews geçersiz API key (401)");
      throw new Error(`GNews HTTP ${response.status}`);
    }

    const data = (await response.json()) as GNewsResponse;

    const items: RawNewsItem[] = [];
    for (const article of data.articles.slice(0, source.max_items_per_scan)) {
      if (!article.url || !article.title) continue;

      items.push({
        title: article.title,
        url: article.url,
        summary: article.description ?? article.content,
        publishedAt: article.publishedAt,
        imageUrl: article.image ?? undefined,
        language: source.language ?? undefined,
        rawPayload: article,
      });
    }

    return items;
  },
};

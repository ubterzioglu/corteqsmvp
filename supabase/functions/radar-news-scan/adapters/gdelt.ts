import type { RadarNewsAdapter, RadarNewsSource, RawNewsItem } from "../lib/types.ts";
import { validateSourceUrl } from "../lib/source-security.ts";

type GdeltArticle = {
  url?: string;
  title?: string;
  seendatetime?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
  socialimage?: string;
};

type GdeltResponse = {
  articles?: GdeltArticle[];
};

export const gdeltAdapter: RadarNewsAdapter = {
  async fetchItems(source: RadarNewsSource): Promise<RawNewsItem[]> {
    const security = validateSourceUrl(source.endpoint_url);
    if (!security.ok) throw new Error(`SSRF engeli: ${security.reason}`);

    const cfg = source.config as Record<string, string>;
    const params = new URLSearchParams({
      query: cfg["query"] ?? "Turkish diaspora",
      mode: cfg["mode"] ?? "artlist",
      maxrecords: String(Math.min(Number(cfg["maxrecords"] ?? 100), source.max_items_per_scan)),
      format: "json",
      sort: cfg["sort"] ?? "datedesc",
      timespan: cfg["timespan"] ?? "1d",
    });

    const url = `${source.endpoint_url}?${params.toString()}`;

    // GDELT agresif throttle yapar (429) ve bazen bağlantıyı aniden keser.
    // User-Agent zorunlu + 429/ağ hatalarında exponential backoff ile 3 deneme.
    const fetchWithRetry = async (): Promise<Response> => {
      let lastError: unknown;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, attempt * 2000));
        }
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), source.timeout_ms);
        try {
          const res = await fetch(url, {
            signal: controller.signal,
            headers: { "User-Agent": "CorteQS-Radar/1.0 (+https://corteqs.net)" },
          });
          clearTimeout(timer);
          if (res.status === 429) {
            lastError = new Error("GDELT HTTP 429 (rate limit)");
            continue;
          }
          return res;
        } catch (err) {
          clearTimeout(timer);
          lastError = err;
        }
      }
      throw lastError instanceof Error ? lastError : new Error(String(lastError));
    };

    const response = await fetchWithRetry();

    if (!response.ok) {
      throw new Error(`GDELT HTTP ${response.status}`);
    }

    const text = await response.text();
    if (text.length > 2 * 1024 * 1024) {
      throw new Error("GDELT yanıtı 2 MB sınırını aştı");
    }

    let parsed: GdeltResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("GDELT yanıtı JSON parse edilemedi");
    }

    const articles = parsed.articles ?? [];
    const items: RawNewsItem[] = [];

    for (const article of articles.slice(0, source.max_items_per_scan)) {
      if (!article.url || !article.title) continue;

      items.push({
        title: article.title,
        url: article.url,
        publishedAt: article.seendatetime
          ? `${article.seendatetime.slice(0, 4)}-${article.seendatetime.slice(4, 6)}-${article.seendatetime.slice(6, 8)}T${article.seendatetime.slice(8, 10)}:${article.seendatetime.slice(10, 12)}:00Z`
          : undefined,
        imageUrl: article.socialimage ?? undefined,
        language: article.language ?? source.language ?? undefined,
        country: article.sourcecountry ?? undefined,
        rawPayload: article,
      });
    }

    return items;
  },
};

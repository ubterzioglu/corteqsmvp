import { XMLParser } from "npm:fast-xml-parser@4";
import type { RadarNewsAdapter, RadarNewsSource, RawNewsItem } from "../lib/types.ts";
import { validateSourceUrl } from "../lib/source-security.ts";

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = ["application/rss+xml", "application/xml", "text/xml", "text/html"];

function parseDate(value: unknown): string | undefined {
  if (!value) return undefined;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

function extractText(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    return (String(obj["#text"] ?? obj["_"] ?? "")).trim() || undefined;
  }
  return undefined;
}

function extractImageUrl(item: Record<string, unknown>): string | undefined {
  const enclosure = item["enclosure"] as Record<string, unknown> | undefined;
  if (enclosure) {
    const type = String(enclosure["@_type"] ?? "");
    if (type.startsWith("image/")) return String(enclosure["@_url"] ?? "") || undefined;
  }
  const media = item["media:content"] as Record<string, unknown> | undefined;
  if (media) return String(media["@_url"] ?? "") || undefined;
  return undefined;
}

export const rssAdapter: RadarNewsAdapter = {
  async fetchItems(source: RadarNewsSource): Promise<RawNewsItem[]> {
    const security = validateSourceUrl(source.endpoint_url);
    if (!security.ok) throw new Error(`SSRF engeli: ${security.reason}`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), source.timeout_ms);

    let response: Response;
    try {
      response = await fetch(source.endpoint_url, {
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "CorteQS-Radar/1.0 (+https://corteqs.net)" },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) throw new Error(`RSS HTTP ${response.status}`);

    const contentType = response.headers.get("content-type") ?? "";
    const isAllowed = ALLOWED_CONTENT_TYPES.some((t) => contentType.includes(t));
    if (!isAllowed && !contentType.includes("xml")) {
      throw new Error(`Beklenmeyen Content-Type: ${contentType}`);
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_RESPONSE_BYTES) {
      throw new Error("RSS yanıtı 2 MB sınırını aştı");
    }

    const text = new TextDecoder("utf-8").decode(buffer);
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    let doc: Record<string, unknown>;
    try {
      doc = parser.parse(text) as Record<string, unknown>;
    } catch (e) {
      throw new Error(`RSS XML parse hatası: ${e}`);
    }

    const channel = (doc["rss"] as Record<string, unknown>)?.["channel"] as Record<string, unknown>;
    if (!channel) throw new Error("RSS channel bulunamadı");

    const rawItems = channel["item"];
    const itemList: Record<string, unknown>[] = Array.isArray(rawItems)
      ? rawItems
      : rawItems ? [rawItems as Record<string, unknown>] : [];

    const items: RawNewsItem[] = [];
    for (const raw of itemList.slice(0, source.max_items_per_scan)) {
      const item = raw as Record<string, unknown>;
      const link = extractText(item["link"]);
      const title = extractText(item["title"]);
      if (!link || !title) continue;

      const description = extractText(item["description"]);
      items.push({
        title,
        url: link,
        summary: description,
        publishedAt: parseDate(item["pubDate"]),
        imageUrl: extractImageUrl(item),
        language: source.language ?? undefined,
        rawPayload: raw,
      });
    }

    return items;
  },
};

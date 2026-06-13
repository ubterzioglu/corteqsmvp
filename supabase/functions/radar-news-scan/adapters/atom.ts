import { XMLParser } from "npm:fast-xml-parser@4";
import type { RadarNewsAdapter, RadarNewsSource, RawNewsItem } from "../lib/types.ts";
import { validateSourceUrl } from "../lib/source-security.ts";

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

function parseDate(value: unknown): string | undefined {
  if (!value) return undefined;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

function extractLink(linkField: unknown): string | undefined {
  if (!linkField) return undefined;
  if (typeof linkField === "string") return linkField.trim() || undefined;
  if (Array.isArray(linkField)) {
    for (const l of linkField) {
      const rel = (l as Record<string, string>)["@_rel"];
      if (!rel || rel === "alternate") {
        return (l as Record<string, string>)["@_href"]?.trim() || undefined;
      }
    }
  }
  const obj = linkField as Record<string, string>;
  return obj["@_href"]?.trim() || undefined;
}

function extractText(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  const obj = value as Record<string, unknown>;
  return (String(obj["#text"] ?? obj["_"] ?? "")).trim() || undefined;
}

export const atomAdapter: RadarNewsAdapter = {
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

    if (!response.ok) throw new Error(`Atom HTTP ${response.status}`);

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_RESPONSE_BYTES) throw new Error("Atom yanıtı 2 MB sınırını aştı");

    const text = new TextDecoder("utf-8").decode(buffer);
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    let doc: Record<string, unknown>;
    try {
      doc = parser.parse(text) as Record<string, unknown>;
    } catch (e) {
      throw new Error(`Atom XML parse hatası: ${e}`);
    }

    const feed = doc["feed"] as Record<string, unknown>;
    if (!feed) throw new Error("Atom feed bulunamadı");

    const rawEntries = feed["entry"];
    const entries: Record<string, unknown>[] = Array.isArray(rawEntries)
      ? rawEntries
      : rawEntries ? [rawEntries as Record<string, unknown>] : [];

    const items: RawNewsItem[] = [];
    for (const raw of entries.slice(0, source.max_items_per_scan)) {
      const entry = raw as Record<string, unknown>;
      const link = extractLink(entry["link"]);
      const title = extractText(entry["title"]);
      if (!link || !title) continue;

      const summary = extractText(entry["summary"]) ?? extractText(entry["content"]);
      items.push({
        title,
        url: link,
        summary,
        publishedAt: parseDate(entry["published"] ?? entry["updated"]),
        language: source.language ?? undefined,
        rawPayload: raw,
      });
    }

    return items;
  },
};

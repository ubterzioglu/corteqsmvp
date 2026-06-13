import type { RawNewsItem, NormalizedNewsItem, RadarNewsSource } from "./types.ts";
import { canonicalizeUrl } from "./canonicalize-url.ts";
import { buildCanonicalUrlHash, buildContentHash, normalizeTitle } from "./hash.ts";
import { scoreRelevance } from "./relevance-score.ts";

const MAX_SUMMARY_LENGTH = 600;

function sanitizeHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export async function normalizeItem(
  item: RawNewsItem,
  source: RadarNewsSource,
): Promise<NormalizedNewsItem | null> {
  if (!item.title?.trim() || !item.url?.trim()) return null;

  const canonical = canonicalizeUrl(item.url);
  if (!canonical) return null;

  const title = item.title.trim().slice(0, 500);
  const nt = normalizeTitle(title);
  const summary = item.summary
    ? sanitizeHtml(item.summary).slice(0, MAX_SUMMARY_LENGTH)
    : null;

  const publishedAt = item.publishedAt
    ? new Date(item.publishedAt).toISOString()
    : null;
  if (item.publishedAt && !publishedAt) return null; // invalid date

  const canonicalUrlHash = await buildCanonicalUrlHash(canonical);
  const contentHash = await buildContentHash(nt, source.name, publishedAt);

  const { score, reasons } = scoreRelevance(title, summary, source);

  return {
    sourceId: source.id,
    sourceName: source.name,
    sourceUrl: source.website_url,
    sourceExternalId: item.externalId ?? null,
    originalUrl: item.url,
    canonicalUrl: canonical,
    title,
    normalizedTitle: nt,
    summary,
    imageSourceUrl: item.imageUrl ?? null,
    category: item.category ?? source.category_default ?? null,
    language: item.language ?? source.language ?? null,
    country: item.country ?? source.country ?? null,
    city: item.city ?? null,
    publishedAt,
    relevanceScore: score,
    relevanceReasons: reasons,
    canonicalUrlHash,
    contentHash,
    rawPayload: item.rawPayload,
  };
}

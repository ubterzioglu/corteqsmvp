export type RadarSourceType = "rss" | "atom" | "gdelt" | "json_api";
export type RadarTrustLevel = "official" | "high" | "standard" | "discovery_only";
export type RadarReviewStatus = "pending" | "approved" | "rejected" | "duplicate" | "archived";
export type RadarTriggerType = "cron" | "manual" | "retry";
export type RadarScanStatus = "running" | "completed" | "partial" | "failed";

export type RadarNewsSource = {
  id: string;
  name: string;
  source_type: RadarSourceType;
  adapter_key: string;
  endpoint_url: string;
  website_url: string | null;
  language: string | null;
  country: string | null;
  category_default: string | null;
  query_text: string | null;
  trust_level: RadarTrustLevel;
  is_enabled: boolean;
  allow_public_image_hotlink: boolean;
  terms_checked: boolean;
  max_items_per_scan: number;
  timeout_ms: number;
  config: Record<string, unknown>;
};

export type RawNewsItem = {
  externalId?: string;
  title: string;
  summary?: string;
  url: string;
  imageUrl?: string;
  publishedAt?: string;
  language?: string;
  country?: string;
  city?: string;
  category?: string;
  rawPayload: unknown;
};

export type NormalizedNewsItem = {
  sourceId: string;
  sourceName: string;
  sourceUrl: string | null;
  sourceExternalId: string | null;
  originalUrl: string;
  canonicalUrl: string;
  title: string;
  normalizedTitle: string;
  summary: string | null;
  imageSourceUrl: string | null;
  category: string | null;
  language: string | null;
  country: string | null;
  city: string | null;
  publishedAt: string | null;
  relevanceScore: number;
  relevanceReasons: RelevanceReason[];
  canonicalUrlHash: string;
  contentHash: string;
  rawPayload: unknown;
};

export type RelevanceReason = {
  rule: string;
  value?: string;
  score: number;
};

export type ScanResult = {
  sourceId: string;
  sourceName: string;
  fetched: number;
  inserted: number;
  duplicate: number;
  filtered: number;
  error: string | null;
};

export type ScanSummary = {
  runId: string;
  triggerType: RadarTriggerType;
  status: RadarScanStatus;
  sourceCount: number;
  fetchedCount: number;
  insertedCount: number;
  duplicateCount: number;
  filteredCount: number;
  failedSourceCount: number;
  results: ScanResult[];
  durationMs: number;
};

export interface RadarNewsAdapter {
  fetchItems(source: RadarNewsSource): Promise<RawNewsItem[]>;
}

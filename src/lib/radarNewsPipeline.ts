import { supabase } from "@/integrations/supabase/client";

// Radar tabloları henüz generated types.ts'e yansımadı (B1: types regen bekliyor).
// Types üretildikten sonra `db` doğrudan `supabase` ile değiştirilebilir.
// Tek noktada cast — dosya genelinde dağınık `as any` yerine tipli zincir sağlar.
type PostgrestResult<T> = Promise<{ data: T; error: { message: string; code?: string } | null }>;
interface RadarQueryChain {
  select: (columns?: string) => RadarQueryChain;
  insert: (values: Record<string, unknown>) => RadarQueryChain;
  update: (values: Record<string, unknown>) => RadarQueryChain;
  eq: (column: string, value: unknown) => RadarQueryChain;
  in: (column: string, values: unknown[]) => RadarQueryChain;
  order: (column: string, opts?: { ascending?: boolean }) => RadarQueryChain;
  limit: (count: number) => RadarQueryChain;
  single: () => PostgrestResult<Record<string, unknown>>;
  maybeSingle: () => PostgrestResult<Record<string, unknown> | null>;
  then: <R>(onfulfilled: (value: { data: unknown; error: { message: string; code?: string } | null }) => R) => Promise<R>;
}
type RadarTableClient = { from: (table: string) => RadarQueryChain };
const db = supabase as unknown as RadarTableClient;

// ─── Tipler ───────────────────────────────────────────────────────────────────

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
  terms_checked_at: string | null;
  terms_notes: string | null;
  max_items_per_scan: number;
  timeout_ms: number;
  config: Record<string, unknown>;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type RadarScanRun = {
  id: string;
  trigger_type: RadarTriggerType;
  status: RadarScanStatus;
  started_at: string;
  completed_at: string | null;
  started_by: string | null;
  source_count: number;
  fetched_count: number;
  inserted_count: number;
  duplicate_count: number;
  filtered_count: number;
  failed_source_count: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type RelevanceReason = {
  rule: string;
  value?: string;
  score: number;
};

export type RadarCandidate = {
  id: string;
  source_id: string;
  scan_run_id: string | null;
  source_external_id: string | null;
  source_name: string;
  source_url: string | null;
  original_url: string;
  canonical_url: string;
  title: string;
  normalized_title: string;
  summary: string | null;
  image_source_url: string | null;
  category: string | null;
  language: string | null;
  country: string | null;
  city: string | null;
  published_at: string | null;
  relevance_score: number;
  relevance_reasons: RelevanceReason[];
  canonical_url_hash: string;
  content_hash: string;
  review_status: RadarReviewStatus;
  approved_news_post_id: number | null;
  duplicate_of_candidate_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  raw_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type RadarReviewLog = {
  id: string;
  candidate_id: string;
  action: string;
  actor_user_id: string | null;
  note: string | null;
  before_value: Record<string, unknown> | null;
  after_value: Record<string, unknown> | null;
  created_at: string;
};

export type RadarNewsKeyword = {
  id: string;
  keyword: string;
  language: string;
  category: string | null;
  weight: number;
  is_negative: boolean;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

// ─── Kaynak API ───────────────────────────────────────────────────────────────

export async function listRadarSources(): Promise<RadarNewsSource[]> {
  const { data, error } = await db
    .from("radar_news_sources")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateRadarSource(
  id: string,
  payload: Partial<RadarNewsSource>,
): Promise<RadarNewsSource> {
  const { data, error } = await db
    .from("radar_news_sources")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function createRadarSource(
  payload: Omit<RadarNewsSource, "id" | "created_at" | "updated_at" | "last_success_at" | "last_error_at" | "last_error_message">,
): Promise<RadarNewsSource> {
  const { data, error } = await db
    .from("radar_news_sources")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

// ─── Tarama geçmişi API ───────────────────────────────────────────────────────

export async function listScanRuns(limit = 50): Promise<RadarScanRun[]> {
  const { data, error } = await db
    .from("radar_news_scan_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// ─── Aday haber API ───────────────────────────────────────────────────────────

export async function listCandidates(
  status: RadarReviewStatus | "all" = "pending",
  limit = 100,
): Promise<RadarCandidate[]> {
  let query = db
    .from("radar_news_candidates")
    .select("*")
    .order("relevance_score", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (status !== "all") {
    query = query.eq("review_status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function approveCandidate(
  candidateId: string,
  opts: {
    publishToMarquee: boolean;
    editedTitle?: string;
    editedSummary?: string;
    editedCategory?: string;
    reviewNote?: string;
  },
): Promise<{ newsPostId: number; marqueeItemId?: string }> {
  const { data: candidate, error: fetchErr } = await db
    .from("radar_news_candidates")
    .select("*")
    .eq("id", candidateId)
    .single();
  if (fetchErr) throw fetchErr;

  // news_posts insert
  const newsPayload = {
    title: opts.editedTitle ?? candidate.title,
    summary: opts.editedSummary ?? candidate.summary,
    source_name: candidate.source_name,
    source_url: candidate.source_url,
    original_url: candidate.original_url,
    image_url: null, // Admin isterse sonradan yükler; harici görsel hotlink kapalı
    category: opts.editedCategory ?? candidate.category,
    city: candidate.city,
    country: candidate.country,
    language: candidate.language,
    published_at: candidate.published_at,
    unique_hash: candidate.content_hash,
    status: "active",
    radar_candidate_id: candidate.id,
    approved_at: new Date().toISOString(),
  };

  const { data: newsPost, error: newsErr } = await db
    .from("news_posts")
    .insert(newsPayload)
    .select("id")
    .single();
  if (newsErr) throw newsErr;

  const newsPostId: number = newsPost.id;

  // Candidate güncelle
  await db
    .from("radar_news_candidates")
    .update({
      review_status: "approved",
      approved_news_post_id: newsPostId,
      reviewed_at: new Date().toISOString(),
      review_note: opts.reviewNote ?? null,
    })
    .eq("id", candidateId);

  // Audit log
  const action = opts.publishToMarquee ? "approve_and_publish" : "approve_to_pool";
  await db
    .from("radar_news_review_logs")
    .insert({
      candidate_id: candidateId,
      action,
      note: opts.reviewNote ?? null,
      after_value: { news_post_id: newsPostId },
    });

  if (!opts.publishToMarquee) {
    return { newsPostId };
  }

  // Marquee'ye aktar — mevcut importNewsPostToMarquee helper'ını çağır
  const { importNewsPostToMarquee } = await import("@/lib/marquee");
  const marqueeItem = await importNewsPostToMarquee(newsPostId);

  return { newsPostId, marqueeItemId: marqueeItem.id };
}

export async function rejectCandidate(
  candidateId: string,
  note?: string,
): Promise<void> {
  await db
    .from("radar_news_candidates")
    .update({
      review_status: "rejected",
      reviewed_at: new Date().toISOString(),
      review_note: note ?? null,
    })
    .eq("id", candidateId);

  await db
    .from("radar_news_review_logs")
    .insert({ candidate_id: candidateId, action: "reject", note: note ?? null });
}

export async function markDuplicate(
  candidateId: string,
  duplicateOfId: string,
  note?: string,
): Promise<void> {
  await db
    .from("radar_news_candidates")
    .update({
      review_status: "duplicate",
      duplicate_of_candidate_id: duplicateOfId,
      reviewed_at: new Date().toISOString(),
      review_note: note ?? null,
    })
    .eq("id", candidateId);

  await db
    .from("radar_news_review_logs")
    .insert({
      candidate_id: candidateId,
      action: "mark_duplicate",
      note: note ?? null,
      after_value: { duplicate_of: duplicateOfId },
    });
}

// ─── Manuel tarama tetikleme ──────────────────────────────────────────────────

export async function triggerManualScan(opts?: {
  sourceIds?: string[];
  dryRun?: boolean;
}): Promise<Record<string, unknown>> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Oturum gerekli");

  const response = await fetch(`${supabaseUrl}/functions/v1/radar-news-scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      triggerType: "manual",
      sourceIds: opts?.sourceIds ?? [],
      dryRun: opts?.dryRun ?? false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Tarama başlatılamadı: ${err}`);
  }

  return response.json();
}

// ─── Keyword API ──────────────────────────────────────────────────────────────

export async function listRadarKeywords(): Promise<RadarNewsKeyword[]> {
  const { data, error } = await db
    .from("radar_news_keywords")
    .select("*")
    .order("language")
    .order("keyword");
  if (error) throw error;
  return data ?? [];
}

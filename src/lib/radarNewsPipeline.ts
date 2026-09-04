import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// Radar tabloları artık generated types.ts'te tanımlı, bu yüzden eski
// `supabase as unknown as RadarTableClient` köprüsü kaldırıldı (dosyanın kendi
// notu da "types üretildikten sonra doğrudan supabase kullanılabilir" diyordu).
// Köprünün `from: (table: string) => …` imzası tablo adını kaybediyor ve satır
// tipini `Record<string, unknown>`'a düşürüyordu.
const db = supabase;

// ─── Tipler ───────────────────────────────────────────────────────────────────

export type RadarSourceType = "rss" | "atom" | "gdelt" | "json_api";
export type RadarTrustLevel = "official" | "high" | "standard" | "discovery_only";
export type RadarReviewStatus = "pending" | "approved" | "rejected" | "duplicate" | "archived";
export type RadarTriggerType = "cron" | "manual" | "retry";
export type RadarScanStatus = "running" | "completed" | "partial" | "failed";

// Satır tipleri ÜRETİLEN şemadan türetilir; elle kopyalanmaz. Daha önce elle
// yazılmışlardı ve canlı şemayla sessizce ayrışmışlardı (köprü kaldırılınca 7
// gerçek uyuşmazlık ortaya çıktı). Kolon eklenince/çıkınca burası kendiliğinden
// takip eder. Yukarıdaki dar union'lar (RadarReviewStatus vb.) filtre/seçim
// değeri olarak kullanılmaya devam eder — DB kolonu serbest `text` olduğu için
// satır tipine gömülmezler.
export type RadarNewsSource = Tables<"radar_news_sources">;
export type RadarScanRun = Tables<"radar_news_scan_runs">;
export type RadarCandidate = Tables<"radar_news_candidates">;
export type RadarReviewLog = Tables<"radar_news_review_logs">;
export type RadarNewsKeyword = Tables<"radar_news_keywords">;

export type RelevanceReason = {
  rule: string;
  value?: string;
  score: number;
};

/**
 * `relevance_reasons` kolonu jsonb'dir; şeması DB tarafından garanti EDİLMEZ.
 * Okuma sınırında doğrula — bozuk/eski bir satır kartı çökertmek yerine boş
 * listeye düşsün.
 */
export function toRelevanceReasons(value: unknown): RelevanceReason[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is RelevanceReason =>
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as RelevanceReason).rule === "string" &&
      typeof (entry as RelevanceReason).score === "number",
  );
}

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

// pick_fallback_image RPC artık generated types.ts'te; eski FallbackImageRpcClient
// cast'i kaldırıldı. Havuz boşsa veya çağrı başarısız olursa sessizce null döner —
// mevcut "görselsiz haber" davranışını bozmaz.
async function pickFallbackImageUrl(category: "news_diaspora" | "mekan"): Promise<string | null> {
  const { data, error } = await supabase.rpc("pick_fallback_image", { p_category: category });
  if (error) {
    console.error("pick_fallback_image başarısız:", error.message);
    return null;
  }
  return data?.[0]?.public_url ?? null;
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

  // Harici görsel hotlink kapalı; onay anında fallback havuzundan kalıcı bir
  // diaspora görseli atanır. Havuz boşsa (henüz seed edilmemişse) null kalır.
  const fallbackImageUrl = await pickFallbackImageUrl("news_diaspora");

  // news_posts insert
  const newsPayload = {
    title: opts.editedTitle ?? candidate.title,
    summary: opts.editedSummary ?? candidate.summary,
    source_name: candidate.source_name,
    source_url: candidate.source_url,
    original_url: candidate.original_url,
    image_url: fallbackImageUrl,
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

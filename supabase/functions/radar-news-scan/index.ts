import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { gdeltAdapter } from "./adapters/gdelt.ts";
import { rssAdapter } from "./adapters/rss.ts";
import { atomAdapter } from "./adapters/atom.ts";
import { normalizeItem } from "./lib/normalize-item.ts";
import { checkDuplicate } from "./lib/dedupe.ts";
import { acquireScanLock, closeScanRun, openScanRun } from "./lib/scan-lock.ts";
import type { RadarNewsAdapter, RadarNewsSource, ScanResult, ScanSummary } from "./lib/types.ts";

const ADAPTERS: Record<string, RadarNewsAdapter> = {
  gdelt_doc_v2: gdeltAdapter,
  rss: rssAdapter,
  atom: atomAdapter,
};

const MIN_SCORE_TO_QUEUE = 20;

Deno.serve(async (req: Request): Promise<Response> => {
  const startMs = Date.now();

  // ── Yetki kontrolü ──
  const authHeader = req.headers.get("Authorization") ?? "";
  const cronSecret = Deno.env.get("RADAR_NEWS_CRON_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Sunucu yapılandırma hatası" }, 500);
  }

  let triggerType: "cron" | "manual" = "manual";
  let callerUserId: string | null = null;

  // Cron secret ile gelen istek
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    triggerType = "cron";
  } else {
    // Admin JWT ile gelen istek
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return json({ error: "Yetkisiz erişim" }, 401);
    }

    // is_admin kontrolü
    const { data: isAdmin } = await userClient.rpc("is_admin", { uid: user.id });
    if (!isAdmin) {
      return json({ error: "Admin yetkisi gerekli" }, 403);
    }
    callerUserId = user.id;
    triggerType = "manual";
  }

  // ── İstek gövdesi ──
  let body: { triggerType?: string; sourceIds?: string[]; dryRun?: boolean } = {};
  try {
    body = await req.json();
  } catch { /* body opsiyonel */ }

  const dryRun = body.dryRun === true;
  const filterSourceIds: string[] | null = body.sourceIds?.length ? body.sourceIds : null;

  // ── Service role client ──
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── Scan lock ──
  const canRun = await acquireScanLock(supabase);
  if (!canRun) {
    return json({ error: "Zaten çalışan bir tarama var" }, 409);
  }

  // ── Scan run aç ──
  const runId = dryRun ? "dry-run" : await openScanRun(supabase, triggerType, callerUserId);

  // ── Kaynakları yükle ──
  let sourcesQuery = supabase
    .from("radar_news_sources")
    .select("*")
    .eq("is_enabled", true)
    .eq("terms_checked", true);

  if (filterSourceIds) {
    sourcesQuery = sourcesQuery.in("id", filterSourceIds);
  }

  const { data: sources, error: sourcesError } = await sourcesQuery;
  if (sourcesError) {
    if (!dryRun) await closeScanRun(supabase, runId, "failed", {
      source_count: 0, fetched_count: 0, inserted_count: 0,
      duplicate_count: 0, filtered_count: 0, failed_source_count: 0,
      error_message: sourcesError.message,
    });
    return json({ error: sourcesError.message }, 500);
  }

  const results: ScanResult[] = [];
  let totalFetched = 0;
  let totalInserted = 0;
  let totalDuplicate = 0;
  let totalFiltered = 0;
  let failedSources = 0;

  // ── Her kaynak için tarama ──
  for (const source of (sources ?? []) as RadarNewsSource[]) {
    const adapter = ADAPTERS[source.adapter_key];
    if (!adapter) {
      results.push({ sourceId: source.id, sourceName: source.name, fetched: 0, inserted: 0, duplicate: 0, filtered: 0, error: `Adapter bulunamadı: ${source.adapter_key}` });
      failedSources++;
      continue;
    }

    let fetched = 0;
    let inserted = 0;
    let duplicate = 0;
    let filtered = 0;
    let sourceError: string | null = null;

    try {
      const rawItems = await adapter.fetchItems(source);
      fetched = rawItems.length;
      totalFetched += fetched;

      for (const raw of rawItems) {
        const normalized = await normalizeItem(raw, source);
        if (!normalized) { filtered++; continue; }

        if (normalized.relevanceScore < MIN_SCORE_TO_QUEUE) {
          filtered++;
          if (!dryRun) {
            // Arşive yaz (tuning için 2 hafta sakla)
            await supabase.from("radar_news_candidates").insert({
              source_id: source.id,
              scan_run_id: runId,
              source_external_id: normalized.sourceExternalId,
              source_name: normalized.sourceName,
              source_url: normalized.sourceUrl,
              original_url: normalized.originalUrl,
              canonical_url: normalized.canonicalUrl,
              title: normalized.title,
              normalized_title: normalized.normalizedTitle,
              summary: normalized.summary,
              image_source_url: normalized.imageSourceUrl,
              category: normalized.category,
              language: normalized.language,
              country: normalized.country,
              city: normalized.city,
              published_at: normalized.publishedAt,
              relevance_score: normalized.relevanceScore,
              relevance_reasons: normalized.relevanceReasons,
              canonical_url_hash: normalized.canonicalUrlHash,
              content_hash: normalized.contentHash,
              review_status: "archived",
              raw_payload: normalized.rawPayload,
            }).maybeSingle();
          }
          continue;
        }

        const dupeCheck = await checkDuplicate(supabase, normalized);
        if (dupeCheck.isDupe) {
          duplicate++;
          continue;
        }

        if (!dryRun) {
          const { error: insertError } = await supabase.from("radar_news_candidates").insert({
            source_id: source.id,
            scan_run_id: runId,
            source_external_id: normalized.sourceExternalId,
            source_name: normalized.sourceName,
            source_url: normalized.sourceUrl,
            original_url: normalized.originalUrl,
            canonical_url: normalized.canonicalUrl,
            title: normalized.title,
            normalized_title: normalized.normalizedTitle,
            summary: normalized.summary,
            image_source_url: normalized.imageSourceUrl,
            category: normalized.category,
            language: normalized.language,
            country: normalized.country,
            city: normalized.city,
            published_at: normalized.publishedAt,
            relevance_score: normalized.relevanceScore,
            relevance_reasons: normalized.relevanceReasons,
            canonical_url_hash: normalized.canonicalUrlHash,
            content_hash: normalized.contentHash,
            review_status: "pending",
            raw_payload: normalized.rawPayload,
          });

          if (!insertError) {
            inserted++;
          } else if (insertError.code === "23505") {
            // unique constraint — duplicate
            duplicate++;
          } else {
            filtered++;
          }
        } else {
          inserted++; // dry-run'da sayıyoruz ama yazmıyoruz
        }
      }

      // Kaynak son başarı zamanını güncelle
      if (!dryRun) {
        await supabase.from("radar_news_sources")
          .update({ last_success_at: new Date().toISOString(), last_error_message: null })
          .eq("id", source.id);
      }
    } catch (err) {
      sourceError = err instanceof Error ? err.message : String(err);
      failedSources++;
      if (!dryRun) {
        await supabase.from("radar_news_sources")
          .update({ last_error_at: new Date().toISOString(), last_error_message: sourceError })
          .eq("id", source.id);
      }
    }

    results.push({ sourceId: source.id, sourceName: source.name, fetched, inserted, duplicate, filtered, error: sourceError });
    totalInserted += inserted;
    totalDuplicate += duplicate;
    totalFiltered += filtered;
  }

  const durationMs = Date.now() - startMs;
  const finalStatus = failedSources === (sources?.length ?? 0)
    ? "failed"
    : failedSources > 0
    ? "partial"
    : "completed";

  if (!dryRun) {
    await closeScanRun(supabase, runId, finalStatus, {
      source_count: sources?.length ?? 0,
      fetched_count: totalFetched,
      inserted_count: totalInserted,
      duplicate_count: totalDuplicate,
      filtered_count: totalFiltered,
      failed_source_count: failedSources,
    });
  }

  const summary: ScanSummary = {
    runId,
    triggerType,
    status: finalStatus,
    sourceCount: sources?.length ?? 0,
    fetchedCount: totalFetched,
    insertedCount: totalInserted,
    duplicateCount: totalDuplicate,
    filteredCount: totalFiltered,
    failedSourceCount: failedSources,
    results,
    durationMs,
  };

  return json(summary, 200);
});

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

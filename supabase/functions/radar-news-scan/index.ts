import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";
import { gdeltAdapter } from "./adapters/gdelt.ts";
import { rssAdapter } from "./adapters/rss.ts";
import { atomAdapter } from "./adapters/atom.ts";
import { newsapiAdapter } from "./adapters/newsapi.ts";
import { gnewsAdapter } from "./adapters/gnews.ts";
import { bingNewsAdapter } from "./adapters/bing-news.ts";
import { thenewsapiAdapter } from "./adapters/thenewsapi.ts";
import { normalizeItem } from "./lib/normalize-item.ts";
import { checkDuplicate } from "./lib/dedupe.ts";
import { acquireScanLock, closeScanRun, openScanRun } from "./lib/scan-lock.ts";
import { getEnabledProviders, getRotationStrategy } from "./lib/provider-config.ts";
import type { ScoringKeyword } from "./lib/relevance-score.ts";
import type { RadarNewsAdapter, RadarNewsSource, ScanResult, ScanSummary } from "./lib/types.ts";

const ADAPTERS: Record<string, RadarNewsAdapter> = {
  gdelt_doc_v2: gdeltAdapter,
  rss: rssAdapter,
  atom: atomAdapter,
  newsapi: newsapiAdapter,
  gnews: gnewsAdapter,
  bing_news: bingNewsAdapter,
  thenewsapi: thenewsapiAdapter,
};

// Bu eşiğin ALTINDA kalan haberler doğrudan "archived" statüsüyle kaydedilir
// (kuyruğa/pending'e gelmez). Varsayılan 0 = arşive-atma KAPALI: taranan her
// haber önce kuyruğa düşer, eleme/onay admin'e bırakılır. Kalite filtresini
// yeniden açmak için RADAR_NEWS_MIN_SCORE secret'ını (örn. 20) ayarla — kod
// deploy etmeden ayarlanabilsin diye ENV'den okunur.
const MIN_SCORE_TO_QUEUE = (() => {
  const raw = Deno.env.get("RADAR_NEWS_MIN_SCORE");
  const parsed = raw != null ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
})();

const ALLOWED_ORIGINS = [
  "https://corteqs.net",
  "https://www.corteqs.net",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  const startMs = Date.now();
  const corsHeaders = getCorsHeaders(req);

  // ── CORS preflight ──
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // CORS header'larını her yanıta ekleyen request-scope yardımcısı
  const json = (data: unknown, status: number): Response =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

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

  // ── Provider rotation: hangi sağlayıcıları kullanacağımızı seç ──
  const enabledProviders = getEnabledProviders();
  const rotationStrategy = getRotationStrategy();
  
  // Kaynakları provider'a göre grupla (adapter_key üzerinden)
  const sourcesByProvider = new Map<string, RadarNewsSource[]>();
  for (const source of (sources ?? []) as RadarNewsSource[]) {
    const provider = enabledProviders.find((p) => p.adapterKey === source.adapter_key);
    if (provider) {
      const existing = sourcesByProvider.get(provider.key) ?? [];
      existing.push(source);
      sourcesByProvider.set(provider.key, existing);
    }
  }

  // Rotasyon stratejisine göre bu taramada kullanılacak provider'ları seç
  let selectedSources: RadarNewsSource[] = [];
  
  if (rotationStrategy === "fallback") {
    // Fallback: tüm enabled provider'ları kullan, sırayla dene
    for (const provider of enabledProviders) {
      const providerSources = sourcesByProvider.get(provider.key) ?? [];
      selectedSources.push(...providerSources);
    }
  } else if (rotationStrategy === "round-robin") {
    // Round-robin: scanIndex'e göre tek provider seç
    const scanIndex = Math.floor(Date.now() / 3_600_000); // Her saat değişir
    const selectedProvider = enabledProviders[scanIndex % enabledProviders.length];
    if (selectedProvider) {
      selectedSources = sourcesByProvider.get(selectedProvider.key) ?? [];
    }
  } else if (rotationStrategy === "scheduled") {
    // Scheduled: gün bazlı provider seçimi
    const dayOfWeek = new Date().getDay();
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const scheduleRaw = Deno.env.get("RADAR_PROVIDER_SCHEDULE");
    
    if (scheduleRaw) {
      try {
        const schedule = JSON.parse(scheduleRaw) as Record<string, string>;
        const providerKey = schedule[dayNames[dayOfWeek]];
        if (providerKey) {
          selectedSources = sourcesByProvider.get(providerKey) ?? [];
        }
      } catch { /* fallback to all */ }
    }
    
    // Schedule yoksa veya parse hatasıysa tüm provider'ları kullan
    if (selectedSources.length === 0) {
      for (const provider of enabledProviders) {
        const providerSources = sourcesByProvider.get(provider.key) ?? [];
        selectedSources.push(...providerSources);
      }
    }
  } else if (rotationStrategy === "weighted") {
    // Weighted: ağırlıklı rastgele seçim
    const weightsRaw = Deno.env.get("RADAR_PROVIDER_WEIGHTS");
    if (weightsRaw) {
      try {
        const weights = JSON.parse(weightsRaw) as Record<string, number>;
        const totalWeight = enabledProviders.reduce((sum, p) => sum + (weights[p.key] ?? 1), 0);
        let random = Math.random() * totalWeight;
        
        for (const provider of enabledProviders) {
          random -= weights[provider.key] ?? 1;
          if (random <= 0) {
            selectedSources = sourcesByProvider.get(provider.key) ?? [];
            break;
          }
        }
      } catch { /* fallback to all */ }
    }
    
    // Weights yoksa veya parse hatasıysa tüm provider'ları kullan
    if (selectedSources.length === 0) {
      for (const provider of enabledProviders) {
        const providerSources = sourcesByProvider.get(provider.key) ?? [];
        selectedSources.push(...providerSources);
      }
    }
  } else {
    // Default: tüm enabled provider'ları kullan
    for (const provider of enabledProviders) {
      const providerSources = sourcesByProvider.get(provider.key) ?? [];
      selectedSources.push(...providerSources);
    }
  }

  // Eğer provider rotation hiç kaynak döndürmediyse, tüm DB kaynaklarını kullan (geriye uyumluluk)
  if (selectedSources.length === 0) {
    selectedSources = (sources ?? []) as RadarNewsSource[];
  }

  // ── Skorlama keyword'lerini yükle (admin DB'den yönetir) ──
  // Tablo boşsa boş dizi döner; scoreRelevance hardcode fallback'e geçer.
  const { data: keywordRows } = await supabase
    .from("radar_news_keywords")
    .select("keyword, category, weight, is_negative")
    .eq("is_enabled", true);

  const dbKeywords: ScoringKeyword[] = (keywordRows ?? []).map((k) => ({
    keyword: k.keyword as string,
    category: (k.category as string | null) ?? null,
    weight: Number(k.weight ?? 0),
    isNegative: k.is_negative === true,
  }));

  const results: ScanResult[] = [];
  let totalFetched = 0;
  let totalInserted = 0;
  let totalDuplicate = 0;
  let totalFiltered = 0;
  let failedSources = 0;

  // ── Her kaynak için tarama ──
  const sourceList = selectedSources;
  for (let sourceIndex = 0; sourceIndex < sourceList.length; sourceIndex++) {
    const source = sourceList[sourceIndex];
    // Kaynaklar arası gecikme — aynı sağlayıcı (ör. GDELT) paylaşımlı
    // egress IP'sini art arda sorgularda rate-limit (429) eder. İlk kaynak
    // hariç bekle; GDELT pratikte ~5sn'de bir istek tolere eder.
    if (sourceIndex > 0) {
      await new Promise((r) => setTimeout(r, 6000));
    }
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
        const normalized = await normalizeItem(raw, source, dbKeywords);
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
  const finalStatus = failedSources === sourceList.length
    ? "failed"
    : failedSources > 0
    ? "partial"
    : "completed";

  if (!dryRun) {
    await closeScanRun(supabase, runId, finalStatus, {
      source_count: sourceList.length,
      fetched_count: totalFetched,
      inserted_count: totalInserted,
      duplicate_count: totalDuplicate,
      filtered_count: totalFiltered,
      failed_source_count: failedSources,
    });

    // ── Radar tarama özeti mail kuyruğuna ekle ────────────────────────────
    // Günlük özet (18:00 Europe/Berlin) olarak TÜM adminlere gönderilir.
    // Top 10 haberi çek (en yüksek relevance score'a göre)
    const { data: topItems } = await supabase
      .from("radar_news_candidates")
      .select("title, original_url, source_name, relevance_score")
      .eq("scan_run_id", runId)
      .eq("review_status", "pending")
      .order("relevance_score", { ascending: false })
      .limit(10);

    const digestPayload = {
      scan_run_id: runId,
      total_fetched: totalFetched,
      total_inserted: totalInserted,
      total_duplicate: totalDuplicate,
      total_filtered: totalFiltered,
      top_items: (topItems ?? []).map((item) => ({
        title: item.title,
        url: item.original_url,
        source_name: item.source_name,
        relevance_score: item.relevance_score,
      })),
      scan_completed_at: new Date().toISOString(),
    };

    await supabase.from("notification_email_outbox").insert({
      event_type: "radar_scan_digest",
      dedupe_key: `radar_scan_${runId}`,
      payload: digestPayload,
      deliver_after: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 saat sonra (günlük özet)
    });
  }

  const summary: ScanSummary = {
    runId,
    triggerType,
    status: finalStatus,
    sourceCount: sourceList.length,
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

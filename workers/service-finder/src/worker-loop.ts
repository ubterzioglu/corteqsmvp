import {
  appendEvent,
  claimJobs,
  completeJob,
  countCandidates,
  failJob,
  heartbeat,
  insertDiscoveredSources,
  insertQuery,
  loadProviderConfigs,
  loadSourcesByStatus,
  loadTemplate,
  recordCost,
  updateSource,
  upsertCandidate,
  type CostTotals,
  type Db,
} from "./db.js";
import { extractDomain, makeDuplicateKey, normalizeUrl } from "./dedupe.js";
import { resolveSecret, type WorkerEnv } from "./env.js";
import {
  AuthOrConfigError,
  BudgetExceededError,
  LeaseLostError,
  errorCode,
  errorMessage,
  isRetryable,
} from "./errors.js";
import { CLASSIFIER_SYSTEM_PROMPT, buildClassifierUserPrompt } from "./prompts.js";
import { createGeminiClassifier } from "./providers/gemini.js";
import { createSerpApiSearchProvider } from "./providers/serpapi.js";
import { createTavilyExtractProvider, createTavilySearchProvider } from "./providers/tavily.js";
import type { SearchProvider } from "./providers/types.js";
import { buildQueries } from "./queries.js";
import { isRobotsAllowed } from "./robots.js";
import { candidateResultSchema, type ProviderConfig, type ServiceFinderJob } from "./schemas.js";

const SOFT_DEGRADE_MODEL = "gemini-2.5-flash-lite";
const MIN_CONFIDENCE_TO_KEEP = 30;
const EXTRACT_BATCH_SIZE = 5;

interface JobRuntime {
  env: WorkerEnv;
  db: Db;
  workerId: string;
  job: ServiceFinderJob;
  providers: Map<string, ProviderConfig>;
  softCapHit: boolean;
}

function providerById(runtime: JobRuntime, providerId: string | null): ProviderConfig | null {
  if (!providerId) return null;
  for (const config of runtime.providers.values()) {
    if (config.id === providerId) return config;
  }
  return null;
}

function providerByKey(runtime: JobRuntime, key: string): ProviderConfig | null {
  return runtime.providers.get(key) ?? null;
}

function applyTotals(runtime: JobRuntime, totals: CostTotals): void {
  if (totals.hard_cap_exceeded) {
    throw new BudgetExceededError(
      `Hard cap aşıldı: $${totals.cost_total_usd} / $${totals.hard_cap_usd}`,
    );
  }
  if (totals.soft_cap_exceeded && !runtime.softCapHit) {
    runtime.softCapHit = true;
    void appendEvent(runtime.db, runtime.job.id, "soft_cap_reached",
      `Soft cap aşıldı ($${totals.cost_total_usd}); ucuz moda geçiliyor.`, { level: "warn" });
  }
}

async function ensureLease(runtime: JobRuntime, progress: Record<string, unknown>): Promise<void> {
  const alive = await heartbeat(runtime.db, runtime.job.id, runtime.workerId, progress);
  if (!alive) throw new LeaseLostError(runtime.job.id);
}

// ---------------------------------------------------------------------------
// Aşama 1: Arama
// ---------------------------------------------------------------------------
async function runSearchStage(runtime: JobRuntime): Promise<void> {
  const { db, env, job } = runtime;
  const template = await loadTemplate(db, job.template_id);
  const queries = buildQueries(job, template);

  const searchConfig =
    providerById(runtime, job.search_provider_id) ?? providerByKey(runtime, "tavily");
  if (!searchConfig || !searchConfig.is_enabled) {
    throw new AuthOrConfigError("Etkin arama sağlayıcısı yok");
  }

  const providers: SearchProvider[] = [];
  if (searchConfig.provider_key === "tavily") {
    providers.push(createTavilySearchProvider(resolveSecret(env, searchConfig.secret_ref)));
  } else if (searchConfig.provider_key === "serpapi") {
    providers.push(
      createSerpApiSearchProvider(
        resolveSecret(env, searchConfig.secret_ref),
        searchConfig.request_defaults,
      ),
    );
  }

  // SerpAPI fallback (soft cap sonrası devre dışı — spec §Budget logic)
  const serpapiConfig = providerByKey(runtime, "serpapi");
  const fallbackEnabled =
    env.SERVICE_FINDER_ENABLE_SERPAPI_FALLBACK &&
    serpapiConfig?.is_enabled === true &&
    searchConfig.provider_key !== "serpapi";

  let discoveredTotal = 0;
  let queryIndex = 0;

  for (const queryText of queries) {
    queryIndex += 1;
    await ensureLease(runtime, { stage: "search", query: queryIndex, of: queries.length });

    const requestDefaults = searchConfig.request_defaults ?? {};
    const baseDepth = typeof requestDefaults["search_depth"] === "string"
      ? (requestDefaults["search_depth"] as "basic" | "advanced")
      : "basic";
    const depth: "basic" | "advanced" = runtime.softCapHit ? "basic" : baseDepth;
    const maxResults = runtime.softCapHit
      ? Math.min(5, Number(requestDefaults["max_results"] ?? 8))
      : Number(requestDefaults["max_results"] ?? 8);

    let searchOutput;
    let usedProvider = providers[0];
    try {
      searchOutput = await usedProvider.search({
        query: queryText,
        locationLabel: job.location_label,
        countryCode: job.country_code ?? undefined,
        languageCode: job.language_code,
        maxResults,
        searchDepth: depth,
      });
    } catch (error: unknown) {
      await insertQuery(db, {
        job_id: job.id,
        stage: "seed",
        provider_key: usedProvider.key,
        query_text: queryText,
        usage_units: 0,
        estimated_cost_usd: 0,
        result_count: 0,
        status: "failed",
        executed_at: new Date().toISOString(),
      });
      if (error instanceof AuthOrConfigError || error instanceof BudgetExceededError) throw error;
      await appendEvent(db, job.id, "search_failed", errorMessage(error), { level: "warn" });
      continue;
    }

    const queryId = await insertQuery(db, {
      job_id: job.id,
      stage: "seed",
      provider_key: usedProvider.key,
      query_text: queryText,
      external_request_id: searchOutput.requestId ?? null,
      usage_units: searchOutput.usage.units,
      estimated_cost_usd: searchOutput.usage.estimatedCostUsd,
      result_count: searchOutput.results.length,
      status: "succeeded",
      executed_at: new Date().toISOString(),
    });

    const totals = await recordCost(db, {
      job_id: job.id,
      provider_key: usedProvider.key,
      provider_config_id: searchConfig.id,
      event_type: "search",
      billing_unit: searchOutput.usage.billingUnit,
      quantity: searchOutput.usage.units,
      unit_cost_usd: searchOutput.usage.units > 0
        ? searchOutput.usage.estimatedCostUsd / searchOutput.usage.units
        : 0,
      amount_usd: searchOutput.usage.estimatedCostUsd,
      query_id: queryId,
      request_meta: { query: queryText, depth },
    });
    applyTotals(runtime, totals);

    // Az sonuçta SerpAPI fallback — geo hassasiyeti için (soft cap'te kapalı)
    if (fallbackEnabled && !runtime.softCapHit && searchOutput.results.length < 3 && serpapiConfig) {
      try {
        const serpProvider = createSerpApiSearchProvider(
          resolveSecret(env, serpapiConfig.secret_ref),
          serpapiConfig.request_defaults,
        );
        const serpOutput = await serpProvider.search({
          query: queryText,
          locationLabel: job.location_label,
          languageCode: job.language_code,
          maxResults,
        });
        const serpQueryId = await insertQuery(db, {
          job_id: job.id,
          stage: "expansion",
          provider_key: "serpapi",
          query_text: queryText,
          external_request_id: serpOutput.requestId ?? null,
          usage_units: serpOutput.usage.units,
          estimated_cost_usd: serpOutput.usage.estimatedCostUsd,
          result_count: serpOutput.results.length,
          status: "succeeded",
          executed_at: new Date().toISOString(),
        });
        const serpTotals = await recordCost(db, {
          job_id: job.id,
          provider_key: "serpapi",
          provider_config_id: serpapiConfig.id,
          event_type: "search",
          billing_unit: serpOutput.usage.billingUnit,
          quantity: serpOutput.usage.units,
          unit_cost_usd: serpOutput.usage.estimatedCostUsd,
          amount_usd: serpOutput.usage.estimatedCostUsd,
          query_id: serpQueryId,
          request_meta: { query: queryText, fallback: true },
        });
        applyTotals(runtime, serpTotals);
        searchOutput.results.push(...serpOutput.results);
        usedProvider = serpProvider;
      } catch (error: unknown) {
        if (error instanceof BudgetExceededError) throw error;
        await appendEvent(db, job.id, "serpapi_fallback_failed", errorMessage(error), { level: "warn" });
      }
    }

    // Keşfedilen URL'leri normalize edip persist et (job başına tekil)
    const remainingBudget = job.max_source_urls - discoveredTotal;
    if (remainingBudget <= 0) break;
    const sources = searchOutput.results
      .filter((result) => /^https?:\/\//i.test(result.url))
      .slice(0, remainingBudget)
      .map((result) => ({
        job_id: job.id,
        discovery_query_id: queryId,
        provider_key: usedProvider.key,
        source_url: result.url,
        normalized_url: normalizeUrl(result.url),
        source_domain: result.domain || extractDomain(result.url),
        source_title: result.title ?? null,
        source_snippet: result.snippet ?? null,
      }));
    discoveredTotal += await insertDiscoveredSources(db, sources);
  }

  await appendEvent(db, job.id, "search_stage_done",
    `${queryIndex} sorgu çalıştı, ${discoveredTotal} kaynak keşfedildi.`);

  // Seed URL'leri arama aşamasından bağımsız olarak doğrudan kaynak kuyruğuna ekle.
  if (job.seed_urls?.length) {
    const validSeedUrls = job.seed_urls.filter((url) => /^https?:\/\//i.test(url));
    if (validSeedUrls.length > 0) {
      const seedSources = validSeedUrls.map((url) => ({
        job_id: job.id,
        discovery_query_id: null as string | null,
        provider_key: "manual",
        source_url: url,
        normalized_url: normalizeUrl(url),
        source_domain: extractDomain(url),
        source_title: null as string | null,
        source_snippet: null as string | null,
      }));
      await insertDiscoveredSources(db, seedSources);
      await appendEvent(db, job.id, "seed_urls_injected",
        `${validSeedUrls.length} ön adres ekstraksiyon kuyruğuna eklendi.`);
    }
  }
}

// ---------------------------------------------------------------------------
// Aşama 2: Ekstraksiyon (robots kontrolü zorunlu)
// ---------------------------------------------------------------------------
async function runExtractStage(runtime: JobRuntime): Promise<void> {
  const { db, env, job } = runtime;
  const extractConfig =
    providerById(runtime, job.extract_provider_id) ?? providerByKey(runtime, "tavily");
  if (!extractConfig || !extractConfig.is_enabled) {
    throw new AuthOrConfigError("Etkin ekstraksiyon sağlayıcısı yok");
  }
  const extractProvider = createTavilyExtractProvider(resolveSecret(env, extractConfig.secret_ref));

  const requestDefaults = extractConfig.request_defaults ?? {};
  const baseDepth = typeof requestDefaults["extract_depth"] === "string"
    ? (requestDefaults["extract_depth"] as "basic" | "advanced")
    : "basic";

  const sources = await loadSourcesByStatus(db, job.id, "discovered", job.max_extract_urls);
  let fetchedCount = 0;

  // Önce robots değerlendirmesi — engellenenler hiç sağlayıcıya gitmez.
  const allowed: typeof sources = [];
  for (const source of sources) {
    const robotsAllowed = await isRobotsAllowed(source.source_url);
    await updateSource(db, source.id, {
      crawl_allowed: robotsAllowed,
      robots_evaluated_at: new Date().toISOString(),
      ...(robotsAllowed ? { fetch_status: "queued" } : { fetch_status: "blocked_robots" }),
    });
    if (robotsAllowed) allowed.push(source);
  }
  if (sources.length > allowed.length) {
    await appendEvent(db, job.id, "robots_blocked",
      `${sources.length - allowed.length} kaynak robots.txt nedeniyle atlandı.`, { level: "info" });
  }

  for (let offset = 0; offset < allowed.length; offset += EXTRACT_BATCH_SIZE) {
    await ensureLease(runtime, { stage: "extract", fetched: fetchedCount, of: allowed.length });
    const depth: "basic" | "advanced" = runtime.softCapHit ? "basic" : baseDepth;
    const batch = allowed.slice(offset, offset + EXTRACT_BATCH_SIZE);

    let output;
    try {
      output = await extractProvider.extract({
        urls: batch.map((source) => source.source_url),
        query: job.freeform_topic ?? job.title,
        depth,
      });
    } catch (error: unknown) {
      if (error instanceof AuthOrConfigError || error instanceof BudgetExceededError) throw error;
      for (const source of batch) {
        await updateSource(db, source.id, { fetch_status: "failed" });
      }
      await appendEvent(db, job.id, "extract_failed", errorMessage(error), { level: "warn" });
      continue;
    }

    const docsByUrl = new Map(output.docs.map((doc) => [normalizeUrl(doc.url), doc]));
    for (const source of batch) {
      const doc = docsByUrl.get(source.normalized_url) ?? docsByUrl.get(normalizeUrl(source.source_url));
      if (doc?.text) {
        await updateSource(db, source.id, {
          fetch_status: "fetched",
          extracted_text: doc.text.slice(0, 60_000),
          fetched_at: new Date().toISOString(),
        });
        fetchedCount += 1;
      } else {
        await updateSource(db, source.id, { fetch_status: "failed" });
      }
    }

    if (output.usage.estimatedCostUsd > 0) {
      const totals = await recordCost(db, {
        job_id: job.id,
        provider_key: "tavily",
        provider_config_id: extractConfig.id,
        event_type: "extract",
        billing_unit: output.usage.billingUnit,
        quantity: output.usage.units,
        unit_cost_usd: output.usage.units > 0
          ? output.usage.estimatedCostUsd / output.usage.units
          : 0,
        amount_usd: output.usage.estimatedCostUsd,
        request_meta: { urls: batch.length, depth },
      });
      applyTotals(runtime, totals);
    }
  }

  await appendEvent(db, job.id, "extract_stage_done", `${fetchedCount} kaynak içeriği alındı.`);
}

// ---------------------------------------------------------------------------
// Aşama 3: Sınıflandırma
// ---------------------------------------------------------------------------
async function runClassifyStage(runtime: JobRuntime): Promise<void> {
  const { db, env, job } = runtime;
  const classifierConfig =
    providerById(runtime, job.classifier_provider_id) ?? providerByKey(runtime, "gemini");
  if (!classifierConfig || !classifierConfig.is_enabled) {
    throw new AuthOrConfigError("Etkin sınıflandırıcı yok");
  }
  const classifier = createGeminiClassifier(resolveSecret(env, classifierConfig.secret_ref));
  const baseModel = classifierConfig.default_model ?? SOFT_DEGRADE_MODEL;

  const sources = await loadSourcesByStatus(db, job.id, "fetched", job.max_extract_urls);
  let candidateCount = await countCandidates(db, job.id);
  let classified = 0;

  for (const source of sources) {
    if (candidateCount >= job.max_candidates) break;
    await ensureLease(runtime, { stage: "classify", classified, of: sources.length });

    const model = runtime.softCapHit ? SOFT_DEGRADE_MODEL : baseModel;
    let classification;
    try {
      classification = await classifier.classify({
        systemPrompt: CLASSIFIER_SYSTEM_PROMPT,
        userPrompt: buildClassifierUserPrompt(job, source),
        model,
      });
    } catch (error: unknown) {
      if (error instanceof AuthOrConfigError || error instanceof BudgetExceededError) throw error;
      await updateSource(db, source.id, { fetch_status: "failed" });
      await appendEvent(db, job.id, "classify_failed", errorMessage(error), { level: "warn" });
      continue;
    }

    const totals = await recordCost(db, {
      job_id: job.id,
      provider_key: "gemini",
      provider_config_id: classifierConfig.id,
      event_type: "classify",
      billing_unit: "tokens",
      quantity: classification.usage.inputTokens + classification.usage.outputTokens,
      unit_cost_usd: 0,
      amount_usd: classification.usage.estimatedCostUsd,
      source_id: source.id,
      model_name: classification.usage.model,
      request_meta: {
        input_tokens: classification.usage.inputTokens,
        output_tokens: classification.usage.outputTokens,
      },
    });

    const validation = candidateResultSchema.safeParse(classification.parsed);
    if (!validation.success) {
      await updateSource(db, source.id, { fetch_status: "failed" });
      await appendEvent(db, job.id, "classifier_validation_failed",
        validation.error.issues.map((issue) => issue.message).join("; ").slice(0, 500),
        { level: "warn", payload: { source_id: source.id } });
      applyTotals(runtime, totals);
      continue;
    }

    const parsed = validation.data;
    classified += 1;

    if (!parsed.is_match || !parsed.canonical_name || parsed.confidence_score < MIN_CONFIDENCE_TO_KEEP) {
      await updateSource(db, source.id, { fetch_status: "irrelevant" });
      applyTotals(runtime, totals);
      continue;
    }

    const duplicateKey = makeDuplicateKey(parsed);
    const candidateId = await upsertCandidate(
      db, job.id, source.id, duplicateKey, parsed, job,
      classification.usage.model, source.source_url,
    );
    if (candidateId) {
      candidateCount += 1;
    } else {
      await updateSource(db, source.id, { fetch_status: "duplicate" });
    }
    applyTotals(runtime, totals);
  }

  await appendEvent(db, job.id, "classify_stage_done",
    `${classified} kaynak sınıflandırıldı; toplam ${candidateCount} aday.`);
}

// ---------------------------------------------------------------------------
// İş yürütücü
// ---------------------------------------------------------------------------
export async function processJob(
  env: WorkerEnv,
  db: Db,
  workerId: string,
  job: ServiceFinderJob,
): Promise<void> {
  const providerList = await loadProviderConfigs(db);
  const runtime: JobRuntime = {
    env,
    db,
    workerId,
    job,
    providers: new Map(providerList.map((config) => [config.provider_key, config])),
    softCapHit: Number(job.cost_total_usd) >= Number(job.soft_cap_usd),
  };

  try {
    await appendEvent(db, job.id, "job_started", `Worker ${workerId} işi aldı (deneme ${job.attempts}).`);
    await runSearchStage(runtime);
    await runExtractStage(runtime);
    await runClassifyStage(runtime);

    const candidates = await countCandidates(db, job.id);
    await completeJob(db, job.id, workerId, "review", {
      candidates,
      finished_by: workerId,
    });
    await appendEvent(db, job.id, "job_review_ready", `İş incelemeye hazır: ${candidates} aday.`);
  } catch (error: unknown) {
    if (error instanceof BudgetExceededError) {
      await completeJob(db, job.id, workerId, "budget_stopped", { reason: error.message });
      await appendEvent(db, job.id, "budget_stopped", error.message, { level: "warn" });
      return;
    }
    if (error instanceof LeaseLostError) {
      console.error(`Lease kaybedildi, iş bırakılıyor: ${job.id}`);
      return;
    }
    const retryable = isRetryable(error);
    const delay = error instanceof Object && "retryAfterSeconds" in error
      ? Number((error as { retryAfterSeconds?: number }).retryAfterSeconds ?? 60)
      : 60;
    await failJob(db, job.id, workerId, errorCode(error), errorMessage(error), retryable, delay);
  }
}

export async function runWorkerLoop(env: WorkerEnv, db: Db): Promise<never> {
  const workerId = env.SERVICE_FINDER_WORKER_ID;
  console.log(`Service Finder worker başladı: ${workerId}`);

  for (;;) {
    let jobs: ServiceFinderJob[] = [];
    try {
      jobs = await claimJobs(db, workerId, 2);
    } catch (error: unknown) {
      console.error(`Kuyruk claim hatası: ${errorMessage(error)}`);
    }

    if (jobs.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, env.SERVICE_FINDER_POLL_MS));
      continue;
    }

    for (const job of jobs) {
      console.log(`İş işleniyor: ${job.id} (${job.title})`);
      await processJob(env, db, workerId, job);
    }
  }
}

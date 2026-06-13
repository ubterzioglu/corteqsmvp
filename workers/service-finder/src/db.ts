import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { WorkerEnv } from "./env.js";
import type {
  CandidateResult,
  JobSourceRow,
  ProfessionTemplate,
  ProviderConfig,
  ServiceFinderJob,
} from "./schemas.js";

/**
 * Worker DB katmanı. Durum geçişleri worker_* RPC'leri üzerinden (atomik),
 * sorgu/kaynak/aday satır yazımları service_role ile doğrudan tabloya yapılır.
 */

export type Db = SupabaseClient;

export function createDb(env: WorkerEnv): Db {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function unwrap<T>(result: { data: T | null; error: { message: string } | null }, context: string): T {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }
  if (result.data === null) {
    throw new Error(`${context}: boş yanıt`);
  }
  return result.data;
}

export async function claimJobs(db: Db, workerId: string, limit: number): Promise<ServiceFinderJob[]> {
  const result = await db.rpc("worker_claim_service_finder_jobs", {
    p_worker_id: workerId,
    p_limit: limit,
  });
  if (result.error) throw new Error(`claimJobs: ${result.error.message}`);
  return (result.data ?? []) as ServiceFinderJob[];
}

export async function heartbeat(
  db: Db,
  jobId: string,
  workerId: string,
  progress: Record<string, unknown> | null,
): Promise<boolean> {
  const result = await db.rpc("worker_heartbeat_service_finder_job", {
    p_job_id: jobId,
    p_worker_id: workerId,
    p_progress: progress,
  });
  if (result.error) throw new Error(`heartbeat: ${result.error.message}`);
  return result.data === true;
}

export async function appendEvent(
  db: Db,
  jobId: string,
  eventType: string,
  message: string,
  options: { level?: string; candidateId?: string; payload?: Record<string, unknown> } = {},
): Promise<void> {
  const result = await db.rpc("worker_append_service_finder_event", {
    p_job_id: jobId,
    p_event_type: eventType,
    p_message: message,
    p_event_level: options.level ?? "info",
    p_candidate_id: options.candidateId ?? null,
    p_event_payload: options.payload ?? {},
  });
  if (result.error) {
    // Olay yazımı kritik değil — işleme devam, konsola not düş.
    console.error(`appendEvent başarısız (${eventType}): ${result.error.message}`);
  }
}

export interface CostTotals {
  cost_total_usd: number;
  soft_cap_usd: number;
  hard_cap_usd: number;
  soft_cap_exceeded: boolean;
  hard_cap_exceeded: boolean;
}

export async function recordCost(
  db: Db,
  payload: {
    job_id: string;
    provider_key: string;
    provider_config_id?: string | null;
    event_type: "search" | "extract" | "classify" | "grounding" | "manual_adjustment";
    billing_unit: string;
    quantity: number;
    unit_cost_usd: number;
    amount_usd: number;
    model_name?: string | null;
    query_id?: string | null;
    source_id?: string | null;
    candidate_id?: string | null;
    request_meta?: Record<string, unknown>;
  },
): Promise<CostTotals> {
  const result = await db.rpc("worker_record_service_finder_cost", { p_payload: payload });
  return unwrap(result, "recordCost") as CostTotals;
}

export async function completeJob(
  db: Db,
  jobId: string,
  workerId: string,
  status: "review" | "completed" | "budget_stopped",
  resultSummary: Record<string, unknown>,
): Promise<boolean> {
  const result = await db.rpc("worker_complete_service_finder_job", {
    p_job_id: jobId,
    p_worker_id: workerId,
    p_status: status,
    p_result_summary: resultSummary,
  });
  if (result.error) throw new Error(`completeJob: ${result.error.message}`);
  return result.data === true;
}

export async function failJob(
  db: Db,
  jobId: string,
  workerId: string,
  errorCode: string,
  errorMessage: string,
  retryable: boolean,
  retryDelaySeconds = 60,
): Promise<void> {
  const result = await db.rpc("worker_fail_service_finder_job", {
    p_job_id: jobId,
    p_worker_id: workerId,
    p_error_code: errorCode,
    p_error_message: errorMessage,
    p_retryable: retryable,
    p_retry_delay_seconds: retryDelaySeconds,
  });
  if (result.error) {
    console.error(`failJob başarısız: ${result.error.message}`);
  }
}

export async function loadProviderConfigs(db: Db): Promise<ProviderConfig[]> {
  const result = await db.from("service_finder_provider_configs").select("*");
  return unwrap(result, "loadProviderConfigs") as ProviderConfig[];
}

export async function loadTemplate(db: Db, templateId: string | null): Promise<ProfessionTemplate | null> {
  if (!templateId) return null;
  const result = await db
    .from("service_finder_profession_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();
  if (result.error) throw new Error(`loadTemplate: ${result.error.message}`);
  return (result.data as ProfessionTemplate | null) ?? null;
}

export interface QueryRecord {
  job_id: string;
  stage: "seed" | "expansion" | "retry";
  provider_key: string;
  query_text: string;
  request_payload?: Record<string, unknown>;
  response_payload?: Record<string, unknown>;
  external_request_id?: string | null;
  usage_units: number;
  estimated_cost_usd: number;
  result_count: number;
  status: "pending" | "succeeded" | "failed" | "skipped";
  executed_at?: string;
}

export async function insertQuery(db: Db, record: QueryRecord): Promise<string> {
  const result = await db
    .from("service_finder_job_queries")
    .upsert(record, { onConflict: "job_id,stage,query_text" })
    .select("id")
    .single();
  return unwrap(result, "insertQuery").id as string;
}

export interface DiscoveredSource {
  job_id: string;
  discovery_query_id: string | null;
  provider_key: string;
  source_url: string;
  normalized_url: string;
  source_domain: string;
  source_title?: string | null;
  source_snippet?: string | null;
}

export async function insertDiscoveredSources(db: Db, sources: DiscoveredSource[]): Promise<number> {
  if (sources.length === 0) return 0;
  const result = await db
    .from("service_finder_job_sources")
    .upsert(sources, { onConflict: "job_id,normalized_url", ignoreDuplicates: true })
    .select("id");
  if (result.error) throw new Error(`insertDiscoveredSources: ${result.error.message}`);
  return (result.data ?? []).length;
}

export async function countSources(db: Db, jobId: string): Promise<number> {
  const result = await db
    .from("service_finder_job_sources")
    .select("id", { count: "exact", head: true })
    .eq("job_id", jobId);
  if (result.error) throw new Error(`countSources: ${result.error.message}`);
  return result.count ?? 0;
}

export async function loadSourcesByStatus(
  db: Db,
  jobId: string,
  fetchStatus: string,
  limit: number,
): Promise<JobSourceRow[]> {
  const result = await db
    .from("service_finder_job_sources")
    .select("id, job_id, source_url, normalized_url, source_domain, source_title, source_snippet, fetch_status, extracted_text")
    .eq("job_id", jobId)
    .eq("fetch_status", fetchStatus)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (result.error) throw new Error(`loadSourcesByStatus: ${result.error.message}`);
  return (result.data ?? []) as JobSourceRow[];
}

export async function updateSource(
  db: Db,
  sourceId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const result = await db.from("service_finder_job_sources").update(patch).eq("id", sourceId);
  if (result.error) throw new Error(`updateSource: ${result.error.message}`);
}

export async function upsertCandidate(
  db: Db,
  jobId: string,
  sourceId: string,
  duplicateKey: string,
  parsed: CandidateResult,
  job: ServiceFinderJob,
  classifierModel: string,
  sourceUrl: string,
): Promise<string | null> {
  const row = {
    job_id: jobId,
    primary_source_id: sourceId,
    canonical_name: parsed.canonical_name ?? "İsimsiz kayıt",
    profession_label: parsed.profession_label,
    organization_name: parsed.organization_name,
    role_key: parsed.role_key ?? job.role_key,
    item_type: parsed.item_type ?? job.item_type,
    category_slug: parsed.category_slug ?? job.category_slug,
    country_code: parsed.country_code ?? job.country_code,
    region: job.region,
    city: parsed.city ?? job.city,
    languages: parsed.languages,
    services: parsed.services,
    contacts: parsed.contacts,
    website_url: parsed.website_url,
    appointment_url: parsed.appointment_url,
    source_urls: [sourceUrl],
    evidence: parsed.evidence_quotes.map((quote) => ({ quote, source_url: sourceUrl })),
    normalized_payload: parsed,
    duplicate_key: duplicateKey,
    confidence_score: parsed.confidence_score,
    classifier_model: classifierModel,
    updated_at: new Date().toISOString(),
  };
  const result = await db
    .from("service_finder_candidates")
    .upsert(row, { onConflict: "job_id,duplicate_key", ignoreDuplicates: true })
    .select("id")
    .maybeSingle();
  if (result.error) throw new Error(`upsertCandidate: ${result.error.message}`);
  return (result.data?.id as string | undefined) ?? null;
}

export async function countCandidates(db: Db, jobId: string): Promise<number> {
  const result = await db
    .from("service_finder_candidates")
    .select("id", { count: "exact", head: true })
    .eq("job_id", jobId);
  if (result.error) throw new Error(`countCandidates: ${result.error.message}`);
  return result.count ?? 0;
}

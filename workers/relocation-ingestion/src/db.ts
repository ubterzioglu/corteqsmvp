import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { WorkerEnv } from "./env.js";
import type { CostRecord, NormalizedCandidate, RelocationJob } from "./types.js";

/**
 * Worker DB katmanı. Durum geçişleri worker_* RPC'leri üzerinden (atomik);
 * worker service_role ile bağlanır (RLS bypass). Service-finder db.ts aynası.
 */
export type Db = SupabaseClient;

export function createDb(env: WorkerEnv): Db {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function claimJobs(db: Db, workerId: string, limit: number): Promise<RelocationJob[]> {
  const result = await db.rpc("worker_claim_relocation_jobs", {
    p_worker_id: workerId,
    p_limit: limit,
  });
  if (result.error) throw new Error(`claimJobs: ${result.error.message}`);
  return (result.data ?? []) as RelocationJob[];
}

export async function heartbeat(
  db: Db,
  jobId: string,
  workerId: string,
  progress: Record<string, unknown> | null,
): Promise<boolean> {
  const result = await db.rpc("worker_heartbeat_relocation_job", {
    p_job_id: jobId,
    p_worker_id: workerId,
    p_progress: progress,
  });
  if (result.error) throw new Error(`heartbeat: ${result.error.message}`);
  return result.data === true;
}

export async function recordCost(db: Db, payload: CostRecord): Promise<number> {
  const result = await db.rpc("worker_record_relocation_cost", { p_payload: payload });
  if (result.error) throw new Error(`recordCost: ${result.error.message}`);
  return Number(result.data ?? 0);
}

export async function upsertCandidate(
  db: Db,
  jobId: string,
  candidate: NormalizedCandidate,
): Promise<string | null> {
  const result = await db.rpc("worker_upsert_relocation_candidate", {
    p_payload: {
      job_id: jobId,
      target_kind: candidate.target_kind,
      duplicate_key: candidate.duplicate_key,
      source_url: candidate.source_url ?? null,
      confidence_score: candidate.confidence_score,
      evidence: candidate.evidence,
      normalized_payload: candidate.payload,
    },
  });
  if (result.error) throw new Error(`upsertCandidate: ${result.error.message}`);
  return (result.data as string | null) ?? null;
}

export async function completeJob(
  db: Db,
  jobId: string,
  workerId: string,
  status: "review" | "completed" | "budget_stopped",
  resultSummary: Record<string, unknown>,
): Promise<boolean> {
  const result = await db.rpc("worker_complete_relocation_job", {
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
  const result = await db.rpc("worker_fail_relocation_job", {
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

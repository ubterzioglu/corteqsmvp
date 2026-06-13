// src/lib/service-finder-api.ts
// Supabase RPC + okuma çağrıları — muhasebe-api deseni.
// Mutasyonlar security-definer RPC'ler üzerinden; listeler RLS'li SELECT.

import { supabase } from "@/integrations/supabase/client";
import type {
  CandidatePatch,
  JobCreateInput,
  ServiceFinderJobDetail,
  ServiceFinderJobRow,
  ServiceFinderProviderConfigRow,
  ServiceFinderReviewStatus,
  ServiceFinderTemplateRow,
} from "@/lib/service-finder-schemas";

// ---------------------------------------------------------------------------
// İşler
// ---------------------------------------------------------------------------

export interface JobListResult {
  total: number;
  jobs: ServiceFinderJobRow[];
}

export async function listJobs(params: {
  status?: string | null;
  limit?: number;
  offset?: number;
}): Promise<JobListResult> {
  const { data, error } = await supabase.rpc("admin_list_service_finder_jobs", {
    p_status: params.status ?? null,
    p_limit: params.limit ?? 25,
    p_offset: params.offset ?? 0,
  });
  if (error) throw error;
  return data as unknown as JobListResult;
}

export async function getJobDetail(jobId: string): Promise<ServiceFinderJobDetail> {
  const { data, error } = await supabase.rpc("admin_get_service_finder_job", {
    p_job_id: jobId,
  });
  if (error) throw error;
  return data as unknown as ServiceFinderJobDetail;
}

export async function createJob(input: JobCreateInput): Promise<{ job_id: string }> {
  const payload: Record<string, unknown> = {
    ...input,
    template_id: input.template_id || undefined,
    country_code: input.country_code || undefined,
  };
  const { data, error } = await supabase.rpc("admin_create_service_finder_job", {
    p_payload: payload,
  });
  if (error) throw error;
  return data as unknown as { job_id: string };
}

export async function cancelJob(jobId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_cancel_service_finder_job", {
    p_job_id: jobId,
  });
  if (error) throw error;
}

export async function retryJob(jobId: string, patch?: { soft_cap_usd?: number; hard_cap_usd?: number }): Promise<void> {
  const { error } = await supabase.rpc("admin_retry_service_finder_job", {
    p_job_id: jobId,
    p_patch: patch ?? {},
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Adaylar
// ---------------------------------------------------------------------------

export async function reviewCandidate(
  candidateId: string,
  action: Exclude<ServiceFinderReviewStatus, "published">,
  patch: CandidatePatch = {},
): Promise<void> {
  const { error } = await supabase.rpc("admin_review_service_finder_candidate", {
    p_candidate_id: candidateId,
    p_action: action,
    p_patch: patch,
  });
  if (error) throw error;
}

export async function publishCandidate(
  candidateId: string,
  patch: CandidatePatch = {},
): Promise<{ catalog_item_id: string }> {
  const { data, error } = await supabase.rpc("admin_publish_service_finder_candidate", {
    p_candidate_id: candidateId,
    p_patch: patch,
  });
  if (error) throw error;
  return data as unknown as { catalog_item_id: string };
}

// ---------------------------------------------------------------------------
// Sağlayıcılar ve şablonlar
// ---------------------------------------------------------------------------

export async function fetchProviders(): Promise<ServiceFinderProviderConfigRow[]> {
  const { data, error } = await supabase
    .from("service_finder_provider_configs")
    .select("*")
    .order("provider_kind")
    .order("priority");
  if (error) throw error;
  return (data ?? []) as ServiceFinderProviderConfigRow[];
}

export async function upsertProvider(
  providerId: string | null,
  patch: Partial<ServiceFinderProviderConfigRow>,
): Promise<void> {
  const { error } = await supabase.rpc("admin_upsert_service_finder_provider", {
    p_provider_id: providerId,
    p_patch: patch,
  });
  if (error) throw error;
}

export async function fetchTemplates(): Promise<ServiceFinderTemplateRow[]> {
  const { data, error } = await supabase
    .from("service_finder_profession_templates")
    .select("*")
    .order("label");
  if (error) throw error;
  return (data ?? []) as ServiceFinderTemplateRow[];
}

export async function upsertTemplate(
  templateId: string | null,
  patch: Partial<ServiceFinderTemplateRow>,
): Promise<void> {
  const { error } = await supabase.rpc("admin_upsert_service_finder_template", {
    p_template_id: templateId,
    p_patch: patch,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Maliyet özetleri (Costs sayfası — istemci tarafı toplama)
// ---------------------------------------------------------------------------

export interface CostSummaryRow {
  provider_key: string;
  event_type: string;
  total_amount_usd: number;
  call_count: number;
}

export async function fetchCostSummary(sinceIso?: string): Promise<CostSummaryRow[]> {
  let query = supabase
    .from("service_finder_cost_ledger")
    .select("provider_key, event_type, amount_usd");
  if (sinceIso) {
    query = query.gte("created_at", sinceIso);
  }
  const { data, error } = await query.limit(10_000);
  if (error) throw error;

  const buckets = new Map<string, CostSummaryRow>();
  for (const row of (data ?? []) as Array<{ provider_key: string; event_type: string; amount_usd: number }>) {
    const key = `${row.provider_key}:${row.event_type}`;
    const existing = buckets.get(key);
    if (existing) {
      buckets.set(key, {
        ...existing,
        total_amount_usd: existing.total_amount_usd + Number(row.amount_usd),
        call_count: existing.call_count + 1,
      });
    } else {
      buckets.set(key, {
        provider_key: row.provider_key,
        event_type: row.event_type,
        total_amount_usd: Number(row.amount_usd),
        call_count: 1,
      });
    }
  }
  return Array.from(buckets.values()).sort((a, b) => b.total_amount_usd - a.total_amount_usd);
}

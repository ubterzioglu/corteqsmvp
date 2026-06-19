// src/lib/relocation-admin-api.ts
// Admin ingestion ekranları için RPC + RLS-SELECT çağrıları (service-finder-api deseni).
// Worker tablolarına okuma is_admin gated RLS; review/publish security-definer RPC.

import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type RelocationJobStatus =
  | "queued"
  | "running"
  | "review"
  | "completed"
  | "failed"
  | "cancelled"
  | "budget_stopped";

export type RelocationCandidateReviewStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "needs_edit"
  | "published";

export interface RelocationJobRow {
  id: string;
  title: string;
  status: RelocationJobStatus;
  target_kind: string;
  service_category: string | null;
  country_code: string;
  city_code: string | null;
  cost_total_usd: number;
  attempts: number;
  last_error_message: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface RelocationCandidateRow {
  id: string;
  job_id: string;
  target_kind: string;
  normalized_payload: Record<string, unknown>;
  duplicate_key: string;
  source_url: string | null;
  confidence_score: number;
  review_status: RelocationCandidateReviewStatus;
  review_notes: string | null;
  published_entity_id: string | null;
  created_at: string;
}

export async function listIngestionJobs(status?: string | null): Promise<RelocationJobRow[]> {
  let query = db
    .from("relocation_jobs")
    .select(
      "id, title, status, target_kind, service_category, country_code, city_code, cost_total_usd, attempts, last_error_message, created_at, finished_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RelocationJobRow[];
}

export async function listCandidates(
  reviewStatus?: string | null,
): Promise<RelocationCandidateRow[]> {
  let query = db
    .from("relocation_candidates")
    .select(
      "id, job_id, target_kind, normalized_payload, duplicate_key, source_url, confidence_score, review_status, review_notes, published_entity_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (reviewStatus) query = query.eq("review_status", reviewStatus);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RelocationCandidateRow[];
}

export async function reviewCandidate(
  candidateId: string,
  action: "approved" | "rejected" | "needs_edit",
  notes?: string,
): Promise<void> {
  const { error } = await db.rpc("admin_review_relocation_candidate", {
    p_candidate_id: candidateId,
    p_action: action,
    p_notes: notes ?? null,
  });
  if (error) throw error;
}

export async function publishCandidate(candidateId: string): Promise<{ entity_id: string }> {
  const { data, error } = await db.rpc("admin_publish_relocation_candidate", {
    p_candidate_id: candidateId,
  });
  if (error) throw error;
  return { entity_id: data as string };
}

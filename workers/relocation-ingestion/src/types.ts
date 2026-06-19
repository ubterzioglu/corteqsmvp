// Relocation ingestion worker — paylaşılan tipler (DB satır şekilleri + adapter sözleşmesi).

export type RelocationTargetKind = "service" | "bureaucratic_step" | "emergency_contact";

export interface RelocationJob {
  id: string;
  title: string;
  status: string;
  priority: number;
  created_by_user_id: string;
  target_kind: RelocationTargetKind;
  service_category: string | null;
  country_code: string;
  city_code: string | null;
  source_id: string | null;
  soft_cap_usd: number;
  hard_cap_usd: number;
  cost_total_usd: number;
  attempts: number;
}

/** Normalize edilmiş aday payload — admin_publish_relocation_candidate'ın beklediği şekil. */
export interface NormalizedCandidate {
  target_kind: RelocationTargetKind;
  duplicate_key: string;
  source_url?: string;
  confidence_score: number;
  evidence: Array<{ quote: string; source_url?: string }>;
  /** target_kind'a göre service / step / emergency alanları. */
  payload: Record<string, unknown>;
}

/** Maliyet kaydı (worker_record_relocation_cost payload'u). */
export interface CostRecord {
  job_id: string;
  provider_key: string;
  event_type: string;
  billing_unit: string;
  quantity: number;
  unit_cost_usd: number;
  amount_usd: number;
  request_meta?: Record<string, unknown>;
}

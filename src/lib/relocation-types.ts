// Relocation modülü — Row tipleri (service-finder-schemas.ts kalıbı).
// DB satır şekilleri: supabase/migrations/20260619100000_relocation_core.sql.

import type { RelocationScoreKey } from "@/lib/relocation-ranking";

export type RelocationMoveStatus = "draft" | "active" | "archived";

export type RelocationServiceCategory =
  | "housing"
  | "airline"
  | "gsm_operator"
  | "doctor"
  | "community_hub";

export type RelocationStepTrigger = "before_departure" | "after_arrival" | "ongoing";

export type RelocationInteractionType =
  | "impression"
  | "click"
  | "save"
  | "dismiss"
  | "compare"
  | "click_out"
  | "checklist_complete"
  | "move_success";

export type RelocationAuthorityLevel =
  | "official"
  | "official_city"
  | "regulator"
  | "licensed_commercial"
  | "verified_community"
  | "user_generated";

export interface RelocationHousehold {
  adults: number;
  children?: number;
  pets?: string[];
  /** Coarse-grained etiketler — teşhis/sağlık verisi DEĞİL (GDPR min.). */
  accessibility_needs?: string[];
}

export interface RelocationMoveRow {
  id: string;
  user_id: string;
  status: RelocationMoveStatus;
  origin_country_code: string | null;
  origin_city_code: string | null;
  target_country_codes: string[];
  move_window_start: string | null;
  move_window_end: string | null;
  budget_monthly: number | null;
  setup_budget_max: number | null;
  currency: string;
  household: RelocationHousehold;
  must_haves: string[];
  nice_to_haves: string[];
  wizard_answers: Record<string, unknown>;
  preferred_language: string;
  allow_personalization: boolean;
  allow_partner_referrals: boolean;
  created_at: string;
  updated_at: string;
}

export interface RelocationLocationRow {
  id: string;
  country_code: string;
  city_code: string;
  city_name: string;
  district: string | null;
  lat: number | null;
  lon: number | null;
  cost_index: number | null;
  safety_index: number | null;
  housing_availability: number | null;
  healthcare_access: number | null;
  gsm_coverage: number | null;
  community_density: number | null;
  flight_access: number | null;
  bureaucracy_complexity: number | null;
  language_availability: string[];
  source_id: string | null;
  freshness_at: string | null;
}

export interface RelocationServiceRow {
  id: string;
  category: RelocationServiceCategory;
  provider_name: string;
  country_code: string;
  city_code: string | null;
  district: string | null;
  plan_name: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string | null;
  contract_months: number | null;
  coverage_score: number | null;
  languages: string[];
  website_url: string | null;
  appointment_url: string | null;
  source_id: string | null;
  trust_score: number;
  freshness_at: string | null;
}

export interface RelocationStepRow {
  id: string;
  country_code: string;
  city_code: string | null;
  name: string;
  description: string | null;
  trigger: RelocationStepTrigger;
  deadline_rule: string | null;
  sort_order: number;
  required_documents: string[];
  output_artifacts: string[];
  official_url_label: string | null;
  official_url: string | null;
  source_id: string | null;
}

export interface RelocationEmergencyContactRow {
  id: string;
  country_code: string;
  city_code: string | null;
  type: string;
  label: string;
  phone: string | null;
  url: string | null;
  source_id: string | null;
}

export interface RelocationRecommendationRow {
  id: string;
  move_id: string;
  entity_type: "location" | "service" | "bureaucratic_step";
  entity_id: string;
  hard_filter_pass: boolean;
  rule_score: number | null;
  ml_score: number | null;
  final_score: number | null;
  score_breakdown: Partial<Record<RelocationScoreKey, number>>;
  explanations: string[];
  rank_position: number | null;
  model_version: string | null;
  policy_version: string | null;
  created_at: string;
}

/** rank_locations_v1 RPC dönüş satırı (recommendation + lokasyon başlığı). */
export interface RelocationLocationRecommendation {
  entity_id: string;
  country_code: string;
  city_code: string;
  title: string;
  hard_filter_pass: boolean;
  rule_score: number;
  final_score: number;
  score_breakdown: Record<RelocationScoreKey, number>;
  explanations: string[];
  source_quality: { official_sources_ratio: number; freshness_hours: number | null };
}

// src/lib/service-finder-schemas.ts
// Service Finder tip ve Zod şemaları (scrapper_plan.md §TypeScript interfaces).

import { z } from "zod";

export type ServiceFinderJobStatus =
  | "queued"
  | "running"
  | "review"
  | "completed"
  | "failed"
  | "cancelled"
  | "budget_stopped";

export type ServiceFinderReviewStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "needs_edit"
  | "published";

export interface ServiceFinderJobRow {
  id: string;
  title: string;
  status: ServiceFinderJobStatus;
  priority: number;
  created_by_user_id: string;
  template_id: string | null;
  role_key: string;
  item_type: string;
  category_slug: string | null;
  location_label: string;
  country_code: string | null;
  region: string | null;
  city: string | null;
  language_code: string;
  freeform_topic: string | null;
  must_include_terms: string[];
  must_exclude_terms: string[];
  max_queries: number;
  max_source_urls: number;
  max_extract_urls: number;
  max_candidates: number;
  soft_cap_usd: number;
  hard_cap_usd: number;
  cost_total_usd: number;
  search_requests: number;
  extract_requests: number;
  classify_requests: number;
  catalog_publish_mode: string;
  result_summary: Record<string, unknown>;
  progress: Record<string, unknown>;
  attempts: number;
  last_error_code: string | null;
  last_error_message: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface ServiceFinderProviderConfigRow {
  id: string;
  provider_key: string;
  provider_kind: "search" | "extract" | "classify";
  display_name: string;
  is_enabled: boolean;
  priority: number;
  default_model: string | null;
  base_url: string | null;
  request_defaults: Record<string, unknown>;
  rate_limit_per_min: number | null;
  default_soft_cap_usd: number | null;
  default_hard_cap_usd: number | null;
  daily_cap_usd: number | null;
  monthly_cap_usd: number | null;
  secret_ref: string;
  updated_at: string;
}

export interface ServiceFinderTemplateRow {
  id: string;
  template_key: string;
  label: string;
  role_key: string;
  item_type: string;
  category_slug: string | null;
  language_terms: string[];
  location_terms: string[];
  must_include_terms: string[];
  must_exclude_terms: string[];
  query_templates: string[];
  extraction_hints: Record<string, unknown>;
  default_max_queries: number;
  default_max_source_urls: number;
  default_max_extract_urls: number;
  is_active: boolean;
}

export interface ServiceFinderContact {
  type: "phone" | "email" | "website" | "appointment_url";
  value: string;
  label?: string | null;
  is_primary?: boolean | null;
}

export interface ServiceFinderCandidateRow {
  id: string;
  job_id: string;
  primary_source_id: string | null;
  canonical_name: string;
  profession_label: string | null;
  organization_name: string | null;
  role_key: string;
  item_type: string;
  category_slug: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  address_line: string | null;
  languages: string[];
  services: string[];
  contacts: ServiceFinderContact[];
  website_url: string | null;
  appointment_url: string | null;
  source_urls: string[];
  evidence: Array<{ quote: string; source_url?: string }>;
  confidence_score: number;
  classifier_model: string | null;
  review_status: ServiceFinderReviewStatus;
  review_notes: string | null;
  catalog_item_id: string | null;
  published_at: string | null;
  cost_total_usd: number;
  created_at: string;
}

export interface ServiceFinderQueryRow {
  id: string;
  job_id: string;
  stage: string;
  provider_key: string;
  query_text: string;
  usage_units: number;
  estimated_cost_usd: number;
  result_count: number;
  status: string;
  executed_at: string | null;
  created_at: string;
}

export interface ServiceFinderSourceRow {
  id: string;
  job_id: string;
  provider_key: string;
  source_url: string;
  source_domain: string;
  source_title: string | null;
  source_snippet: string | null;
  crawl_allowed: boolean | null;
  fetch_status: string;
  created_at: string;
}

export interface ServiceFinderCostRow {
  id: number;
  job_id: string;
  provider_key: string;
  event_type: string;
  billing_unit: string;
  quantity: number;
  unit_cost_usd: number;
  amount_usd: number;
  model_name: string | null;
  created_at: string;
}

export interface ServiceFinderEventRow {
  id: number;
  job_id: string;
  candidate_id: string | null;
  event_type: string;
  event_level: "debug" | "info" | "warn" | "error";
  message: string;
  event_payload: Record<string, unknown>;
  created_at: string;
}

export interface ServiceFinderJobDetail {
  job: ServiceFinderJobRow;
  queries: ServiceFinderQueryRow[];
  sources: ServiceFinderSourceRow[];
  candidates: ServiceFinderCandidateRow[];
  costs: ServiceFinderCostRow[];
  events: ServiceFinderEventRow[];
}

// ---------------------------------------------------------------------------
// Form şemaları
// ---------------------------------------------------------------------------

export const jobCreateSchema = z
  .object({
    title: z.string().min(3, "Başlık en az 3 karakter olmalı"),
    template_id: z.string().uuid().optional().or(z.literal("")),
    role_key: z.string().min(1, "Rol seçilmeli"),
    item_type: z.string().min(1, "Kayıt tipi seçilmeli"),
    category_slug: z.string().optional(),
    location_label: z.string().min(2, "Lokasyon zorunlu"),
    country_code: z.string().max(2).optional().or(z.literal("")),
    region: z.string().optional(),
    city: z.string().optional(),
    language_code: z.enum(["tr", "de", "en"]).default("tr"),
    freeform_topic: z.string().optional(),
    must_include_terms: z.array(z.string()).default([]),
    must_exclude_terms: z.array(z.string()).default([]),
    max_queries: z.coerce.number().int().min(1).max(50).default(12),
    max_source_urls: z.coerce.number().int().min(1).max(200).default(40),
    max_extract_urls: z.coerce.number().int().min(1).max(100).default(25),
    max_candidates: z.coerce.number().int().min(1).max(500).default(100),
    soft_cap_usd: z.coerce.number().positive("Soft cap pozitif olmalı").default(1.5),
    hard_cap_usd: z.coerce.number().positive("Hard cap pozitif olmalı").default(3),
    seed_urls: z.array(z.string().url("Geçerli bir URL girin")).default([]),
  })
  .refine((value) => value.hard_cap_usd >= value.soft_cap_usd, {
    message: "Hard cap, soft cap'ten küçük olamaz",
    path: ["hard_cap_usd"],
  });

export type JobCreateInput = z.infer<typeof jobCreateSchema>;

export const candidatePatchSchema = z.object({
  canonical_name: z.string().min(1).optional(),
  profession_label: z.string().nullable().optional(),
  organization_name: z.string().nullable().optional(),
  category_slug: z.string().nullable().optional(),
  country_code: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  address_line: z.string().nullable().optional(),
  languages: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
  contacts: z
    .array(
      z.object({
        type: z.enum(["phone", "email", "website", "appointment_url"]),
        value: z.string().min(1),
        label: z.string().nullable().optional(),
        is_primary: z.boolean().nullable().optional(),
      }),
    )
    .optional(),
  website_url: z.string().nullable().optional(),
  appointment_url: z.string().nullable().optional(),
  review_notes: z.string().nullable().optional(),
});

export type CandidatePatch = z.infer<typeof candidatePatchSchema>;

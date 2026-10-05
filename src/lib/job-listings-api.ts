// A8 · İş ilanı API katmanı — liste + detay + kota.
//
// Kaynak: docs/plans/2026-10-05-birlesik-plan-cv-ilan-rol-talepleri.md A8
// RPC'ler: list_job_listings_public, get_job_listing_detail_v1, get_my_listing_quota_v1
//
// ⚠️ RPC hatası düz nesnedir (`instanceof Error` ile daraltma YOK).
// extractRpcErrorText + JOB_LISTING_ERROR_MESSAGES ile Türkçeye çevrilir.

import { supabase } from "@/integrations/supabase/client";
import { extractRpcErrorText } from "@/lib/rpc-error-text";

// ── Tipler ───────────────────────────────────────────────────────────────────

export interface JobListingSummary {
  id: string;
  business_name: string | null;
  title: string;
  department: string | null;
  employment_type: string;
  location_type: string;
  country: string | null;
  city: string | null;
  location: string | null;
  package: string;
  status: string;
  created_at: string;
  hide_business_name: boolean;
}

export interface JobListingDetail extends JobListingSummary {
  description: string | null;
  requirements: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
}

export interface ListingQuota {
  limit_total: number;
  viewed_count: number;
  remaining: number;
  has_unlimited: boolean;
}

// ── Hata mesajları ───────────────────────────────────────────────────────────

const JOB_LISTING_ERROR_MESSAGES: Record<string, string> = {
  career_login_required: "Bu özelliği kullanmak için giriş yapın.",
  career_listing_not_found: "İlan bulunamadı veya yayından kaldırılmış.",
  career_listing_limit_reached: "İş ilanı görüntüleme hakkınız doldu. Premium'a geçerek sınırsız erişim kazanabilirsiniz.",
};

export function resolveJobListingError(error: unknown, fallback = "İşlem tamamlanamadı. Lütfen tekrar deneyin."): string {
  const raw = extractRpcErrorText(error);
  for (const [code, message] of Object.entries(JOB_LISTING_ERROR_MESSAGES)) {
    if (raw.includes(code)) return message;
  }
  return fallback;
}

// ── API fonksiyonları ────────────────────────────────────────────────────────

/**
 * İş ilani listesi (herkese açık, detay kolonları YOK).
 */
export async function listJobListings(limit = 20, offset = 0): Promise<JobListingSummary[]> {
  const { data, error } = await supabase.rpc("list_job_listings_public" as never, {
    p_limit: limit,
    p_offset: offset,
  } as never);

  if (error) throw new Error(resolveJobListingError(error));
  return (data ?? []) as JobListingSummary[];
}

/**
 * İş ilanı detayı (kota kontrollü, giriş gerekli).
 * Hata kodları: career_login_required, career_listing_not_found, career_listing_limit_reached
 */
export async function getJobListingDetail(listingId: string): Promise<JobListingDetail> {
  const { data, error } = await supabase.rpc("get_job_listing_detail_v1" as never, {
    p_listing_id: listingId,
  } as never);

  if (error) throw new Error(resolveJobListingError(error));
  const rows = (data ?? []) as JobListingDetail[];
  if (rows.length === 0) throw new Error(JOB_LISTING_ERROR_MESSAGES.career_listing_not_found);
  return rows[0];
}

/**
 * Kullanıcının ilan görüntüleme kotası.
 */
export async function getMyListingQuota(): Promise<ListingQuota> {
  const { data, error } = await supabase.rpc("get_my_listing_quota_v1" as never);

  if (error) throw new Error(resolveJobListingError(error));
  const rows = (data ?? []) as ListingQuota[];
  if (rows.length === 0) {
    return { limit_total: 5, viewed_count: 0, remaining: 5, has_unlimited: false };
  }
  return rows[0];
}

// ── React Query hooks ────────────────────────────────────────────────────────

import { useQuery } from "@tanstack/react-query";

export const jobListingKeys = {
  all: ["job-listings"] as const,
  lists: () => [...jobListingKeys.all, "list"] as const,
  list: (params: { limit?: number; offset?: number }) => [...jobListingKeys.lists(), params] as const,
  details: () => [...jobListingKeys.all, "detail"] as const,
  detail: (id: string) => [...jobListingKeys.details(), id] as const,
  quota: () => [...jobListingKeys.all, "quota"] as const,
};

export function useJobListings(limit = 20, offset = 0) {
  return useQuery({
    queryKey: jobListingKeys.list({ limit, offset }),
    queryFn: () => listJobListings(limit, offset),
  });
}

export function useJobListingDetail(listingId: string | null) {
  return useQuery({
    queryKey: jobListingKeys.detail(listingId ?? ""),
    queryFn: () => getJobListingDetail(listingId!),
    enabled: !!listingId,
    retry: false,
  });
}

export function useMyListingQuota() {
  return useQuery({
    queryKey: jobListingKeys.quota(),
    queryFn: getMyListingQuota,
  });
}

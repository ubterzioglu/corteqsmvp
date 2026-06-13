// src/lib/service-finder-format.ts
// Durum/maliyet/güven formatlama + RPC hata kodlarının Türkçe mesaj haritası
// (cadde-rules.ts deseni — yeni sf_* kodu eklenince buraya da eklenmelidir).

import type {
  ServiceFinderJobStatus,
  ServiceFinderReviewStatus,
} from "@/lib/service-finder-schemas";

export const SF_ERROR_MESSAGES: Record<string, string> = {
  sf_auth_required: "Oturum gerekli. Lütfen yeniden giriş yapın.",
  sf_admin_required: "Bu işlem için yönetici yetkisi gerekli.",
  sf_title_required: "İş başlığı zorunludur.",
  sf_location_required: "Lokasyon bilgisi zorunludur.",
  sf_invalid_budget: "Bütçe değerleri geçersiz (hard cap ≥ soft cap > 0 olmalı).",
  sf_template_not_found: "Şablon bulunamadı veya pasif.",
  sf_role_required: "Rol ve kayıt tipi zorunludur.",
  sf_invalid_role: "Geçersiz veya pasif rol anahtarı.",
  sf_no_enabled_provider: "Etkin arama/sınıflandırma sağlayıcısı yok.",
  sf_job_not_found: "İş kaydı bulunamadı.",
  sf_job_not_cancellable: "Yalnızca kuyruktaki veya çalışan işler iptal edilebilir.",
  sf_job_not_retryable: "Yalnızca başarısız/iptal/bütçe-durduruldu işler yeniden denenebilir.",
  sf_provider_not_found: "Sağlayıcı kaydı bulunamadı.",
  sf_provider_fields_required: "Sağlayıcı için zorunlu alanlar eksik.",
  sf_template_fields_required: "Şablon için zorunlu alanlar eksik.",
  sf_invalid_review_action: "Geçersiz inceleme aksiyonu.",
  sf_candidate_not_found: "Aday kaydı bulunamadı.",
  sf_candidate_already_published: "Aday zaten yayınlanmış.",
  sf_candidate_not_approved: "Yayınlamak için aday önce onaylanmalı.",
  sf_category_required: "Kategori slug'ı zorunludur (aday veya iş üzerinde).",
  sf_slug_generation_failed: "Slug üretilemedi; aday adını kontrol edin.",
};

/** Supabase hata mesajından sf_* kodunu yakalayıp Türkçe mesaja çevirir. */
export function sfErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const match = raw.match(/sf_[a-z_]+/);
  if (match && SF_ERROR_MESSAGES[match[0]]) {
    return SF_ERROR_MESSAGES[match[0]];
  }
  return raw || "Beklenmeyen bir hata oluştu.";
}

// ---------------------------------------------------------------------------
// Durum etiketleri
// ---------------------------------------------------------------------------

export const JOB_STATUS_LABELS: Record<ServiceFinderJobStatus, string> = {
  queued: "Kuyrukta",
  running: "Çalışıyor",
  review: "İncelemede",
  completed: "Tamamlandı",
  failed: "Başarısız",
  cancelled: "İptal edildi",
  budget_stopped: "Bütçe durdurdu",
};

export const JOB_STATUS_VARIANTS: Record<ServiceFinderJobStatus, string> = {
  queued: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  running: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  review: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  budget_stopped: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

export const REVIEW_STATUS_LABELS: Record<ServiceFinderReviewStatus, string> = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  needs_edit: "Düzenleme gerekli",
  published: "Yayınlandı",
};

export const REVIEW_STATUS_VARIANTS: Record<ServiceFinderReviewStatus, string> = {
  pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  needs_edit: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  published: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

export const FETCH_STATUS_LABELS: Record<string, string> = {
  discovered: "Keşfedildi",
  queued: "Kuyrukta",
  fetched: "İçerik alındı",
  blocked_robots: "Robots engelledi",
  failed: "Başarısız",
  duplicate: "Mükerrer",
  irrelevant: "İlgisiz",
};

// ---------------------------------------------------------------------------
// Sayı formatları
// ---------------------------------------------------------------------------

const usdFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export function formatUsd(value: number | string | null | undefined): string {
  const numeric = Number(value ?? 0);
  return usdFormatter.format(Number.isFinite(numeric) ? numeric : 0);
}

export function formatConfidence(score: number | string | null | undefined): string {
  const numeric = Number(score ?? 0);
  return `%${Math.round(Number.isFinite(numeric) ? numeric : 0)}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Bütçe doluluk oranı (0-100, taşmada 100). */
export function budgetPercent(costTotal: number | string, hardCap: number | string): number {
  const cost = Number(costTotal ?? 0);
  const cap = Number(hardCap ?? 0);
  if (!Number.isFinite(cost) || !Number.isFinite(cap) || cap <= 0) return 0;
  return Math.min(100, Math.round((cost / cap) * 100));
}

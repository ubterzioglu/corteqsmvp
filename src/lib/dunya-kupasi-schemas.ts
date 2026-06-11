// Dünya Kupası işletme kampanyası — Zod şemaları, tipler ve hata mesajları.
// Mutasyonlar yalnız worldcup_* security-definer RPC'leri üzerinden yapılır
// (bkz. supabase/migrations/20260612090000_world_cup_campaign.sql).

import { z } from "zod";

export const worldCupRegistrationFormSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(3, "İşletme adı en az 3 karakter olmalı.")
    .max(120, "İşletme adı en fazla 120 karakter olabilir."),
  categoryRoleKey: z
    .string()
    .min(1, "İşletme kategorisi seçmelisiniz.")
    .refine((value) => value.startsWith("Business_"), "Geçersiz işletme kategorisi."),
  country: z.string().trim().min(1, "Ülke gerekli."),
  city: z.string().trim().min(1, "Şehir gerekli."),
  address: z.string().trim().max(300, "Adres en fazla 300 karakter olabilir.").optional(),
  broadcastConfirmed: z.literal(true, {
    errorMap: () => ({ message: "Maç yayını yaptığınızı onaylamalısınız." }),
  }),
  note: z.string().trim().max(500, "Not en fazla 500 karakter olabilir.").optional(),
});

export type WorldCupRegistrationFormValues = z.infer<typeof worldCupRegistrationFormSchema>;

export type WorldCupRegistrationStatus = "pending" | "approved" | "rejected";

export type WorldCupRegistration = {
  id: string;
  userId: string;
  businessName: string;
  categoryRoleKey: string;
  country: string;
  city: string;
  address: string | null;
  broadcastConfirmed: boolean;
  applicantNote: string | null;
  status: WorldCupRegistrationStatus;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
};

export type WorldCupAdminRegistration = WorldCupRegistration & {
  email: string | null;
  categoryLabel: string;
  previousRoleKey: string | null;
  roleAssigned: boolean | null;
};

export type WorldCupBusinessListing = {
  registrationId: string;
  businessName: string;
  categoryKey: string;
  categoryLabel: string;
  country: string;
  city: string;
  userId: string;
};

export type WorldCupCampaignSettings = {
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

export type WorldCupReviewResult = {
  status: "approved" | "rejected";
  roleAssigned?: boolean;
  previousRoleKey?: string | null;
};

export type BusinessCategoryOption = {
  key: string;
  label: string;
};

export const WORLD_CUP_STATUS_LABELS: Record<WorldCupRegistrationStatus, string> = {
  pending: "Onay bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

export const WORLD_CUP_ERROR_MESSAGES: Record<string, string> = {
  worldcup_auth_required: "Başvuru için giriş yapmalısınız.",
  worldcup_campaign_inactive: "Dünya Kupası kampanyası şu anda aktif değil.",
  worldcup_invalid_category: "Geçersiz işletme kategorisi seçildi.",
  worldcup_invalid_business_name: "İşletme adı 3-120 karakter arasında olmalı.",
  worldcup_invalid_location: "Ülke ve şehir bilgisi gerekli.",
  worldcup_broadcast_confirmation_required: "Maç yayını yaptığınızı onaylamalısınız.",
  worldcup_already_registered: "Bu hesapla zaten aktif bir başvurunuz var.",
  worldcup_admin_required: "Bu işlem için yönetici yetkisi gerekli.",
  worldcup_registration_not_found: "Başvuru bulunamadı.",
  worldcup_registration_not_pending: "Başvuru zaten değerlendirilmiş.",
  worldcup_invalid_status_filter: "Geçersiz durum filtresi.",
};

const WORLD_CUP_FALLBACK_ERROR = "İşlem tamamlanamadı. Lütfen tekrar deneyin.";

/** RPC hatasındaki worldcup_* kodunu Türkçe kullanıcı mesajına çevirir. */
export const resolveWorldCupErrorMessage = (error: unknown): string => {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown })?.message === "string"
        ? String((error as { message: string }).message)
        : "";

  for (const [code, message] of Object.entries(WORLD_CUP_ERROR_MESSAGES)) {
    if (rawMessage.includes(code)) return message;
  }
  return WORLD_CUP_FALLBACK_ERROR;
};

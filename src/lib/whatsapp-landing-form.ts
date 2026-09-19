// Grup platformları — tek kaynak.
//
// Platform DB'de AYRI BİR SÜTUNDA DEĞİL, `whatsapp_landings.description` içinde
// `[Platform: X]` etiketi olarak yaşar (`buildLandingDescription` yazar,
// `rowToLanding` okur). 19 Eylül 2026'da `submitLanding` bu değeri ayrıca
// `platform` adlı bir sütuna yazmaya çalışıyordu; öyle bir sütun hiçbir zaman
// var olmadı ve gönderim PGRST204 ile düşerdi. Gerçek bir sütun istenirse önce
// migration yazılmalı, `types.ts` yenilenmeli, sonra yazma yolu değiştirilmeli.
//
// Moderasyon ekranı (admin) aşağıdaki LİSTENİN TAMAMINI sunar; herkese açık form
// ise yalnızca `GROUP_PLATFORM_OPTIONS` alt kümesini gösterir. İki liste aynı
// birlikten türediği için birbirinden kayamaz.
export const GROUP_PLATFORMS = [
  "WhatsApp",
  "Telegram",
  "Discord",
  "Facebook",
  "Instagram",
  "LinkedIn",
  "X",
  "TikTok",
  "YouTube",
  "Reddit",
] as const;

export type GroupPlatform = (typeof GROUP_PLATFORMS)[number];

/** Herkese açık grup ekleme formunun sunduğu alt küme. */
export const GROUP_PLATFORM_OPTIONS: { value: GroupPlatform; label: string }[] = [
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Facebook", label: "Facebook" },
  { value: "Instagram", label: "Instagram" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Reddit", label: "Reddit" },
  { value: "YouTube", label: "YouTube" },
];

export type GroupFormState = {
  groupName: string;
  platform: GroupPlatform;
  whatsappLink: string;
  country: string;
  city: string;
  description: string;
};

export type JoinFormState = {
  fullName: string;
  email: string;
  phone: string;
  note: string;
};

export const initialGroupForm: GroupFormState = {
  groupName: "",
  platform: "WhatsApp",
  whatsappLink: "",
  country: "",
  city: "",
  description: "",
};

export const initialJoinForm: JoinFormState = {
  fullName: "",
  email: "",
  phone: "",
  note: "",
};

export function getErrorMessage(error: unknown, fallback = "Beklenmeyen hata") {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "object" && error && "message" in error && typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

export function buildSubmitterDescription(form: GroupFormState) {
  return form.description.trim();
}

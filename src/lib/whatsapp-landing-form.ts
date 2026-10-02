// Grup formu durum tipleri — tek kaynak.
//
// ⚠️ G18 (02.10): S1 formu MOTOR şemasına geçti (politika §2). Eski serbest
// metin ülke/şehir ve platform SEÇİMİ kalktı; platform linkten türetilir
// (`detectMotorPlatform`), konum `geo_*` kataloğundan seçilir
// (`SearchableCountrySelect`/`SearchableCitySelect` ad döndürür, gönderimde
// `resolveMotorLocation` code/id'ye çözer). Yazma yolu `submit_group_v1` RPC'si.
//
// `GROUP_PLATFORMS` (eski 10 değerli etiket listesi) DURUYOR — moderasyon
// ekranı (`WhatsAppLandingsModeration`) legacy `description` etiketini bu
// listeyle yazıyor. Yeni form bu listeyi KULLANMAZ.
import type { MotorCategory } from "@/lib/group-submit";

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

/** S1 form durumu (politika §2'nin 7 satırı + önizleme ön doldurması). */
export type GroupFormState = {
  /** Satır 1: davet linki (platform otomatik türetilir — seçim YOK). */
  link: string;
  /** Satır 2: grup adı (önizlemeden otomatik dolar, düzeltilebilir). */
  groupName: string;
  /** Satır 3: kategori — 7 anahtar, tek seçim ("Diğer" YOK). */
  category: MotorCategory | "";
  /** Satır 4: ülke adı (autocomplete; Global'de "hedef ülke"). */
  countryName: string;
  /** Satır 4: şehir adı (autocomplete; Global'de kapalı). */
  cityName: string;
  /** Satır 4: Global mi (is_global → city 'Genel', ülke hedef ülke). */
  isGlobal: boolean;
  /** Satır 5: kısa açıklama — zorunlu, ≤160 karakter. */
  shortDescription: string;
  /** Satır 6: "Bu grubun admini misin?" — Evet/Hayır, cevapsız gönderilemez. */
  claimsAdmin: "yes" | "no" | "";
  /** Satır 7: Grup Sözü onayı (politika §10 — işaretsiz gönderim YOK). */
  pledgeAccepted: boolean;
  /** Önizlemenin okuduğu görsel (og:image) — kullanıcı değiştirmez. */
  heroImage: string;
};

export type JoinFormState = {
  fullName: string;
  email: string;
  phone: string;
  note: string;
};

export const initialGroupForm: GroupFormState = {
  link: "",
  groupName: "",
  category: "",
  countryName: "",
  cityName: "",
  isGlobal: false,
  shortDescription: "",
  claimsAdmin: "",
  pledgeAccepted: false,
  heroImage: "",
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

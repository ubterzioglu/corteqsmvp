import { categoryMeta } from "@/lib/whatsapp-landing-presentation";
import type { LandingCategory, LandingLanguage, LandingOrigin } from "@/lib/whatsapp-landings";

export const platformOptions = [
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

/**
 * G19 · politika §5: "Filtreler ve kartlar aynı listeyi kullanır."
 * Kategori seçenekleri artık `categoryMeta`'dan TÜRETİLİYOR — ikinci bir liste
 * YOK, iki yüzey birbirinden KAYAMAZ (eskiden filtre ve kart ayrı listelerdi).
 * ⚠️ Taksonomi geçişi (eski 10 → yeni 7 anahtar) G11 veri eşlemesine bağlı:
 * canlı 10 grup eski anahtarları taşırken filtre listesi de onları göstermek
 * ZORUNDA (yoksa gruplar kategorisiz kalır). G11 sonrası tek hamlede yeni 7'ye
 * dönülecek (motor formu zaten yeni 7'yi kullanıyor — `MOTOR_CATEGORIES`).
 */
export const categoryOptions: Array<{ value: LandingCategory; label: string }> = Object.entries(
  categoryMeta,
).map(([value, meta]) => ({
  value: value as LandingCategory,
  label: meta.label,
}));

export const languageOptions: Array<{ value: LandingLanguage; label: string }> = [
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "İngilizce" },
  { value: "de", label: "Almanca" },
  { value: "ar", label: "Arapça" },
];

export const originOptions: Array<{ value: LandingOrigin; label: string }> = [
  { value: "global", label: "Global" },
  { value: "mena", label: "MENA" },
  { value: "berlin", label: "Berlin" },
  { value: "turkiye", label: "Türkiye" },
  { value: "avrupa", label: "Avrupa" },
];

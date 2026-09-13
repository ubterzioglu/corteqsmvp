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

export const categoryOptions: Array<{ value: LandingCategory; label: string }> = [
  { value: "alumni", label: "Alumni" },
  { value: "hobi", label: "Hobi" },
  { value: "is", label: "İş Grubu" },
  { value: "doktor", label: "Doktor / Sağlık" },
  { value: "yatirim", label: "Yatırım & Girişim" },
  { value: "akademik", label: "Akademik" },
  { value: "dayanisma", label: "Dayanışma" },
  { value: "hr", label: "HR" },
  { value: "kisisel-gelisim", label: "Kişisel Gelişim" },
  { value: "diger", label: "Diğer" },
];

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

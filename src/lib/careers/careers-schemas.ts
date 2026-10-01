/**
 * Kariyer başvurusu şemaları (KR03).
 *
 * Doğrulama İKİ yerde yapılır ve ikisi de gereklidir: buradaki Zod şeması
 * kullanıcıya anlamlı Türkçe hata gösterir, `submit_career_application` RPC'si
 * ise gerçek kapıdır (istemci atlatılabilir). Biri gevşetilirse diğeri tutar;
 * ikisinin de gevşetilmemesi için sınırlar tek yerde tanımlı.
 */
import { z } from "zod";

export const CAREER_MODELS = ["kurucu-ekip", "yatirimci-ortak", "staj", "gorusmede"] as const;
export type CareerModel = (typeof CAREER_MODELS)[number];

export const CAREER_APPLICATION_STATUSES = [
  "yeni",
  "inceleniyor",
  "gorusme",
  "teklif",
  "olumsuz",
  "arsiv",
] as const;
export type CareerApplicationStatus = (typeof CAREER_APPLICATION_STATUSES)[number];

/** Kullanıcıya görünen durum etiketleri (yönetici ekranı KR08'de kullanır). */
export const CAREER_STATUS_LABELS: Record<CareerApplicationStatus, string> = {
  yeni: "Yeni",
  inceleniyor: "İnceleniyor",
  gorusme: "Görüşme",
  teklif: "Teklif",
  olumsuz: "Olumsuz",
  arsiv: "Arşiv",
};

export const careerApplicationSchema = z.object({
  fullName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalı.").max(200, "Ad soyad çok uzun."),
  email: z.string().trim().email("Geçerli bir e-posta adresi girin."),
  phone: z.string().trim().max(40, "Telefon çok uzun.").optional().or(z.literal("")),
  linkedin: z.string().trim().max(300, "Bağlantı çok uzun.").optional().or(z.literal("")),
  country: z.string().trim().min(1, "Ülke zorunludur.").max(100, "Ülke adı çok uzun."),
  city: z.string().trim().max(100, "Şehir adı çok uzun.").optional().or(z.literal("")),
  position: z.string().trim().min(1, "Pozisyon seçin.").max(100, "Pozisyon değeri geçersiz."),
  model: z.enum(CAREER_MODELS, { errorMap: () => ({ message: "Katılım modeli seçin." }) }),
  coverLetterText: z.string().trim().max(10000, "Ön yazı 10.000 karakteri aşamaz.").optional().or(z.literal("")),
  consent: z.literal(true, { errorMap: () => ({ message: "Devam etmek için onay vermelisiniz." }) }),
  source: z.string().trim().max(200).optional().or(z.literal("")),
});

export type CareerApplicationInput = z.infer<typeof careerApplicationSchema>;

/** Yönetici ekranının okuduğu satır (KR08). */
export type CareerApplicationRow = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  linkedin: string | null;
  country: string;
  city: string | null;
  position: string;
  model: CareerModel;
  cover_letter_text: string | null;
  cv_path: string;
  cover_letter_path: string | null;
  presentation_path: string | null;
  source: string | null;
  status: CareerApplicationStatus;
  notes: string | null;
};

// Toplu profil içe aktarma — Zod şemaları ve tipler.
//
// İçe aktarma kaynağı: Deep Research çıktısı profesyonel listeleri (Name, Company,
// City, Profession, Phone, Email, Web, Address). Bu şema, hem yapıştırılan CSV/JSON
// metnini doğrular hem de admin_bulk_import_catalog_items RPC'sine giden payload'ı
// (snake_case alanlar) tanımlar.

import { z } from "zod";

/**
 * Tek bir içe aktarma kaydı. Yalnız `name` zorunlu; diğer alanlar opsiyonel.
 * Alan adları RPC'nin beklediği snake_case ile birebir (name/company/city/...).
 */
export const importRecordSchema = z.object({
  name: z.string().trim().min(1, "İsim zorunlu"),
  company: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  country: z.string().trim().optional().default(""),
  profession: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  email: z.string().trim().optional().default(""),
  web: z.string().trim().optional().default(""),
  address: z.string().trim().optional().default(""),
  external_id: z.string().trim().optional().default(""),
  source_url: z.string().trim().optional().default(""),
});

export type ImportRecord = z.infer<typeof importRecordSchema>;

export const importRecordListSchema = z
  .array(importRecordSchema)
  .min(1, "En az bir kayıt gerekli");

/** RPC sonucu (admin_bulk_import_catalog_items dönüşü). */
export const bulkImportResultSchema = z.object({
  created: z.number(),
  skipped: z.number(),
  batch_id: z.string(),
  item_ids: z.array(z.string()),
});

export type BulkImportResult = z.infer<typeof bulkImportResultSchema>;

export type ReviewDecision = "approved" | "rejected";

/**
 * CSV başlık -> ImportRecord alanı eşlemesi. Türkçe + İngilizce başlıkları kabul eder.
 * scripts/catalog-role-import-map.json commonColumns ile uyumlu tutulur.
 */
export const CSV_HEADER_ALIASES: Record<keyof ImportRecord, string[]> = {
  name: ["name", "ad", "isim", "ad soyad", "adsoyad", "title", "başlık", "baslik", "firma", "kurum"],
  company: ["company", "firma", "kurum", "şirket", "sirket", "işletme", "isletme"],
  city: ["city", "şehir", "sehir", "il"],
  country: ["country", "ülke", "ulke"],
  profession: ["profession", "meslek", "uzmanlık", "uzmanlik", "title", "ünvan", "unvan", "kategori"],
  phone: ["phone", "telefon", "tel", "gsm", "mobile"],
  email: ["email", "e-posta", "eposta", "mail"],
  web: ["web", "website", "url", "site", "internet"],
  address: ["address", "adres"],
  external_id: ["external_id", "externalid", "id", "kaynak_id"],
  source_url: ["source_url", "sourceurl", "kaynak", "kaynak_url", "source"],
};

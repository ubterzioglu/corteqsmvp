// M19 · Tavsiye İste — Zod şemaları + z.infer tipleri (desen: service-finder-schemas.ts).
// RPC/ tablo satırlarının şekli. Uzunluk/diaspora doğrulaması SQL'de (M17) +
// recommendations-rules.ts aynasında; burada yapısal şekil + istemci form şeması.
import { z } from "zod";

import { RECOMMENDATION_DIASPORA_KEYS } from "@/lib/recommendations-rules";

/** Talep durumu (M17 CHECK: open|answered|closed). */
export const recommendationStatusSchema = z.enum(["open", "answered", "closed"]);
export type RecommendationStatus = z.infer<typeof recommendationStatusSchema>;

/** `recommendation_requests` satırı (liste/detay). */
export const recommendationRequestRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  body: z.string(),
  category_slug: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  status: recommendationStatusSchema.catch("open"),
  diaspora_key: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
});
export type RecommendationRequestRow = z.infer<typeof recommendationRequestRowSchema>;

/** `recommendation_answers` satırı (detay). */
export const recommendationAnswerRowSchema = z.object({
  id: z.string().uuid(),
  request_id: z.string().uuid(),
  user_id: z.string().uuid(),
  body: z.string(),
  is_professional: z.boolean(),
  created_at: z.string(),
});
export type RecommendationAnswerRow = z.infer<typeof recommendationAnswerRowSchema>;

/**
 * `match_recommendation_professionals` satırı (M18). 🔴 İLETİŞİM YOK — yalnız
 * herkese açık dizin alanları (title/slug/geo/kategori) + skor. search_text sızmadı.
 */
export const matchedProfessionalSchema = z.object({
  item_id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  country_code: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  category_slugs: z.array(z.string()).default([]),
  match_score: z.number().int(),
  match_reason: z.string().nullable().optional(),
});
export type MatchedProfessional = z.infer<typeof matchedProfessionalSchema>;

/** Yeni talep formu girdisi (M20 /tavsiye). userId YOK — RPC auth.uid() kullanır. */
export const createRecommendationInputSchema = z.object({
  title: z.string().trim().min(1, "Başlık zorunlu."),
  body: z.string().trim().min(1, "Açıklama zorunlu."),
  category_slug: z.string().trim().optional().nullable(),
  country: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  diaspora_key: z.enum(RECOMMENDATION_DIASPORA_KEYS).default("tr"),
});
export type CreateRecommendationInput = z.infer<typeof createRecommendationInputSchema>;

/** Yanıt formu girdisi. */
export const answerRecommendationInputSchema = z.object({
  body: z.string().trim().min(1, "Yanıt boş olamaz."),
});
export type AnswerRecommendationInput = z.infer<typeof answerRecommendationInputSchema>;

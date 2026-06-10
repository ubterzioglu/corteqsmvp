// Cadde public input Zod şemaları — tüm kullanıcı mutation girdileri API katmanında
// bu şemalardan geçer (sınır validasyonu). Hata mesajları kullanıcıya gösterilebilir Türkçedir.

import { z } from "zod";

export const caddeFilterSchema = z.object({
  mode: z.enum(["demo", "real"]),
  countries: z.array(z.string()),
  cities: z.array(z.string()),
  bridge: z.boolean(),
});

export const caddePostCreateSchema = z.object({
  type: z.enum(["text", "question", "offer", "event"]),
  title: z.string().trim().max(160, "Başlık en fazla 160 karakter olabilir.").optional(),
  body: z
    .string()
    .trim()
    .min(1, "Paylaşım metni zorunlu.")
    .max(4000, "Paylaşım metni en fazla 4000 karakter olabilir."),
  // Tarihsel sözleşme: bu alanlar ülke/şehir ADI taşır (bkz. cadde-types.ts notu).
  countryId: z.string().optional(),
  cityId: z.string().optional(),
  isBridge: z.boolean(),
  needCategory: z.string().trim().optional(),
  interests: z
    .array(z.string().trim().min(1))
    .max(3, "En fazla 3 etiket seçebilirsin.")
    .optional(),
});

export const caddeCommentCreateSchema = z.object({
  postId: z.string().min(1),
  body: z
    .string()
    .trim()
    .min(1, "Yorum boş olamaz.")
    .max(2000, "Yorum en fazla 2000 karakter olabilir."),
});

export const caddeReactionSchema = z.object({
  postId: z.string().min(1),
  reactionType: z.enum(["like", "support", "idea"]),
});

export const caddeCafeJoinSchema = z.object({
  cafeId: z.string().min(1),
});

export type CaddePostCreateInput = z.infer<typeof caddePostCreateSchema>;
export type CaddeCommentCreateInput = z.infer<typeof caddeCommentCreateSchema>;

/** İlk Zod hatasını kullanıcıya gösterilebilir Error'a çevirir. */
export function parseWithUserError<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new Error(firstIssue?.message ?? "Geçersiz veri.");
  }
  return result.data;
}

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
  cafeId: z.string().trim().min(1).optional(),
});

const httpUrl = z
  .string()
  .trim()
  .url("Geçerli bir URL gir.")
  .refine((value) => value.startsWith("http://") || value.startsWith("https://"), "URL http(s) ile başlamalı.");

export const caddeCafeCreateSchema = z
  .object({
    title: z.string().trim().min(3, "Cafe adı en az 3 karakter olmalı.").max(80, "Cafe adı en fazla 80 karakter olabilir."),
    summary: z.string().trim().min(1, "Cafe özeti zorunlu.").max(500, "Özet en fazla 500 karakter olabilir."),
    themeKey: z.string().trim().min(1, "Tema seç."),
    country: z.string().optional(),
    city: z.string().optional(),
    isBridge: z.boolean(),
    entryMode: z.enum(["open", "approval", "referral"]),
    referralCode: z.string().trim().optional(),
    entryQuestion: z.string().trim().max(200, "Giriş sorusu en fazla 200 karakter olabilir.").optional(),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    capacity: z.number().int().min(1, "Kapasite 1'den küçük olamaz.").optional(),
    externalLinks: z.array(httpUrl).max(3, "En fazla 3 dış link ekleyebilirsin.").optional(),
  })
  .superRefine((value, ctx) => {
    if (value.entryMode === "referral" && (value.referralCode ?? "").length < 4) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["referralCode"], message: "Davet kodu en az 4 karakter olmalı." });
    }
    if (value.entryMode === "approval" && !(value.entryQuestion ?? "").trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["entryQuestion"], message: "Onaylı giriş için bir soru gir." });
    }
    if (value.startsAt && value.endsAt && new Date(value.endsAt) <= new Date(value.startsAt)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endsAt"], message: "Bitiş başlangıçtan sonra olmalı." });
    }
  });

export const caddeCafeJoinInputSchema = z.object({
  cafeId: z.string().min(1),
  referralCode: z.string().trim().optional(),
  answer: z.string().trim().max(500, "Yanıt en fazla 500 karakter olabilir.").optional(),
});

export const carsiItemCreateSchema = z.object({
  categoryKey: z.string().trim().min(1, "Kategori seç."),
  title: z.string().trim().min(3, "İlan başlığı en az 3 karakter olmalı.").max(100, "İlan başlığı en fazla 100 karakter olabilir."),
  description: z.string().trim().min(1, "İlan açıklaması zorunlu.").max(2000, "Açıklama en fazla 2000 karakter olabilir."),
  priceAmount: z.number().min(0, "Fiyat negatif olamaz.").optional(),
  priceCurrency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Para birimi 3 harfli kod olmalı (örn. EUR).").optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  imageUrls: z.array(httpUrl).max(6, "En fazla 6 görsel ekleyebilirsin.").optional(),
  contactMode: z.enum(["platform", "phone", "email"]).optional(),
});

export const caddePromotionCreateSchema = z
  .object({
    campaignType: z.enum(["business", "consultant", "event", "community", "city_highlight"]),
    title: z.string().trim().min(3, "Kampanya başlığı en az 3 karakter olmalı.").max(100, "Başlık en fazla 100 karakter olabilir."),
    description: z.string().trim().min(1, "Kampanya açıklaması zorunlu.").max(500, "Açıklama en fazla 500 karakter olabilir."),
    targetUrl: z
      .string()
      .trim()
      .min(1, "Hedef URL zorunlu.")
      .refine((value) => value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://"), "Hedef URL '/' veya http(s) ile başlamalı."),
    imageUrl: httpUrl.optional(),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    placements: z
      .array(
        z.object({
          key: z.string().trim().min(1, "Placement seç."),
          country: z.string().optional(),
          city: z.string().optional(),
          themeKeys: z.array(z.string().trim().min(1)).optional(),
        }),
      )
      .min(1, "En az bir placement seç.")
      .max(6, "En fazla 6 placement seçebilirsin."),
  })
  .superRefine((value, ctx) => {
    if (value.startsAt && value.endsAt && new Date(value.endsAt) <= new Date(value.startsAt)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endsAt"], message: "Bitiş başlangıçtan sonra olmalı." });
    }
    if (value.campaignType === "city_highlight" && value.placements.some((item) => item.key !== "city-ambassador-highlight")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["placements"], message: "Şehir Elçisi öne çıkarması yalnız kendi placement'ında yayınlanır." });
    }
  });

export const carsiItemUpdateSchema = z.object({
  itemId: z.string().min(1),
  title: z.string().trim().min(3, "İlan başlığı en az 3 karakter olmalı.").max(100, "İlan başlığı en fazla 100 karakter olabilir.").optional(),
  description: z.string().trim().min(1).max(2000, "Açıklama en fazla 2000 karakter olabilir.").optional(),
  priceAmount: z.number().min(0, "Fiyat negatif olamaz.").optional(),
  priceCurrency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Para birimi 3 harfli kod olmalı (örn. EUR).").optional(),
  status: z.enum(["draft", "published", "paused", "expired"]).optional(),
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

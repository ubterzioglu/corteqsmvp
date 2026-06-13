// src/lib/blog-schemas.ts
// Blog admin formu için zod şeması (react-hook-form + zod resolver).

import { z } from "zod";

export const blogPostFormSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "Slug en az 2 karakter olmalı")
    .max(120, "Slug en fazla 120 karakter olabilir")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug yalnız küçük harf, rakam ve tire içerebilir"),
  title: z.string().trim().min(3, "Başlık en az 3 karakter olmalı").max(200, "Başlık çok uzun"),
  excerpt: z.string().trim().max(400, "Özet en fazla 400 karakter olabilir").or(z.literal("")),
  content_markdown: z.string().trim().min(10, "İçerik en az 10 karakter olmalı"),
  country: z.string().trim().max(60, "Ülke anahtarı çok uzun").or(z.literal("")),
  country_label: z.string().trim().max(80, "Ülke adı çok uzun").or(z.literal("")),
  category: z.enum(["giris-ulasim", "gundelik-butce", "kultur-sosyal", "genel"], {
    errorMap: () => ({ message: "Kategori seçiniz" }),
  }),
  cover_image: z
    .string()
    .trim()
    .url("Geçerli bir görsel URL'si giriniz")
    .or(z.literal(""))
    .nullable(),
  published: z.boolean(),
  sort_order: z
    .number({ invalid_type_error: "Sıra sayısal olmalı" })
    .int("Sıra tam sayı olmalı")
    .min(0, "Sıra negatif olamaz")
    .max(100000, "Sıra çok büyük"),
});

export type BlogPostFormValues = z.infer<typeof blogPostFormSchema>;

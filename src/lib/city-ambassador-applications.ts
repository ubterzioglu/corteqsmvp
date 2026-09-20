/**
 * Şehir Elçisi başvurusu — `public.city_ambassador_applications` yazma katmanı.
 *
 * Tablo canlıda MEVCUTTUR (doğrulandı 2026-09-20, 17 sütun) ve RLS'i şöyledir:
 *   • INSERT "Users can create own applications" → yalnız `authenticated`
 *   • SELECT "Users can view own applications" + "Admins can view all"
 * Yani başvuru GİRİŞ GEREKTİRİR; anonim ziyaretçi formu gönderemez. Sayfa bunu
 * baştan söyler ve giriş bağlantısı gösterir — göndermeye kalkıp 42501 yemez.
 *
 * `status` sütunu NOT NULL ama varsayılanı vardır; yükte GÖNDERİLMEZ (başvuru
 * durumunu ürün tarafı belirler, istemci değil).
 */

import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

/**
 * Başvuru formu şeması.
 *
 * Zorunlu alanlar tablonun NOT NULL sütunlarıyla birebir: ad, e-posta, telefon,
 * şehir, ülke. Geri kalan sorular isteğe bağlıdır ve boş bırakılırsa `null`
 * yazılır (boş string DEĞİL — "cevapsız" ile "boş cevap" ayrımı korunur).
 */
export const cityAmbassadorApplicationSchema = z.object({
  fullName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalı."),
  email: z.string().trim().email("Geçerli bir e-posta adresi girin."),
  phone: z
    .string()
    .trim()
    .min(7, "Telefon numarası çok kısa.")
    // E.164'e yakın gevşek doğrulama: ülke kodundan ÜLKE TÜRETMEZ (CLAUDE.md
    // "Profil formu kuralları" md.3 — +90 numaralı üye Berlin'de yaşıyor olabilir).
    .regex(/^\+?[0-9\s()-]{7,24}$/, "Telefon numarası yalnızca rakam ve + içerebilir."),
  city: z.string().trim().min(2, "Şehir girin."),
  country: z.string().trim().min(2, "Ülke girin."),
  reachCount: z
    .union([z.literal(""), z.coerce.number().int().min(0).max(1_000_000)])
    .optional(),
  reachDescription: z.string().trim().max(500).optional(),
  organizedEvents: z.string().trim().max(1000).optional(),
  knownProfessionals: z.string().trim().max(1000).optional(),
  firstWeekPlan: z.string().trim().max(2000).optional(),
  weeklyHours: z.string().trim().max(120).optional(),
  motivation: z.string().trim().max(2000).optional(),
});

export type CityAmbassadorApplicationInput = z.infer<typeof cityAmbassadorApplicationSchema>;

/** Boş metni `null`'a çevirir — "cevapsız" alanlar DB'de boş string olarak durmasın. */
const orNull = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/**
 * Başvuru sonucu.
 *
 * ⚠️ Bilinçli olarak AYIRICI BİRLEŞİM (`{ok:true} | {ok:false; message}`) DEĞİL.
 * Bu depoda `tsconfig` gevşektir (`strict: false`, `strictNullChecks: false`) ve
 * o birleşimin olumsuz dalı daralmıyor — `result.message` her iki yazımda da
 * TS2339 veriyordu. Tek arayüz + `message: string | null` her yerde derlenir.
 */
export interface SubmitResult {
  ok: boolean;
  /** Yalnız `ok === false` iken doludur. */
  message: string | null;
}

/**
 * Başvuruyu kaydeder.
 *
 * ⚠️ Yük `satisfies TablesInsert<...>` ile doğrulanır, `as` ile CAST EDİLMEZ.
 * CLAUDE.md'nin açık kuralı: cast, olmayan bir sütuna yazmayı derleme zamanında
 * gizler ve hata yalnız canlıda `PGRST204 Could not find the '<sütun>' column`
 * olarak çıkıp formu tamamen düşürür.
 */
export async function submitCityAmbassadorApplication(
  userId: string,
  input: CityAmbassadorApplicationInput,
): Promise<SubmitResult> {
  const payload = {
    user_id: userId,
    full_name: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    city: input.city.trim(),
    country: input.country.trim(),
    reach_count:
      input.reachCount === "" || input.reachCount === undefined ? null : Number(input.reachCount),
    reach_description: orNull(input.reachDescription),
    organized_events: orNull(input.organizedEvents),
    known_professionals: orNull(input.knownProfessionals),
    first_week_plan: orNull(input.firstWeekPlan),
    weekly_hours: orNull(input.weeklyHours),
    motivation: orNull(input.motivation),
  } satisfies TablesInsert<"city_ambassador_applications">;

  const { error } = await supabase.from("city_ambassador_applications").insert(payload);

  if (error) {
    // RPC/PostgREST hataları düz nesnedir, `Error` örneği DEĞİLDİR — bu depoda
    // `instanceof Error`'a daraltmak bir mesaj haritasını aylarca ölü bıraktı.
    const message = typeof error.message === "string" ? error.message : "Başvuru kaydedilemedi.";
    return { ok: false, message };
  }

  return { ok: true, message: null };
}

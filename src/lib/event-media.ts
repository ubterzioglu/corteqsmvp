// Etkinlik kapak görseli yükleme katmanı — TEK giriş noktası.
//
// Bucket: `event-covers` (public read, yazma yalnız kullanıcının kendi `{uid}/` klasörüne).
// Yol şeması: {uid}/{uuid}.{ext}
//
// ✅ Bucket 2026-09-28'de canlıya uygulandı
// (`supabase/migrations/applied/20260928140000_event_covers_bucket.sql`).
//
// Buradaki limitler bucket'ın `file_size_limit` + `allowed_mime_types` değerleriyle
// AYNA sözleşmesidir: birini değiştiren diğerini de günceller
// (`event-media-contract.test.ts` kilitler). Gerçek enforce DB'dedir; bu katman
// kullanıcıya hızlı ve Türkçe geri bildirim verir.
//
// Desen kaynağı: `src/lib/cadde-media.ts`.

import { supabase } from "@/integrations/supabase/client";

const BUCKET = "event-covers";

/** Bucket'taki `file_size_limit` ile AYNI olmak zorunda (ayna sözleşmesi). */
export const EVENT_COVER_MAX_BYTES = 5 * 1024 * 1024;

/** Bucket'taki `allowed_mime_types` ile AYNI olmak zorunda (ayna sözleşmesi). */
export const EVENT_COVER_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

/** `<input type="file" accept=...>` için. Sunucu listesiyle tek kaynaktan türetilir. */
export const EVENT_COVER_ACCEPT = EVENT_COVER_MIME_TYPES.join(",");

export interface EventCoverAsset {
  /** Herkese açık CDN adresi — `events.cover_image` kolonuna bu yazılır. */
  url: string;
  /** Bucket içindeki yol; silmek için gerekir. */
  path: string;
}

const formatMb = (bytes: number): string => `${Math.round(bytes / (1024 * 1024))}MB`;

/**
 * Dosyayı yüklemeden önce doğrular. Dönen değer null ise geçerli; aksi halde
 * kullanıcıya gösterilebilir Türkçe hata mesajıdır.
 *
 * ⚠️ İstemcideki `accept` yalnız bir ÖNERİDİR — dosya seçicide "Tüm dosyalar"a geçen
 * kullanıcı yine de başka tür gönderebilir. Bu yüzden tür burada da denetlenir.
 */
export function validateEventCoverFile(file: File): string | null {
  if (!(EVENT_COVER_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Yalnız JPG, PNG, WebP ve AVIF görselleri yüklenebilir.";
  }
  if (file.size > EVENT_COVER_MAX_BYTES) {
    return `Kapak görseli en fazla ${formatMb(EVENT_COVER_MAX_BYTES)} olabilir.`;
  }
  return null;
}

/** Dosya adından güvenli uzantı türetir (uzantı teknik değerdir → düz toLowerCase doğru). */
const safeExtension = (file: File): string => {
  const raw = file.name.includes(".") ? file.name.split(".").pop() ?? "" : "";
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned ? `.${cleaned}` : "";
};

/**
 * Kapak görselini yükler ve public URL'li asset döner.
 *
 * ⚠️ Ham `file.name` depolama anahtarına GİRMEZ — ad `crypto.randomUUID()` ile kurulur,
 * dosyadan yalnız temizlenmiş uzantı alınır. (`../` ile dizin dışına çıkma denemesi ve
 * sahte klasör oluşturma bu yüzden engellenir; G01'de aynı kusur düzeltilmişti.)
 *
 * ⚠️ `contentType` AÇIKÇA geçilir. Geçilmezse depolanan MIME tarayıcının `file.type`'ı
 * olur ve boş geldiği durumda bucket'ın tür kısıtı yüklemeyi reddeder.
 */
export async function uploadEventCover(file: File): Promise<EventCoverAsset> {
  const problem = validateEventCoverFile(file);
  if (problem) {
    throw new Error(problem);
  }

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) {
    throw new Error("Bu işlem için giriş yapın.");
  }

  const path = `${userId}/${crypto.randomUUID()}${safeExtension(file)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    console.error("[event_cover_upload_error]", { path, error });
    throw new Error("Kapak görseli yüklenemedi. Lütfen tekrar deneyin.");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/**
 * Yüklenmiş kapağı siler. Kullanıcı seçimini kaldırdığında veya yerine yenisini
 * yüklediğinde çağrılır — sessizce başarısız olmaz.
 */
export async function removeEventCover(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    // Yetim dosya kritik değil (kimseye görünmez) ama izlenebilir olmalı.
    console.error("[event_cover_remove_error]", { path, error });
  }
}

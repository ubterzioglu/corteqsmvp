// Cadde medya yükleme katmanı — post / Çarşı ilanı / (Faz 2) cafe dosyaları için TEK giriş noktası.
//
// Bucket: `cadde-media` (public read, yazma yalnız kullanıcının kendi `{uid}/` klasörüne —
// bkz. supabase/migrations/20260730100000_cadde_v1_000_media_bucket.sql).
// Yol şeması: {uid}/{scope}/{uuid}.{ext}
//
// Buradaki limitler DB tarafındaki `cadde_validate_media` ile AYNA sözleşmesidir: birini
// değiştiren diğerini de günceller (bkz. cadde-media.test.ts). Gerçek enforce DB'dedir;
// bu katman kullanıcıya hızlı ve Türkçe geri bildirim verir.

import { supabase } from "@/integrations/supabase/client";

export type CaddeMediaKind = "image" | "video";
export type CaddeMediaScope = "post" | "carsi" | "cafe";

export type CaddeMediaAsset = {
  kind: CaddeMediaKind;
  /** Public CDN URL — feed ve ilan kartları bunu render eder. */
  url: string;
  /** Bucket içi yol; silme için gerekir (URL'den türetilmez). */
  path: string;
  width?: number;
  height?: number;
};

const BUCKET = "cadde-media";

/** SQL `cadde_validate_media` ile aynı olmak zorunda (ayna sözleşmesi). */
export const CADDE_MEDIA_LIMITS = {
  maxImages: 4,
  maxVideos: 1,
  maxImageBytes: 5 * 1024 * 1024,
  maxVideoBytes: 50 * 1024 * 1024,
} as const;

export const CADDE_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export const CADDE_VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;

export const CADDE_MEDIA_ACCEPT = [...CADDE_IMAGE_MIME_TYPES, ...CADDE_VIDEO_MIME_TYPES].join(",");

export function resolveCaddeMediaKind(mimeType: string): CaddeMediaKind | null {
  if ((CADDE_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)) return "image";
  if ((CADDE_VIDEO_MIME_TYPES as readonly string[]).includes(mimeType)) return "video";
  return null;
}

const formatMb = (bytes: number): string => `${Math.round(bytes / (1024 * 1024))}MB`;

/**
 * Tek dosyayı yüklemeden önce doğrular. Dönen değer null ise dosya geçerli;
 * aksi halde kullanıcıya gösterilebilir Türkçe hata mesajıdır.
 */
export function validateCaddeMediaFile(file: File, existing: readonly CaddeMediaAsset[]): string | null {
  const kind = resolveCaddeMediaKind(file.type);
  if (!kind) {
    return "Yalnız JPG, PNG, WebP, GIF, AVIF görselleri ve MP4, WebM, MOV videoları yüklenebilir.";
  }

  if (kind === "image") {
    if (file.size > CADDE_MEDIA_LIMITS.maxImageBytes) {
      return `Görsel en fazla ${formatMb(CADDE_MEDIA_LIMITS.maxImageBytes)} olabilir.`;
    }
    const imageCount = existing.filter((asset) => asset.kind === "image").length;
    if (imageCount >= CADDE_MEDIA_LIMITS.maxImages) {
      return `En fazla ${CADDE_MEDIA_LIMITS.maxImages} görsel ekleyebilirsin.`;
    }
    return null;
  }

  if (file.size > CADDE_MEDIA_LIMITS.maxVideoBytes) {
    return `Video en fazla ${formatMb(CADDE_MEDIA_LIMITS.maxVideoBytes)} olabilir.`;
  }
  const videoCount = existing.filter((asset) => asset.kind === "video").length;
  if (videoCount >= CADDE_MEDIA_LIMITS.maxVideos) {
    return "Bir paylaşıma yalnız 1 video ekleyebilirsin.";
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
 * Dosyayı `cadde-media` bucket'ına yükler ve public URL'li asset döner.
 * Doğrulama çağıran tarafından `validateCaddeMediaFile` ile yapılmalıdır —
 * burada yalnız oturum ve storage hataları ele alınır.
 */
export async function uploadCaddeMedia(file: File, scope: CaddeMediaScope): Promise<CaddeMediaAsset> {
  const kind = resolveCaddeMediaKind(file.type);
  if (!kind) {
    throw new Error("Desteklenmeyen dosya tipi.");
  }

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) {
    throw new Error("Bu işlem için giriş yapın.");
  }

  const path = `${userId}/${scope}/${crypto.randomUUID()}${safeExtension(file)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    console.error("[cadde_media_upload_error]", { path, scope, error });
    throw new Error("Dosya yüklenemedi. Lütfen tekrar dene.");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { kind, url: data.publicUrl, path };
}

/**
 * Yüklenmiş dosyayı siler. Kullanıcı composer'dan bir eki kaldırdığında ve
 * paylaşım gönderilmeden vazgeçildiğinde çağrılır — sessizce başarısız olmaz.
 */
export async function removeCaddeMedia(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    // Yetim dosya kritik değil (bucket'ta kalır, kimseye görünmez) ama izlenebilir olmalı.
    console.error("[cadde_media_remove_error]", { path, error });
  }
}

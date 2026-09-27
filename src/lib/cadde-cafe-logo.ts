// m135: Kafe logosu — dosya doğrulama + URL sözleşmesi.
//
// SQL aynası: update_cadde_cafe_logo_v1 (20260925170000_cadde_cafe_onay_bildirimsiz_logo_dogrulama.sql)
// yalnız `cadde-media/{uid}/cafe/{dosya}` public URL'sini kabul eder. Desen iki tarafta
// aynıdır; birini değiştiren diğerini de günceller (cadde-cafe-logo.test.ts kilitler).

import { CADDE_MEDIA_LIMITS, resolveCaddeMediaKind } from "@/lib/cadde-media";

export const CADDE_CAFE_LOGO_URL_PATTERN =
  /^https:\/\/[^/?#]+\/storage\/v1\/object\/public\/cadde-media\/[0-9a-f-]{36}\/cafe\/[A-Za-z0-9._-]+$/;

/** DB'den gelen logo adresini yalnız kendi bucket'ımızı gösteriyorsa kabul eder. */
export function isCaddeCafeLogoUrl(value: unknown): value is string {
  return typeof value === "string" && CADDE_CAFE_LOGO_URL_PATTERN.test(value);
}

/** Logo yalnız görsel olabilir (video değil). Geçerliyse null, değilse Türkçe mesaj. */
export function validateCaddeCafeLogoFile(file: File): string | null {
  if (resolveCaddeMediaKind(file.type) !== "image") {
    return "Logo için yalnız JPG, PNG, WebP, GIF veya AVIF görseli yüklenebilir.";
  }
  if (file.size > CADDE_MEDIA_LIMITS.maxImageBytes) {
    return `Logo en fazla ${Math.round(CADDE_MEDIA_LIMITS.maxImageBytes / (1024 * 1024))}MB olabilir.`;
  }
  return null;
}

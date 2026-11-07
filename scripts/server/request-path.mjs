// server.mjs istek yolu normalizasyonu — saf fonksiyon, ayrı modül.
//
// Neden ayrı (2026-11-07): server.mjs import edildiği anda dist/env-config.js yazar ve
// port dinlemeye başlar; bu yüzden test edilemiyordu. Önceki `server.test.mjs` bu
// fonksiyonun KOPYASINI test ediyordu (gerçek kod değişse yine geçerdi) ve hiç
// koşmuyordu (vitest include'u kökteki dosyayı kapsamıyordu; `node:test` ile de yanlış
// beklentiyle kırmızıydı).
//
// ⚠️ server.mjs PRODÜKSİYON runtime'ı DEĞİLDİR (prod = nginx). Bu, yerel `npm run start`
// ve nixpacks yoludur.

import path from "node:path";

/**
 * İstek URL'sini `distDir` içine HAPSEDİLMİŞ bir posix yoluna çevirir; dışarı çıkan ya da
 * ters eğik çizgi içeren her istek için `null` döner.
 *
 * Not: WHATWG URL ayrıştırıcısı `..` ve `%2e%2e` nokta bölümlerini ÖNCEDEN çözer —
 * `/../etc/passwd` buraya `/etc/passwd` olarak gelir ve `dist/etc/passwd`'ye hapsolur
 * (dosya yok → 404). Güvenlik iddiası "null döner" değil, "distDir dışına çıkamaz"dır.
 */
export function normalizeRequestPath(requestUrl, distDir) {
  const pathname = new URL(requestUrl, "http://localhost").pathname;
  const decodedPath = decodeURIComponent(pathname);

  // SG8: Windows backslash traversal koruması
  if (decodedPath.includes("\\")) {
    return null;
  }

  const normalizedPath = path.posix.normalize(decodedPath);

  if (normalizedPath.startsWith("/..")) {
    return null;
  }

  // SG8: distDir dışında dosya erişimini engelle
  const resolvedPath = path.resolve(distDir, "." + normalizedPath);
  if (!resolvedPath.startsWith(path.resolve(distDir))) {
    return null;
  }

  return normalizedPath;
}

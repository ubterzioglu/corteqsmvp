/**
 * Kariyer sayfası çapaları (KR05).
 *
 * Bileşen dosyasından AYRI durur: bir bileşen dosyası bileşen dışında bir şey
 * ihraç ederse Vite'ın hızlı yenilemesi (fast refresh) o dosyada çalışmaz ve
 * ESLint bunu uyarı olarak bildirir.
 *
 * ⚠️ Çapa biçimi `#ilan-<id>` — `CareerPositionList` içindeki derin bağlantı
 * okuyucusu ve `CareerInternProgram`'ın bölüm `id`'si aynı biçimi varsayar.
 * Birini değiştiren üçünü birden değiştirir.
 */
export const positionAnchorId = (jobId: string) => `ilan-${jobId}`;

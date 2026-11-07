/**
 * Tekrarlanan tarih+saat biçimleyicilerinin ortak yeri (W3 tekilleştirme).
 *
 * Saat dilimi VERİLMEZ: çıktı bilinçli olarak tarayıcının yerel saat dilimini
 * izler (eski çağrı yerleriyle birebir aynı davranış).
 *
 * ⚠️ Biçimleyici HER ÇAĞRIDA kurulur, modül ölçeğinde önbelleğe ALINMAZ:
 * `Intl.DateTimeFormat` kurulduğu anın varsayılan saat dilimini sabitler. Sekme
 * açıkken işletim sisteminin saat dilimi değişirse (yolculuk) önbellekli sürüm eski
 * dilimde kalırdı; eski çağrı yerleri her çağrıda yeniden okuyordu (07.11 inceleme,
 * test dosyası kilitler).
 *
 * Boş/null/NaN yedek metni burada DEĞİL, çağrı yerinde durur — yönetici
 * ekranlarında "-" ve "—" farklı yerlerde farklı kullanılıyor.
 */

const LONG_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

const SHORT_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

/**
 * "7 Kasım 2026 14:30" biçimi.
 *
 * `Date#toLocaleString` / `toLocaleDateString` geçersiz tarihte "Invalid Date"
 * döner, `Intl.DateTimeFormat#format` ise RangeError fırlatır. Eski çağrı yerleri
 * bu ikisini kullandığı için geçersiz girdide ekranı çökertmemek adına aynı metin
 * korunur. (`toLocaleDateString` verilen hour/minute'u ATMAZ — saat seçenekli
 * eski çağrılar bu biçimle birebir aynıdır; test dosyası kilitler.)
 */
export function formatLongDateTimeTR(value: string | number | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat("tr-TR", LONG_DATE_TIME_OPTIONS).format(date);
}

/**
 * "07 Kas 2026 14:30" biçimi. Geçersiz tarihte `Intl.DateTimeFormat`
 * davranışı aynen korunur (RangeError) — eski radar yardımcıları da öyleydi.
 */
export function formatShortDateTimeTR(value: string | number | Date): string {
  return new Intl.DateTimeFormat("tr-TR", SHORT_DATE_TIME_OPTIONS).format(new Date(value));
}

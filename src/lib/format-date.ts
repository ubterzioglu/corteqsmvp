/**
 * Tekrarlanan tarih / tarih+saat biçimleyicilerinin ortak yeri (W3 tekilleştirme).
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
 *
 * Geçersiz tarih iki AYRI sözleşmedir ve her yardımcı eski çağrı yerininkini korur:
 * `Date#toLocaleString` / `toLocaleDateString` "Invalid Date" DÖNER,
 * `Intl.DateTimeFormat#format` ise RangeError FIRLATIR.
 */

type DateInput = string | number | Date;

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

const SHORT_DAY_MONTH_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

const SHORT_DAY_MONTH_OPTIONS: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };

const PADDED_LONG_DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" };

const LONG_DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

/** `Intl.DateTimeFormat#format` sözleşmesi: geçersiz tarihte RangeError fırlatır. */
function formatOrThrow(options: Intl.DateTimeFormatOptions, value: DateInput): string {
  return new Intl.DateTimeFormat("tr-TR", options).format(new Date(value));
}

/** `Date#toLocale*String` sözleşmesi: geçersiz tarihte "Invalid Date" döner, fırlatmaz. */
function formatOrInvalid(options: Intl.DateTimeFormatOptions, value: DateInput): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat("tr-TR", options).format(date);
}

/**
 * "7 Kasım 2026 14:30" biçimi.
 *
 * Eski çağrı yerleri `toLocaleString` / `toLocaleDateString` kullandığı için geçersiz
 * girdide ekranı çökertmemek adına "Invalid Date" korunur. (`toLocaleDateString`
 * verilen hour/minute'u ATMAZ — saat seçenekli eski çağrılar bu biçimle birebir
 * aynıdır; test dosyası kilitler.)
 */
export function formatLongDateTimeTR(value: DateInput): string {
  return formatOrInvalid(LONG_DATE_TIME_OPTIONS, value);
}

/**
 * "07 Kas 2026 14:30" biçimi. Geçersiz tarihte `Intl.DateTimeFormat`
 * davranışı aynen korunur (RangeError) — eski radar yardımcıları da öyleydi.
 */
export function formatShortDateTimeTR(value: DateInput): string {
  return formatOrThrow(SHORT_DATE_TIME_OPTIONS, value);
}

/**
 * "07 Kas 14:30" biçimi (yılsız) — Cadde akış, kafe ve profil kartları.
 * Geçersiz tarihte RangeError (eski Cadde yardımcıları `Intl#format` kullanıyordu).
 */
export function formatShortDayMonthTimeTR(value: DateInput): string {
  return formatOrThrow(SHORT_DAY_MONTH_TIME_OPTIONS, value);
}

/** "07 Kas" biçimi (yılsız) — ilan listesi ve Çarşı kartları. Geçersiz tarihte RangeError. */
export function formatShortDayMonthTR(value: DateInput): string {
  return formatOrThrow(SHORT_DAY_MONTH_OPTIONS, value);
}

/** "07 Kasım 2026" biçimi — Diaspora haber detayı ve Çarşı ilan detayı. Geçersiz tarihte RangeError. */
export function formatPaddedLongDateTR(value: DateInput): string {
  return formatOrThrow(PADDED_LONG_DATE_OPTIONS, value);
}

/**
 * "7 Kasım 2026" biçimi — revizyon istekleri ve grup şikayeti bekleme süresi.
 * Eski çağrı yerleri `toLocaleDateString` kullanıyordu: geçersiz tarihte "Invalid Date".
 */
export function formatLongDateTR(value: DateInput): string {
  return formatOrInvalid(LONG_DATE_OPTIONS, value);
}

// Etkinlik kategori ve tür DEĞERLERİ — tek kaynak.
//
// NEDEN AYRI BİR MODÜL: 19 Eylül 2026'da bu listeler üç ayrı dosyada birbirinden
// bağımsız yazılıydı ve herkese açık form (`CreateEventFormSection`) değerleri
// Türkçe karakterlerinden arındırılmış hâlleriyle yazıyordu:
//
//   form:    "yuz yuze" · "egitim" · "kultur" · "is"
//   liste:   "yüz yüze" · "eğitim" · "kültür" · "iş"
//
// `events.type` üzerinde CHECK kısıtı YOKTUR — yanlış değer hata vermeden kaydedilir.
// Sonuç: formdan eklenen etkinlik "Fiziksel" filtresine düşmez, detay sayfasında
// konumu görünmez, admin tür filtresine takılmaz. Hiçbir test, lint ya da kısıt bunu
// yakalamaz; yalnız `type` alanını tsc yakalamıştı, `category` alanı `string` olduğu
// için o tamamen sessizdi.
//
// DEĞERLER KULLANICIYA GÖRÜNEN METİN DEĞİL, VERİTABANI ANAHTARIDIR. Etiketi
// (`label`) serbestçe değiştirebilirsin; `value` alanına dokunmak canlı veriyi
// böler. Mevcut satırlar `supabase/baseline/2026-08-04-public-schema.sql` içinde
// `type text DEFAULT 'yüz yüze'` ile üretilmiştir.
//
// Sözleşme testi: `src/lib/events-vocabulary.test.ts` — etkinlik dosyalarının
// kendi rakip listesini tanımlamadığını ve ASCII'ye düşürülmüş değerlerin geri
// gelmediğini denetler.

export const EVENT_TYPE_VALUES = ["yüz yüze", "online", "hybrid"] as const;

export type EventType = (typeof EVENT_TYPE_VALUES)[number];

export const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "yüz yüze", label: "Fiziksel" },
  { value: "online", label: "Dijital" },
  { value: "hybrid", label: "Hibrit" },
];

export const EVENT_CATEGORY_VALUES = [
  "networking",
  "eğitim",
  "kültür",
  "iş",
  "sosyal",
  "spor",
] as const;

export type EventCategory = (typeof EVENT_CATEGORY_VALUES)[number];

export const EVENT_CATEGORY_OPTIONS: { value: EventCategory; label: string }[] = [
  { value: "networking", label: "Networking" },
  { value: "eğitim", label: "Eğitim" },
  { value: "kültür", label: "Kültür & Sanat" },
  { value: "iş", label: "İş & Kariyer" },
  { value: "sosyal", label: "Sosyal" },
  { value: "spor", label: "Spor" },
];

/** Formların varsayılanı; `events.type` sütununun DB varsayılanıyla aynıdır. */
export const DEFAULT_EVENT_TYPE: EventType = "yüz yüze";

/**
 * Rozet/başlık metni. Girdi `string`'tir çünkü DB'de eski ya da elle girilmiş
 * değerler olabilir; tanınmayan her şey "Fiziksel" sayılır (eski davranış).
 */
export function eventTypeLabel(type: string): string {
  if (type === "online") return "Dijital";
  if (type === "hybrid") return "Hibrit";
  return "Fiziksel";
}

/** Fiziksel mekan alanları (ülke/şehir/adres) bu türlerde anlamlıdır. */
export function isPhysicalEventType(type: string): boolean {
  return type === "yüz yüze" || type === "hybrid";
}

/** Çevrim içi katılım bağlantısı bu türlerde anlamlıdır. */
export function isOnlineEventType(type: string): boolean {
  return type === "online" || type === "hybrid";
}

/** Bilinmeyen/boş değeri varsayılana çeker — form state'ini güvenle daraltmak için. */
export function normalizeEventType(value: unknown): EventType {
  return EVENT_TYPE_VALUES.includes(value as EventType) ? (value as EventType) : DEFAULT_EVENT_TYPE;
}

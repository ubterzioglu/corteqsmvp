// Etkinlik formu taslağı — Google OAuth yönlendirmesi boyunca yaşar.
//
// SORUN: 19 Eylül 2026'da form "önce doldur, gönderirken üyelik sor" akışına
// çevrildi. Üye olmayan kullanıcı Gönder'e basınca `signInWithOAuth` tarayıcıyı
// Google'a götürüyor ve dönüşte `/events` SIFIRDAN yükleniyor — React state'i
// gitmiş, kullanıcının doldurduğu her şey kaybolmuş oluyordu. Yani akışın vaat
// ettiği şey ("emeğin boşa gitmesin") tam tersine dönmüştü.
//
// NEDEN sessionStorage: taslak yalnız bu gidiş-dönüş için gerekli. localStorage'da
// kalsaydı kullanıcı haftalar sonra siteyi açtığında yarım kalmış bir formla
// karşılaşırdı. Sekme kapanınca kendiliğinden ölmesi doğru davranıştır.
//
// NEDEN TTL de var: OAuth bir kere yarıda kesilirse (kullanıcı Google ekranında
// vazgeçip geri gelirse) taslak sekmede asılı kalır. 30 dakika sonra düşer.
//
// Depolama erişimi gizli sekmede / çerezler kapalıyken ATAR; buradaki hiçbir
// fonksiyon fırlatmaz — taslak bir kolaylıktır, form akışını bozamaz.

import { normalizeEventType, type EventType } from "@/lib/events-vocabulary";
import { sanitizeEventTimezone } from "@/lib/events-timezone";

const STORAGE_KEY = "corteqs.events.createDraft";

/** Taslağın ömrü. OAuth gidiş-dönüşü saniyeler sürer; 30 dakika fazlasıyla yeter. */
export const EVENT_FORM_DRAFT_TTL_MS = 30 * 60 * 1000;

export interface EventFormDraft {
  title: string;
  description: string;
  category: string;
  type: EventType;
  eventDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  country: string;
  city: string;
  location: string;
  onlineUrl: string;
  price: string;
  maxAttendees: string;
  coverImage: string;
  tags: string[];
  organizerName: string;
  registrationUrl: string;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Gönder'e basıldığında, kullanıcı Google'a gitmeden HEMEN önce çağrılır. */
export function rememberEventFormDraft(draft: EventFormDraft): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, at: Date.now() }));
  } catch {
    /* taslak bir kolaylıktır; yazılamaması gönderimi engellemez */
  }
}

/** Taslak geri yüklendikten ya da form başarıyla gönderildikten sonra çağrılır. */
export function forgetEventFormDraft(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* yoksay */
  }
}

/**
 * Geçerli bir taslak varsa döner, yoksa `null`.
 *
 * Eksik/bozuk alanlar sessizce boşa düşer: yarım bir taslak, hiç taslak
 * olmamasından iyidir ve kullanıcı her alanı yine de düzenleyebilir.
 */
export function readEventFormDraft(): EventFormDraft | null {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;

  const record = parsed as Record<string, unknown>;
  if (typeof record.at !== "number" || Date.now() - record.at > EVENT_FORM_DRAFT_TTL_MS) {
    return null;
  }

  return {
    title: text(record.title),
    description: text(record.description),
    category: text(record.category),
    type: normalizeEventType(record.type),
    eventDate: text(record.eventDate),
    startTime: text(record.startTime),
    endTime: text(record.endTime),
    timezone: sanitizeEventTimezone(record.timezone),
    country: text(record.country),
    city: text(record.city),
    location: text(record.location),
    onlineUrl: text(record.onlineUrl),
    price: text(record.price),
    maxAttendees: text(record.maxAttendees),
    coverImage: text(record.coverImage),
    tags: Array.isArray(record.tags) ? record.tags.filter((tag): tag is string => typeof tag === "string") : [],
    organizerName: text(record.organizerName),
    registrationUrl: text(record.registrationUrl),
  };
}

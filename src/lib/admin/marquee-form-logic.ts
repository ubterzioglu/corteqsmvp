// AdminMarqueePage form mantığı (C04b).
//
// Sayfa 590 satırdı, 9 `useState` taşıyordu ve HİÇ testi yoktu. C02–C04'teki sıra
// aynen: React'tan bağımsız çalışabilen parçalar önce buraya, sonra bağlama.
//
// ⚠️ Buraya yalnız SAF şey girer. State, Supabase çağrısı ve `toast` sayfada kalır.

import type { MarqueeItemRow } from "@/lib/marquee";

export type MarqueeItemType = "news" | "stat" | "announcement";

export type MarqueeFormState = {
  type: MarqueeItemType;
  slug: string;
  title: string;
  summary: string;
  detail_content: string;
  image_url: string;
  image_alt: string;
  metric_value: string;
  link_enabled: boolean;
  sort_order: string;
  is_active: boolean;
  published_at: string;
};

/** `<input type="datetime-local">` biçimi: saniye YOK, 16 karakter. */
const DATETIME_LOCAL_LENGTH = 16;

/**
 * UTC damgasını `<input type="datetime-local">` değerine çevirir.
 *
 * ⚠️ Saat dilimi kaydırması ELLE yapılır ve bu bilinçlidir: `toISOString()` her zaman
 * UTC verir, ama `datetime-local` girdisi YEREL duvar saati bekler. Kaydırma
 * yapılmazsa UTC'nin doğusundaki kullanıcı saati GERİ, batısındaki İLERİ görür ve
 * kaydettiğinde yayın saati kayar — form doğru görünür, veri sessizce yanlış olur.
 * (Aynı sınıf `events-timezone.ts`'te de belgelenmiştir.)
 *
 * Geçersiz girdide ŞİMDİ döner: boş bir alan göstermek kullanıcıya tarihin
 * silindiğini düşündürürdü.
 */
export function toLocalInputValue(value: string, now: Date = new Date()): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return now.toISOString().slice(0, DATETIME_LOCAL_LENGTH);

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, DATETIME_LOCAL_LENGTH);
}

/** Yeni kayıt formu. Fabrika olmalı: sabit nesne paylaşılırsa formlar birbirine sızar. */
export function emptyMarqueeForm(now: Date = new Date()): MarqueeFormState {
  return {
    type: "news",
    slug: "",
    title: "",
    summary: "",
    detail_content: "",
    image_url: "",
    image_alt: "",
    metric_value: "",
    link_enabled: false,
    sort_order: "0",
    is_active: true,
    published_at: now.toISOString().slice(0, DATETIME_LOCAL_LENGTH),
  };
}

/**
 * DB satırını form durumuna çevirir.
 *
 * ⚠️ `type` beyaz listeye düşürülür: tanınmayan bir değer gelirse `"news"` kabul
 * edilir. Ham değeri geçirmek `<Select>`i BOŞ gösterirdi ve kullanıcı kaydettiğinde
 * türü sessizce değiştirmiş olurdu.
 */
export function marqueeRowToFormState(item: MarqueeItemRow): MarqueeFormState {
  const type: MarqueeItemType =
    item.type === "news" || item.type === "stat" || item.type === "announcement"
      ? item.type
      : "news";

  return {
    type,
    slug: item.slug ?? "",
    title: item.title,
    summary: item.summary,
    detail_content: item.detail_content ?? "",
    image_url: item.image_url ?? "",
    image_alt: item.image_alt ?? "",
    metric_value: item.metric_value ?? "",
    link_enabled: item.link_enabled,
    sort_order: String(item.sort_order),
    is_active: item.is_active,
    published_at: toLocalInputValue(item.published_at),
  };
}

/** Boş metni `null`a çevirir (form alanı → nullable kolon). */
export function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/**
 * Haber tarihini Türkçe biçimde gösterir.
 *
 * ⚠️ `localeCompare`/`Intl` çağrısında dil ETİKETİ verilmelidir (`"tr-TR"`): çalışma
 * ortamının varsayılanına bırakılırsa ay adı İngilizce çıkar ve bunu yalnız o
 * ortamda çalışan fark eder.
 */
export function formatMarqueeNewsDate(value: string | null): string {
  if (!value) return "Tarih yok";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tarih yok";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

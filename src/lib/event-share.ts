// Etkinlik paylaşım bağlantıları — tek kaynak.
//
// NEDEN AYRI MODÜL: paylaşım düğmeleri 20 Eylül 2026'ya kadar YALNIZ detay
// sayfasının içine gömülüydü (`EventDetailPage.tsx`). Liste kartına da eklemek
// istendiğinde tek seçenek dört `window.open` çağrısını kopyalamaktı; bu, iki
// kopyanın zamanla ayrışacağı (biri WhatsApp'ı unutur, biri metni farklı
// kurar) klasik durumdur. Bağlantı kurma mantığı burada, saf fonksiyonlarda.
//
// Paylaşım metni ASLA ham açıklamanın tamamı değildir: X'in 280 karakter sınırı
// ve WhatsApp önizlemesi için kırpılır.

/** Paylaşım metninde açıklamadan alınan en fazla karakter. */
export const EVENT_SHARE_DESCRIPTION_LIMIT = 200;

export type EventShareInput = {
  title: string;
  description: string;
  /** Etkinliğin tam URL'i (`https://corteqs.net/events/<id>`). */
  url: string;
};

export type EventShareTarget = {
  key: string;
  label: string;
  buildHref: (input: EventShareInput) => string;
};

/** Başlık + kırpılmış açıklama. Kırpma kelime ortasında bırakmaz. */
export function buildEventShareText(input: Pick<EventShareInput, "title" | "description">): string {
  const description = input.description.trim();
  if (!description) return input.title;

  if (description.length <= EVENT_SHARE_DESCRIPTION_LIMIT) {
    return `${input.title}\n${description}`;
  }

  const cut = description.slice(0, EVENT_SHARE_DESCRIPTION_LIMIT);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd();
  return `${input.title}\n${trimmed}…`;
}

/** Etkinliğin paylaşılabilir tam adresi. `origin` testlerde sabitlenebilsin diye parametre. */
export function buildEventShareUrl(eventId: string, origin: string): string {
  return `${origin.replace(/\/+$/, "")}/events/${eventId}`;
}

/**
 * Platform sırası bilinçlidir: diasporada WhatsApp en çok kullanılan paylaşım
 * kanalıdır, LinkedIn iş/kariyer etkinliklerinde ikinci sıradadır.
 */
export const EVENT_SHARE_TARGETS: EventShareTarget[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    buildHref: (input) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${buildEventShareText(input)}\n${input.url}`)}`,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    // LinkedIn yalnız URL alır; metni kendi Open Graph etiketlerinden çeker.
    buildHref: (input) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(input.url)}`,
  },
  {
    key: "x",
    label: "X / Twitter",
    buildHref: (input) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildEventShareText(input))}&url=${encodeURIComponent(input.url)}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    buildHref: (input) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(input.url)}&quote=${encodeURIComponent(buildEventShareText(input))}`,
  },
];

// Composer'ın veri sözleşmesi — CaddeComposer bileşeni ile CaddePage arasında paylaşılır.
// Bileşen dosyasından ayrı durur ki React Fast Refresh bozulmasın (yalnız bileşen export'u kalsın).

import type { CaddeMediaAsset, CaddePostMention, CaddePostType, CarsiContactMode } from "@/lib/cadde-types";

/**
 * Post tipi enum'larının kullanıcıya görünen Türkçe etiketleri.
 * Composer'daki tür seçici ve feed kartındaki tür rozeti aynı kaynaktan beslenir.
 * "İlan / Teklif" bireysel kullanıcının ikinci el / yardım / hizmet paylaşımını kapsar.
 */
export const POST_TYPE_LABELS: Record<CaddePostType, string> = {
  text: "Paylaşım",
  question: "Soru",
  offer: "İlan / Teklif",
  event: "Etkinlik",
};

export type CaddeComposerValue = {
  type: CaddePostType;
  title: string;
  body: string;
  interests: string[];
  /** Paylaşım hedefi: boş = aktif filtredeki ilk seçim kullanılır. */
  country: string;
  city: string;
  media: CaddeMediaAsset[];
  /** @mention ile seçilen hedefler; gövdedeki metinle display_label üzerinden eşleşir. */
  mentions: CaddePostMention[];
};

export const emptyCaddeComposer: CaddeComposerValue = {
  type: "text",
  title: "",
  body: "",
  interests: [],
  country: "",
  city: "",
  media: [],
  mentions: [],
};

// ── Çarşı ilan formu ────────────────────────────────────────────────────────
// Bileşen dosyasından ayrı durur ki Fast Refresh bozulmasın (CaddeComposer ile aynı gerekçe).

export type CarsiFormValue = {
  categoryKey: string;
  title: string;
  description: string;
  /** Ham metin: boş = fiyat belirtilmedi, "0" = ücretsiz. */
  price: string;
  currency: string;
  country: string;
  city: string;
  media: CaddeMediaAsset[];
  contactMode: CarsiContactMode;
  contactValue: string;
};

export const emptyCarsiForm: CarsiFormValue = {
  categoryKey: "",
  title: "",
  description: "",
  price: "",
  currency: "EUR",
  country: "",
  city: "",
  media: [],
  contactMode: "platform",
  contactValue: "",
};

// Composer'ın veri sözleşmesi — CaddeComposer bileşeni ile CaddePage arasında paylaşılır.
// Bileşen dosyasından ayrı durur ki React Fast Refresh bozulmasın (yalnız bileşen export'u kalsın).

import type { CaddeMediaAsset, CaddePostType } from "@/lib/cadde-types";

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
};

export const emptyCaddeComposer: CaddeComposerValue = {
  type: "text",
  title: "",
  body: "",
  interests: [],
  country: "",
  city: "",
  media: [],
};

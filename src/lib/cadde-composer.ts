// Composer'ın veri sözleşmesi — CaddeComposer bileşeni ile CaddePage arasında paylaşılır.
// Bileşen dosyasından ayrı durur ki React Fast Refresh bozulmasın (yalnız bileşen export'u kalsın).

import type { CaddeMediaAsset, CaddePostMention, CaddePostTargetInput, CaddePostType, CarsiContactMode } from "@/lib/cadde-types";

// NOT (F6+F8, workshop m5/m17): POST_TYPE_LABELS kaldırıldı — tür seçici composer'dan,
// tür rozeti feed kartından söküldü; tip etiketi artık hiçbir yerde gösterilmiyor.
// CaddePostType enum'u ve type alanı VERİ SÖZLEŞMESİ olarak durur (eski postlar + RPC).

export type CaddeComposerValue = {
  type: CaddePostType;
  title: string;
  body: string;
  interests: string[];
  /** Paylaşım hedefi: boş = kayıtlı profil konumu kullanılır. */
  country: string;
  city: string;
  /** F22: ek hedefler. İlk hedef country/city alanlarıdır; burada yalnız +1 ek hedef tutulur. */
  targets: CaddePostTargetInput[];
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
  targets: [],
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

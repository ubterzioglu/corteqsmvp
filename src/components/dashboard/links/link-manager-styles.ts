// Birleşik Kaynak Merkezi ekranının paylaşılan Tailwind sınıf demetleri.
// Alt bileşenler aynı görünümü koruyabilsin diye tek yerde tutulur; sınıf
// dizgeleri parçalandığında görünüm sessizce ayrışır.

export const INPUT_CLS =
  'w-full rounded-xl border border-[rgba(66,133,244,0.15)] bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

export const BTN_CLS =
  'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all disabled:opacity-60'

export const ICON_BTN_CLS =
  'inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-60'

export const FILTER_BTN_CLS =
  'rounded-full border px-3 py-2 text-xs font-semibold tracking-wide transition-all'

export const FIELD_LABEL_CLS = 'text-xs font-semibold uppercase tracking-widest text-gray-500'

/** Dosya yükleme alanının kabul ettiği uzantılar (kayıt türüne göre). */
export const CV_FILE_ACCEPT = '.pdf,.doc,.docx'
export const ARGE_FILE_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.svg,.webp,.zip,.rar,.7z,.txt,.csv,.md,.json'

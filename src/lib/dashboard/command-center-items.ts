// Komuta Merkezi (Command Center) veri katmanı — ince BARREL.
//
// Gerçek içerik `command-center-items/` altındaki parça modüllerdedir; bu dosya
// yalnız aynı public API'yi AYNI SIRADA yeniden dışa aktarır, böylece hiçbir
// import yolu değişmez (`@/lib/dashboard/command-center-items`).
//
// Parçalar:
//   types.ts            — satır/alan/seçenek tip sözleşmesi
//   labels.ts           — durum/atama/tip etiketleri, toplantı kategorisi eşlemesi
//   date-groups.ts      — üst kategori + tarih grubu türetimi (WA haftalık kova)
//   sorting.ts          — panoda görünen sıralama kuralları
//   row-mapping.ts      — PostgREST kolon listesi + satır → alan eşlemesi
//   form-state.ts       — form durumu üretimi ve doğrulama
//   filters.ts          — filtreleri VERİ olarak kurar (TS2589 kaçınması)
//   queries.ts          — okuma sorguları (aktif / silinmiş / arşivlenmiş)
//   mutations.ts        — ekle / güncelle / yumuşak sil / arşivle
//   facets.ts           — facet view okuması ve ortak facet yardımcıları
//   facet-options.ts    — facet'ten filtre seçenekleri
//   facet-summaries.ts  — facet'ten rozet sayıları + kaynak dökümü
//   grouping.ts         — kayıt ağacı (üst kategori → tip → tarih)
//
// ⚠️ `queries.ts` içindeki `let query: any` + `eslint-disable` deseni bilinçlidir
// (TS2589); bölme sırasında olduğu gibi taşındı, bozmayın.

export {
  COMMAND_CENTER_ITEM_TYPES,
  COMMAND_CENTER_PRIORITY_OPTIONS,
} from './command-center-items/types'
export type {
  CommandCenterItemType,
  CommandCenterAssignee,
  CommandCenterStatus,
  CommandCenterPriority,
  CommandCenterItemRow,
  CommandCenterItem,
  CommandCenterFormState,
  FetchCommandCenterItemsOptions,
  CommandCenterItemsResult,
  CommandCenterItemCounts,
  CommandCenterFacetRow,
  CommandCenterSourceKind,
  CommandCenterSourceEntry,
  CommandCenterSourceSection,
  CommandCenterSourceBreakdown,
  CommandCenterCategoryOption,
  CommandCenterDateGroupOption,
  CommandCenterDateGroupInfo,
  CommandCenterDateGroup,
  CommandCenterItemTypeGroup,
  CommandCenterTopCategoryGroup,
} from './command-center-items/types'

export { COMMAND_CENTER_SELECT, mapCommandCenterRow } from './command-center-items/row-mapping'

export {
  createEmptyCommandCenterFormState,
  toCommandCenterFormState,
  validateCommandCenterFormState,
} from './command-center-items/form-state'

export {
  getCommandCenterItemLabel,
  getCommandCenterStatusLabel,
  getCommandCenterAssigneeLabel,
  formatCommandCenterCategoryLabel,
} from './command-center-items/labels'

export {
  getCommandCenterTopCategoryLabel,
  getCommandCenterDateGroupInfo,
} from './command-center-items/date-groups'

export {
  sortCommandCenterCategoryOptions,
  sortCommandCenterDateGroupOptions,
  sortCommandCenterItems,
} from './command-center-items/sorting'

export {
  fetchCommandCenterItems,
  fetchDeletedCommandCenterItems,
  fetchArchivedCommandCenterItems,
} from './command-center-items/queries'

export {
  COMMAND_CENTER_FACET_SELECT,
  fetchCommandCenterFacets,
} from './command-center-items/facets'

export {
  buildCommandCenterCategoryOptions,
  buildCommandCenterDateGroupOptions,
} from './command-center-items/facet-options'

export { groupCommandCenterItems } from './command-center-items/grouping'

export {
  createCommandCenterItem,
  updateCommandCenterItem,
  deleteCommandCenterItem,
  archiveCommandCenterItem,
} from './command-center-items/mutations'

export {
  buildCommandCenterItemCounts,
  buildCommandCenterSourceBreakdown,
} from './command-center-items/facet-summaries'

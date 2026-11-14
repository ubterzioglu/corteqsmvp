import type { EditableCatalogItemSummary } from "@/lib/member-catalog";

/**
 * Tek kaynak: bir editable katalog item'ı için profil editör route'unu üretir.
 *
 * Kural (ProfileResolverPage + ProfileSwitcherMenu ikisi de bunu kullanır):
 * - `member` (Bireysel) item → `/profile/<legacyProfileType>` (kategori-güdümlü editör).
 * - diğer her item → `/profile/catalog/<itemId>` (katalog editörü).
 *
 * Route kuralının iki yerde kopyalanmaması için buradan çözülür.
 */
export function profileEditorPathFor(item: EditableCatalogItemSummary): string {
  if (item.itemType === "member") {
    return `/profile/${item.legacyProfileType}`;
  }
  return `/profile/catalog/${item.itemId}`;
}

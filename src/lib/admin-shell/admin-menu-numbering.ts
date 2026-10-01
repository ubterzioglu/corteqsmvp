// N01 · Yönetici menüsünün MUTLAK sıra numaraları.
//
// NEDEN: admin menüsü uzun; bir sayfayı tarif etmek veya bulmak zor. Asistan
// "Üyeler sayfasına bak" diyebiliyor ama o sayfanın menüde NEREDE olduğunu
// söyleyemiyor. Numara verilince hem konuşma ("17'ye bak") hem de arama kolaylaşıyor.
//
// ⚠️ NUMARA TEK YERDEN GELİR: `buildAdminMenuCatalog()`. Sidebar, komut paleti ve
// bot korpusu AYNI katalogdan beslenir. İkinci bir sayaç yazma — sidebar'ın
// gösterdiği numara ile botun söylediği numara sessizce ayrışır ve kullanıcı
// yanlış satıra bakar.
//
// ⚠️ `flattenAdminNav()` (admin-navigation-utils.ts) BURADA KULLANILAMAZ: grup
// sınırını ve `isInactive` ayrımını kaybeder, oysa numaralandırmanın tamamı o iki
// bilgiye dayanıyor. Bu yüzden ayrı bir yürüyüş yazıldı.
//
// ⚠️ SIRA, SIDEBAR'IN ÇİZDİĞİ SIRADIR — ölçüldü (`AdminSidebar.tsx`,
// `AdminSidebarGroup.tsx`):
//   1. `adminNavGroups` registry sırasında,
//   2. her grubun İÇİNDE `isInactive` OLMAYAN item'lar kendi sıralarında,
//   3. EN SONDA, tüm gruplardan toplanan `isInactive` item'lar
//      (`adminNavGroups.flatMap(g => g.items.filter(i => i.isInactive))`).
// Bu üç kuraldan biri sidebar'da değişirse burası da değişmelidir; sözleşme testi
// (`AdminSidebar` DOM'u ↔ bu katalog) N02'de eklenir ve ayrışmayı yakalar.
//
// ⚠️ FAVORİLER NUMARALANMAZ. Sidebar en üstte kullanıcıya özel bir "Favoriler"
// bloğu çizer, ama oradaki item'lar grubundaki item'ın AYNISIDIR — kendi numarasını
// taşır. Favorilere ayrı numara vermek, aynı sayfanın kullanıcıdan kullanıcıya
// değişen iki numarası olması demekti; mutlak numara fikri çökerdi.
//
// ⚠️ ALT ÖĞELER ÜST SAYACI KAYDIRMAZ: üst seviye `1..N`, alt öğeler `34.1`, `34.2`
// (kullanıcı kararı). `workspace-docs` ve `advisor-profiles` gibi DİNAMİK alt
// sayfası olan ebeveynlere yeni bir alt sayfa eklenince üstteki hiçbir numara
// değişmemeli — yoksa bot ve dokümanlar bir gecede bayatlar.
import { adminNavGroups } from "@/lib/admin-shell/admin-navigation-registry";
import type { AdminNavGroup, AdminNavItem } from "@/lib/admin-shell/admin-shell-types";

export interface AdminMenuCatalogEntry {
  /** Registry item id'si. */
  id: string;
  /** Görünen numara: üst seviye `"17"`, alt öğe `"17.2"`. */
  number: string;
  /** Üst seviye öğeler için `1..N`; alt öğelerde EBEVEYNİN sayacı. */
  topLevelIndex: number;
  /** Alt öğe ise 1'den başlayan sıra; üst seviyede `null`. */
  childIndex: number | null;
  label: string;
  /** Alt öğeyse ebeveynin id'si. */
  parentId: string | null;
  groupId: string;
  groupLabel: string;
  /** Internal route; external veya yalnız-ebeveyn item'larda boş olabilir. */
  to: string | null;
  href: string | null;
  description: string | null;
  aliases: string[];
  isExternal: boolean;
  isInactive: boolean;
}

function toEntry(
  item: AdminNavItem,
  group: AdminNavGroup,
  topLevelIndex: number,
  childIndex: number | null,
  parentId: string | null,
): AdminMenuCatalogEntry {
  return {
    id: item.id,
    number: childIndex === null ? String(topLevelIndex) : `${topLevelIndex}.${childIndex}`,
    topLevelIndex,
    childIndex,
    label: item.label,
    parentId,
    groupId: group.id,
    groupLabel: group.label,
    to: item.to ?? null,
    href: item.href ?? null,
    description: item.description ?? null,
    aliases: item.aliases ?? [],
    isExternal: item.isExternal === true,
    isInactive: item.isInactive === true,
  };
}

/**
 * Menüyü sidebar sırasıyla gezip her öğeye mutlak numara verir.
 *
 * Varsayılan olarak canlı registry'yi okur; test ve anlık görüntü üretimi için
 * grup listesi dışarıdan geçilebilir.
 */
export function buildAdminMenuCatalog(groups: AdminNavGroup[] = adminNavGroups): AdminMenuCatalogEntry[] {
  const entries: AdminMenuCatalogEntry[] = [];
  let topLevelIndex = 0;

  const pushItem = (item: AdminNavItem, group: AdminNavGroup) => {
    topLevelIndex += 1;
    entries.push(toEntry(item, group, topLevelIndex, null, null));

    // Alt öğeler ebeveynin sayacını paylaşır; `topLevelIndex` ARTMAZ.
    (item.children ?? []).forEach((child, index) => {
      entries.push(toEntry(child, group, topLevelIndex, index + 1, item.id));
    });
  };

  // 1–2. Gruplar registry sırasında, grup içinde yalnız aktif öğeler.
  for (const group of groups) {
    for (const item of group.items) {
      if (item.isInactive) continue;
      pushItem(item, group);
    }
  }

  // 3. İnaktif öğeler EN SONDA — sidebar da onları ayrı bir "İnaktif" bölümünde,
  //    tüm grupların altında çiziyor.
  for (const group of groups) {
    for (const item of group.items) {
      if (!item.isInactive) continue;
      pushItem(item, group);
    }
  }

  return entries;
}

/** `id → numara` haritası. Sidebar ve komut paleti bunu okur. */
export function buildAdminMenuNumberById(
  groups: AdminNavGroup[] = adminNavGroups,
): Map<string, string> {
  return new Map(buildAdminMenuCatalog(groups).map((entry) => [entry.id, entry.number]));
}

/**
 * Canlı registry için önceden hesaplanmış harita.
 *
 * Registry modül yüklenirken sabitlenir ve çalışma anında değişmez; her render'da
 * yeniden hesaplamanın anlamı yok.
 */
export const adminMenuNumberById: ReadonlyMap<string, string> = buildAdminMenuNumberById();

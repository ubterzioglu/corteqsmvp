// Dizin sonuçlarını kayıt tipine göre ayırır (revizyon 32ae55b9).
//
// Bileşenden AYRI: bir `.tsx` dosyasından bileşen dışı sembol export etmek
// `react-refresh/only-export-components` uyarısı üretir (lint taban çizgisi 0 problem).

import type { UnifiedDirectoryRow } from "@/lib/catalog-directory";

export interface DirectoryResultGroups {
  /** Kurum, işletme, dernek gibi katalog kayıtları — kart ızgarasında gösterilir. */
  catalogItems: UnifiedDirectoryRow[];
  /** Kişi kayıtları — satır listesinde gösterilir. */
  members: UnifiedDirectoryRow[];
}

/**
 * Sonuçları ikiye ayırır. Her grup GELİŞ SIRASINI korur — sıralama alaka düzeyine
 * göre sunucuda yapılır, burada yeniden sıralamak onu bozardı.
 */
export function groupDirectoryResults(rows: UnifiedDirectoryRow[]): DirectoryResultGroups {
  const catalogItems: UnifiedDirectoryRow[] = [];
  const members: UnifiedDirectoryRow[] = [];
  for (const row of rows) {
    if (row.recordType === "catalog_item") catalogItems.push(row);
    else members.push(row);
  }
  return { catalogItems, members };
}

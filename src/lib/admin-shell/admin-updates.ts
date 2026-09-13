// Admin Panel V2 — ürün güncellemeleri (statik tek kaynak).
// Topbar'daki Güncellemeler (bell) menüsü ve /admin/about sayfası bu listeden
// beslenir. Yeni bir sürüm/özellik yayınlandığında EN ÜSTE yeni bir kayıt ekle;
// id benzersiz olmalı (okundu takibi id üzerinden yapılır, format: YYYYMMDD-slug).
//
// Kayıtlar aya göre `admin-updates/` altındaki dosyalarda tutulur; bu dosya yalnız
// onları en yeniden eskiye doğru birleştirir. Yeni kayıt en güncel ay dosyasının
// EN ÜSTÜNE eklenir; yeni bir ay başlarsa yeni ay dosyası açılıp aşağıdaki listeye
// EN ÜSTE eklenir (sıra = görünen sıra).
//
// DİKKAT — içe aktarımlardaki `.ts` uzantısı bilinçlidir: scripts/sync-admin-updates.mjs
// bu modülü Node'un tip-sıyırma kipiyle (--experimental-strip-types) DOĞRUDAN import
// eder ve Node ESM uzantısız göreli yol çözmez. Uzantıyı kaldırmak bildirim e-postası
// senkronunu sessizce kırar. (tsconfig.app.json: allowImportingTsExtensions)

import type { AdminUpdateEntry } from "./admin-updates/types.ts";
import { ADMIN_UPDATES_2026_09 } from "./admin-updates/2026-09.ts";
import { ADMIN_UPDATES_2026_08 } from "./admin-updates/2026-08.ts";
import { ADMIN_UPDATES_2026_07 } from "./admin-updates/2026-07.ts";
import { ADMIN_UPDATES_2026_06 } from "./admin-updates/2026-06.ts";
import { ADMIN_UPDATES_2026_04 } from "./admin-updates/2026-04.ts";

export type { AdminUpdateEntry };

export const ADMIN_UPDATES: AdminUpdateEntry[] = [
  ...ADMIN_UPDATES_2026_09,
  ...ADMIN_UPDATES_2026_08,
  ...ADMIN_UPDATES_2026_07,
  ...ADMIN_UPDATES_2026_06,
  ...ADMIN_UPDATES_2026_04,
];

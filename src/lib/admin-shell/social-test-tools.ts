// Admin Panel V2 — Test Araçları İçerik Paketi (statik tek kaynak).
// /admin/social-share-vault sayfasının "Test Araçları" sekmesi bu listeden
// beslenir. 10 click-through test aracı; her araç için 3 varyant, her varyant
// 2 metinsiz ChatGPT görsel promptu (İngilizce, square 1:1 / no-text kuralları
// promptun içine gömülü) + 1 hazır Türkçe LinkedIn postu + 1 hazır Türkçe
// Instagram postu + 1 hazır Türkçe Reddit postu (daha az satış dili, soru/
// tartışma tonu — subreddit kurallarına göre editlenmesi gerekebilir).
//
// Kayıtlar `social-test-tools/` altındaki parça dosyalarda tutulur; bu dosya
// yalnız onları görünüm sırasına göre birleştirir. İçerik düzenlemesi ilgili
// parça dosyasından yapılır. Metinler temiz UTF-8 Türkçe + gerçek tırnak +
// emoji olarak tutulur; HTML-entity / mojibake KULLANILMAZ.
//
// DİKKAT — vite.config.ts içindeki `social-vault-tests` manualChunks kuralı
// UZANTISIZ öneke bakar (`/src/lib/admin-shell/social-test-tools`), böylece
// barrel ve parça dosyalar aynı chunk'ta kalır. Kurala `.ts` geri eklenirse
// parçalar chunk dışına düşer ve bundle bölünmesi sessizce değişir.

import type { SocialTestTool, SocialTestVariant } from "./social-test-tools/types";
import { SOCIAL_TEST_TOOLS_01_03 } from "./social-test-tools/tools-01-03";
import { SOCIAL_TEST_TOOLS_04_06 } from "./social-test-tools/tools-04-06";
import { SOCIAL_TEST_TOOLS_07_08 } from "./social-test-tools/tools-07-08";
import { SOCIAL_TEST_TOOLS_09_10 } from "./social-test-tools/tools-09-10";

export type { SocialTestVariant, SocialTestTool };

export const SOCIAL_TEST_TOOLS: SocialTestTool[] = [
  ...SOCIAL_TEST_TOOLS_01_03,
  ...SOCIAL_TEST_TOOLS_04_06,
  ...SOCIAL_TEST_TOOLS_07_08,
  ...SOCIAL_TEST_TOOLS_09_10,
];

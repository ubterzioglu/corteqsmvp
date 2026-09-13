// /admin/social-share-vault "BURAK BURAYA BAK" sekmesi statik içerik kaynağı.
// 12 click-through test aracı; her araç 3 varyant (2 metinsiz ChatGPT görsel
// promptu + 1 hazır Türkçe LinkedIn postu + 1 hazır Türkçe Instagram postu +
// 1 hazır Türkçe Reddit postu). İçerik BU dosyadan düzenlenir. Metinler temiz
// UTF-8 Türkçe + gerçek tırnak + emoji — HTML-entity / mojibake KULLANILMAZ.
// İlk 10 aracın name/description/linkedinPost alanları social-test-tools.ts ile
// aynıdır (kasıtlı); imagePrompts ve instagramPost bu dosyaya özgü, bağımsız
// yazılmış içeriktir ve iki dosya arasında birebir eşleşmesi gerekmez.
// 11-12 Almanya finans araçlarıdır.
//
// Araç kayıtları `burak-share-tools/tool-01.ts` … `tool-12.ts` dosyalarında
// tutulur; bu dosya yalnız onları sıraya dizer. AŞAĞIDAKİ SIRA = görünen sıra
// ve her aracın `order` alanıyla birebir aynı olmalıdır.
//
// DİKKAT — içe aktarımlardaki `.ts` uzantısı bilinçlidir:
// scripts/social-generate/load-tools.mjs bu modülü Node'un tip-sıyırma kipiyle
// (--experimental-strip-types) DOĞRUDAN import eder ve Node ESM uzantısız göreli
// yol çözmez. (tsconfig.app.json: allowImportingTsExtensions)

import type { BurakShareTool, BurakShareVariant } from "./burak-share-tools/types.ts";
import { BURAK_SHARE_TOOL_01 } from "./burak-share-tools/tool-01.ts";
import { BURAK_SHARE_TOOL_02 } from "./burak-share-tools/tool-02.ts";
import { BURAK_SHARE_TOOL_03 } from "./burak-share-tools/tool-03.ts";
import { BURAK_SHARE_TOOL_04 } from "./burak-share-tools/tool-04.ts";
import { BURAK_SHARE_TOOL_05 } from "./burak-share-tools/tool-05.ts";
import { BURAK_SHARE_TOOL_06 } from "./burak-share-tools/tool-06.ts";
import { BURAK_SHARE_TOOL_07 } from "./burak-share-tools/tool-07.ts";
import { BURAK_SHARE_TOOL_08 } from "./burak-share-tools/tool-08.ts";
import { BURAK_SHARE_TOOL_09 } from "./burak-share-tools/tool-09.ts";
import { BURAK_SHARE_TOOL_10 } from "./burak-share-tools/tool-10.ts";
import { BURAK_SHARE_TOOL_11 } from "./burak-share-tools/tool-11.ts";
import { BURAK_SHARE_TOOL_12 } from "./burak-share-tools/tool-12.ts";

export type { BurakShareTool, BurakShareVariant };

export const BURAK_SHARE_TOOLS: BurakShareTool[] = [
  BURAK_SHARE_TOOL_01,
  BURAK_SHARE_TOOL_02,
  BURAK_SHARE_TOOL_03,
  BURAK_SHARE_TOOL_04,
  BURAK_SHARE_TOOL_05,
  BURAK_SHARE_TOOL_06,
  BURAK_SHARE_TOOL_07,
  BURAK_SHARE_TOOL_08,
  BURAK_SHARE_TOOL_09,
  BURAK_SHARE_TOOL_10,
  BURAK_SHARE_TOOL_11,
  BURAK_SHARE_TOOL_12,
];

// scripts/social-generate/load-tools.mjs
// BURAK_SHARE_TOOLS verisini TypeScript kaynağından runtime'da yükler.
// Node'un yerleşik --experimental-strip-types desteğiyle .ts dosyası doğrudan
// import edilir (bu depo Node 24 kullanıyor; ek derleyici/bağımlılık gerekmez).
// index.mjs bu script'i her zaman `node --experimental-strip-types` ile çalıştırır.

import { pathToFileURL } from 'node:url';
import path from 'node:path';

export async function loadBurakShareTools(repoRoot) {
  const modulePath = path.join(repoRoot, 'src/lib/admin-shell/burak-share-tools.ts');
  const moduleUrl = pathToFileURL(modulePath).href;
  const mod = await import(moduleUrl);
  return mod.BURAK_SHARE_TOOLS;
}

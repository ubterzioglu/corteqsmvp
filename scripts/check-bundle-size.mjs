import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const MAX_JS_BYTES = 500 * 1024;

/**
 * Bilinçli, DAR istisnalar: parça adı öneki → ayrı tavan.
 *
 * ⚠️ admin-updates (2026-11-07): aylık değişiklik günlüğü VERİSİ (`src/lib/admin-shell/
 * admin-updates/*.ts`, kaynak ~564 KB). Parça 526 KB'a ulaştı ve 500 KB sınırını aştı; CI bu
 * yüzden kırılacaktı (o sırada CI zaten ilk adımda, typecheck:node'da düşüyordu ve buraya
 * hiç gelmiyordu). Parça yalnız admin sayfalarında yüklenir (topbar zil menüsü). Kalıcı çözüm
 * veriyi "son aylar" + isteğe bağlı "arşiv" diye bölmektir — KALANLAR.md K16. Tavan büyüme
 * hızına göre seçildi (~100 KB/ay → ~5 ay pay); aşılırsa tavanı YÜKSELTME, böl.
 */
export const CHUNK_LIMIT_EXCEPTIONS = [{ prefix: "admin-updates-", maxBytes: 1024 * 1024 }];

/** `entries`: { name, size }[] → sınırı aşanlar (istisnalar kendi tavanıyla). */
export function findOversizedChunks(entries, { max = MAX_JS_BYTES, exceptions = CHUNK_LIMIT_EXCEPTIONS } = {}) {
  return entries
    .filter((e) => e.name.endsWith(".js"))
    .map((e) => {
      const exception = exceptions.find((x) => e.name.startsWith(x.prefix));
      return { ...e, limit: exception ? exception.maxBytes : max };
    })
    .filter((e) => e.size > e.limit);
}

async function main() {
  const assetsDirectory = path.resolve(process.cwd(), "dist", "assets");
  const names = await readdir(assetsDirectory);
  const entries = await Promise.all(
    names.map(async (name) => ({ name, size: (await stat(path.join(assetsDirectory, name))).size })),
  );
  const oversized = findOversizedChunks(entries);

  if (oversized.length > 0) {
    for (const { name, size, limit } of oversized) {
      console.error(
        `[check-bundle-size] ${name}: ${(size / 1024).toFixed(1)} KB (sınır ${(limit / 1024).toFixed(0)} KB)`,
      );
    }
    process.exitCode = 1;
    return;
  }
  const watched = entries.filter((e) => CHUNK_LIMIT_EXCEPTIONS.some((x) => e.name.startsWith(x.prefix)));
  for (const e of watched)
    console.log(`[check-bundle-size] istisna izleniyor: ${e.name} ${(e.size / 1024).toFixed(1)} KB`);
  console.log(`[check-bundle-size] Tüm JS chunk'ları sınırlarının altında (genel 500 KB). ✓`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await main();
}

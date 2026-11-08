import { readFileSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

export const MAX_JS_BYTES = 500 * 1024;

/**
 * İLK YÜK JS bütçesi (gzip) — parça başına tavandan AYRI bir ölçüdür.
 *
 * Parça başına 500 KB ham tavan, ilk açılışta inen toplam JS'i ölçmez: 40 küçük parça tek tek
 * sınırın altında kalıp toplamda şişebilir (L0 doğrulaması H5: "229 KB gzip tabanını ölçer"
 * iddiası YANLIŞTI, hiçbir şey ölçülmüyordu). Ölçülen = `dist/index.html`'in EAGER yüklediği
 * JS: `<script type="module" src>` + `<link rel="modulepreload">`. Tembel `import()` parçaları
 * sayılmaz.
 *
 * ÖLÇÜM 2026-11-08 (npm run build sonrası): 44 dosya, 844.714 bayt ham → 258,2 KB gzip (betiğin kendi zlib varsayılan düzeyiyle)
 * (Ekim performans turunun tabanı ≈229 KB'dı; ana sayfa parçaları modulepreload'a girdiği için
 * artış beklenen). Bütçe = ölçülen × 1,05 ≈ 271 KB. Aşılırsa bütçeyi YÜKSELTME: önce hangi parçanın
 * ilk yüke girdiğine bak (`dist/index.html`), gereksizse tembel yüklemeye al.
 */
export const INITIAL_JS_GZIP_BUDGET_BYTES = 271 * 1024;

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

/** Bir HTML etiketinden öznitelik değeri okur (öznitelik sırasından bağımsız). */
function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
}

/**
 * `index.html`'in ilk yüklemede getirdiği YEREL JS yolları: `type="module"` betikleri ve
 * `rel="modulepreload"` bağlantıları. Dış (https://…) betikler, düz `/analytics.js` ve css sayılmaz.
 */
export function extractInitialScriptPaths(html) {
  const paths = [];
  for (const [tag] of html.matchAll(/<script\b[^>]*>/g)) {
    const src = attr(tag, "src");
    if (attr(tag, "type") === "module" && src && src.startsWith("/assets/") && src.endsWith(".js")) paths.push(src);
  }
  for (const [tag] of html.matchAll(/<link\b[^>]*>/g)) {
    const href = attr(tag, "href");
    if (attr(tag, "rel") === "modulepreload" && href && href.startsWith("/assets/") && href.endsWith(".js"))
      paths.push(href);
  }
  return [...new Set(paths)];
}

/**
 * İlk yük JS'inin toplam gzip boyutu. `readAsset(yol)` dosya içeriğini (Buffer) ya da bulunamazsa
 * `undefined` döndürür — eksik dosya ve boş ayrıştırma SESSİZCE 0 sayılmaz, fırlatır.
 */
export function measureInitialGzip(html, readAsset) {
  const files = extractInitialScriptPaths(html);
  if (files.length === 0) {
    throw new Error("index.html içinde ilk yük JS'i bulunamadı (modül betiği / modulepreload yok); ayrıştırma bozuk.");
  }
  let totalGzipBytes = 0;
  for (const file of files) {
    const content = readAsset(file);
    if (!content) throw new Error(`index.html'in işaret ettiği ${file} dist/ içinde yok.`);
    totalGzipBytes += gzipSync(content).length;
  }
  return { totalGzipBytes, files };
}

/** Toplam gzip bütçeyi AŞIYORSA true (eşitlik geçer). */
export function exceedsInitialBudget(totalGzipBytes, budget = INITIAL_JS_GZIP_BUDGET_BYTES) {
  return totalGzipBytes > budget;
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
  }

  const distDirectory = path.resolve(process.cwd(), "dist");
  const html = readFileSync(path.join(distDirectory, "index.html"), "utf8");
  const { totalGzipBytes, files } = measureInitialGzip(html, (p) => {
    try {
      return readFileSync(path.join(distDirectory, p));
    } catch {
      return undefined;
    }
  });
  const kb = (totalGzipBytes / 1024).toFixed(1);
  if (exceedsInitialBudget(totalGzipBytes)) {
    console.error(
      `[check-bundle-size] ilk yük JS: ${kb} KB gzip (${files.length} dosya) — bütçe ${(INITIAL_JS_GZIP_BUDGET_BYTES / 1024).toFixed(0)} KB AŞILDI`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `[check-bundle-size] ilk yük JS: ${kb} KB gzip (${files.length} dosya, bütçe ${(INITIAL_JS_GZIP_BUDGET_BYTES / 1024).toFixed(0)} KB). ✓`,
    );
  }
  if (oversized.length > 0) return;

  const watched = entries.filter((e) => CHUNK_LIMIT_EXCEPTIONS.some((x) => e.name.startsWith(x.prefix)));
  for (const e of watched)
    console.log(`[check-bundle-size] istisna izleniyor: ${e.name} ${(e.size / 1024).toFixed(1)} KB`);
  console.log(`[check-bundle-size] Tüm JS chunk'ları sınırlarının altında (genel 500 KB). ✓`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await main();
}

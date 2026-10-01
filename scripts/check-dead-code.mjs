import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs"];

// These files are loaded by tool configuration rather than by the application import graph.
export const CONFIG_REFERENCED_EXCEPTIONS = new Set([
  "src/test/setup.ts", // vitest.config.ts setupFiles string
  "src/vite-env.d.ts", // ambient Vite declarations included by TypeScript
]);

// Existing unreachable production files are an explicit baseline. New entries fail the check;
// deleting a baseline entry is reported as stale so the list gets smaller over time.
// S09: liste BOŞALDI. `src/components/admin/shell/index.ts` "yeni tüketiciler için
// rezerve" diye burada bekliyordu, ama ölçüldü: hiçbir şey onu import etmiyordu ve
// en çok kullanılan shell modülünü (`admin-accent`) zaten ihraç etmiyordu — yani
// rezerve edilen şey gerçek kullanımı yansıtmıyordu. Silindi.
//
// ⚠️ Buraya yeni satır eklemek SON çare olmalı: bu liste "ölü ama şimdilik dursun"
// demektir ve kolayca kalıcı hâle gelir. Eklemeden önce dosyayı silmeyi dene.
// KR01–KR03 (01.10): kariyer modülü sayfasından ÖNCE geldi. Plan işi bilerek
// böldü — KR01 veri, KR02 migration, KR03 veri katmanı, KR04 sayfa iskeleti,
// KR05 ilan listesi, KR06 başvuru formu. Yani bu dörtlü ölü değil,
// TÜKETİCİSİNDEN ÖNDE.
//
// 🔴 Kim siler: **KR05** ilan listesini yazınca `careers-data.ts` +
// `careers-types.ts` satırlarını, **KR06** formu yazınca `careers-api.ts` +
// `careers-schemas.ts` satırlarını. (KR04 iskeleti yazar ama bu dosyaları
// kullanmaz — 02.10'da ölçüldü, bu yüzden "KR04 siler" notu düzeltildi.)
// Silinmezlerse bayat baseline kaydı olarak rapor edilir ve check:dead yine
// kırmızıya döner — mekanizma kendini temizler.
// ✅ KR01–KR06 (02.10): liste YENİDEN BOŞALDI. Kariyer modülü dört dosyayla
// tüketicisinden önde gelmişti (veri → KR05 ilan listesi, API → KR06 başvuru
// formu); her iki adımda da denetleyici "bayat baseline kaydı" diye uyardı ve
// satırlar silindi. Mekanizma amaçlandığı gibi kendini temizledi.
//
// ⚠️ Buraya yeni satır eklemek SON çare olmalı: bu liste "ölü ama şimdilik
// dursun" demektir ve kolayca kalıcı hâle gelir. Eklemeden önce dosyayı silmeyi
// dene; eklerken SİLECEK batch'i adıyla yaz.
export const KNOWN_DEAD_FILES = new Set([]);

// Yalnız testlerin kullandığı paylaşılan yardımcıların yaşadığı dizin. Buradaki bir
// dosya üretim grafiğinden değil, TEST grafiğinden erişilebilir olmalıdır.
export const TEST_SUPPORT_DIR = "src/test/";

const normalizePath = (value) => value.replaceAll("\\", "/").replace(/^\.\//, "");

export function isTestFile(filePath) {
  return /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(filePath);
}

function stripComments(source) {
  let result = "";
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (character === "\n") {
        lineComment = false;
        result += character;
      } else {
        result += " ";
      }
      continue;
    }

    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        result += "  ";
        index += 1;
      } else {
        result += character === "\n" ? "\n" : " ";
      }
      continue;
    }

    if (quote) {
      result += character;
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      result += character;
    } else if (character === "/" && next === "/") {
      lineComment = true;
      result += "  ";
      index += 1;
    } else if (character === "/" && next === "*") {
      blockComment = true;
      result += "  ";
      index += 1;
    } else {
      result += character;
    }
  }

  return result;
}

export function extractModuleSpecifiers(source) {
  const code = stripComments(source);
  const matches = [];
  const patterns = [
    /(?<![\w$-])(?:import|export)\s+(?:type\s+)?[^;]*?\sfrom\s*["']([^"']+)["']/g,
    /(?<![\w$-])import\s*["']([^"']+)["']/g,
    /(?<![\w$-])import\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) {
      matches.push({ index: match.index ?? 0, specifier: match[1] });
    }
  }

  matches.sort((left, right) => left.index - right.index);
  return [...new Set(matches.map(({ specifier }) => specifier))];
}

export function resolveLocalModule(fromFile, specifier, sourceFiles) {
  let basePath;
  if (specifier.startsWith("@/")) {
    basePath = `src/${specifier.slice(2)}`;
  } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    basePath = path.posix.join(path.posix.dirname(normalizePath(fromFile)), specifier);
  } else {
    return null;
  }

  const normalizedBase = normalizePath(path.posix.normalize(basePath));
  const hasSourceExtension = SOURCE_EXTENSIONS.includes(path.posix.extname(normalizedBase));
  const candidates = hasSourceExtension
    ? [normalizedBase]
    : [
        ...SOURCE_EXTENSIONS.map((candidateExtension) => `${normalizedBase}${candidateExtension}`),
        ...SOURCE_EXTENSIONS.map((candidateExtension) =>
          `${normalizedBase}/index${candidateExtension}`,
        ),
      ];

  return candidates.find((candidate) => sourceFiles.has(candidate)) ?? null;
}

export function analyzeSourceGraph({
  sources,
  entry,
  knownDeadFiles = KNOWN_DEAD_FILES,
  configReferencedExceptions = CONFIG_REFERENCED_EXCEPTIONS,
}) {
  const sourceFiles = new Set(sources.keys());

  const walk = (entries) => {
    const seen = new Set();
    const queue = [...entries];
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || seen.has(current) || !sourceFiles.has(current)) continue;
      seen.add(current);

      for (const specifier of extractModuleSpecifiers(sources.get(current))) {
        const resolved = resolveLocalModule(current, specifier, sourceFiles);
        if (resolved && !seen.has(resolved)) queue.push(resolved);
      }
    }
    return seen;
  };

  const reachable = walk([entry]);
  // İKİNCİ GEÇİŞ — yalnız `src/test/**` muafiyeti için (S04b).
  // Test dosyaları üretim grafiğinin dışındadır, bu yüzden SADECE testlerin kullandığı
  // bir yardımcı `src/main.tsx`'ten erişilemez ve "ölü" raporlanırdı. Bu, ortak test
  // yardımcısı çıkarmayı cezalandırıyordu (ölçüldü 28.09: `src/test/source-slice.ts`).
  // ⚠️ Bu geçiş ÜRETİM dosyalarını muaf tutmaz — bir `src/lib` dosyasını yalnız testi
  // import ediyorsa o dosya hâlâ ölüdür ve raporlanır. Muafiyet `src/test/` ile sınırlı.
  const testReachable = walk([...sourceFiles].filter((filePath) => isTestFile(filePath)));

  const unreachable = [...sourceFiles]
    .filter((filePath) => !reachable.has(filePath))
    .filter((filePath) => !isTestFile(filePath))
    .filter((filePath) => !configReferencedExceptions.has(filePath))
    .filter(
      (filePath) => !(filePath.startsWith(TEST_SUPPORT_DIR) && testReachable.has(filePath)),
    )
    .sort();

  return {
    reachable,
    knownDead: unreachable.filter((filePath) => knownDeadFiles.has(filePath)),
    newDead: unreachable.filter((filePath) => !knownDeadFiles.has(filePath)),
    staleBaseline: [...knownDeadFiles].filter((filePath) => !unreachable.includes(filePath)).sort(),
  };
}

function collectSources(directory, sources = new Map()) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectSources(absolutePath, sources);
      continue;
    }

    if (!SOURCE_EXTENSIONS.includes(path.extname(entry.name))) continue;
    const relativePath = normalizePath(path.relative(projectRoot, absolutePath));
    sources.set(relativePath, readFileSync(absolutePath, "utf8"));
  }
  return sources;
}

function main() {
  const sources = collectSources(path.join(projectRoot, "src"));
  const result = analyzeSourceGraph({ sources, entry: "src/main.tsx" });

  if (result.newDead.length > 0) {
    console.error(`[check-dead] ${result.newDead.length} yeni erişilemez kaynak dosyası:`);
    for (const filePath of result.newDead) console.error(`  - ${filePath}`);
  }

  if (result.staleBaseline.length > 0) {
    console.error(`[check-dead] ${result.staleBaseline.length} bayat baseline kaydı:`);
    for (const filePath of result.staleBaseline) console.error(`  - ${filePath}`);
  }

  if (result.newDead.length > 0 || result.staleBaseline.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(
    `[check-dead] 0 yeni erişilemez dosya · ${result.knownDead.length} bilinen borç · `
      + `${result.reachable.size} erişilebilir kaynak.`,
  );
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main();
}

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const decoder = new TextDecoder("utf-8", { fatal: true });
// supabase: Edge Function'lar ve migration'lar kullanıcıya görünen Türkçe metin taşır
// (e-posta şablonları, RPC hata mesajları) — encoding denetimi buraya da uygulanır.
const includeDirs = ["src", "public", "docs", "scripts", "supabase"];
const includeFiles = ["index.html", "package.json", "vite.config.ts", "tsconfig.json"];
// AÇIK BOŞLUK (ölçüldü 2026-08-05): yukarıdaki yorum `supabase` dizini için "migration'lar
// da denetlenir" diyor, ama `.sql` bu listede YOK — yani 365 migration hiç kontrol edilmiyor.
// Migration'lar kullanıcıya görünen Türkçe VERİ yazar (ülke/şehir adları) ve bozuk encoding
// doğrudan veritabanına kaydolur. `.sql` eklemek tek başına YETMEZ: suspiciousTokens
// listesindeki çıplak U+00C4 (Almanca büyük A-umlaut) meşru Almanca içeriğe takılıyor
// — 20260630140000_relocation_tool_vatandaslik_testi_almanya.sql içindeki Almanca soru
// metinleri bu yüzden hatalı işaretlenir ve prebuild/pretest kırılır. Kapatmak için önce
// kural inceltilmeli (çıplak U+00C3/U+00C4/U+00C5 token'ları yerine yalnız
// suspiciousPatterns'a güvenmek) ya da o dosyaya istisna tanımlanmalı — ayrı bir karar.
// DİKKAT: bu yorumda o karakterleri harfiyen YAZMA; script kendi dosyasını da tarar.
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".html", ".css", ".svg", ".yml", ".yaml"]);
// "archive"/"reference"/"partner-materials"/"reference-clones": docs altındaki
// dondurulmuş arşiv ve üçüncü parti referans içerikleri — encoding denetimi yalnız
// canlı kod/dokümanlar için anlamlıdır (2026-06-11 kök temizliği).
// "partner-materials" 2026-09-04'te "docu"dan yeniden adlandırıldı; klasör adını
// değiştirirsen BURAYI da değiştir, yoksa muafiyet sessizce düşer.
const skipDirs = new Set(["node_modules", ".git", "dist", "coverage", "archive", "reference", "partner-materials", "reference-clones"]);
const suspiciousTokens = [
  "\u00C3",
  "\u00C4",
  "\u00C5",
  "\u00E2\u20AC\u2122",
  "\u00E2\u20AC\u0153",
  "\u00E2\u20AC",
  "\u00F0\u0178",
  "\uFFFD",
];
const suspiciousPatterns = [
  /\u00C3[\u0080-\u00BF]/u,
  /\u00C4[\u0080-\u00BF]/u,
  /\u00C5[\u0080-\u00BF]/u,
  /\u00E2\u20AC[\u0000-\u00FF]?/u,
  /\u00E2\u20AC\u2122|\u00E2\u20AC\u0153|\u00E2\u20AC\u009D|\u00E2\u20AC\u201C|\u00E2\u20AC\u201D|\u00E2\u20AC\u00A2/u,
];

async function walk(targetPath, files) {
  const entry = await stat(targetPath);
  if (entry.isDirectory()) {
    if (skipDirs.has(path.basename(targetPath))) return;
    const children = await readdir(targetPath, { withFileTypes: true });
    for (const child of children) {
      await walk(path.join(targetPath, child.name), files);
    }
    return;
  }

  if (extensions.has(path.extname(targetPath))) {
    files.push(targetPath);
  }
}

function findSuspiciousLines(content) {
  return content
    .split(/\r?\n/)
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => suspiciousTokens.some((token) => line.includes(token)) || suspiciousPatterns.some((pattern) => pattern.test(line)))
    .map(({ line, lineNumber }) => ({ lineNumber, snippet: line.trim().slice(0, 180) }));
}

async function collectFiles() {
  const files = [];

  for (const dir of includeDirs) {
    const absoluteDir = path.join(rootDir, dir);
    try {
      await walk(absoluteDir, files);
    } catch {
      // optional directory
    }
  }

  for (const file of includeFiles) {
    const absoluteFile = path.join(rootDir, file);
    try {
      const entry = await stat(absoluteFile);
      if (entry.isFile()) files.push(absoluteFile);
    } catch {
      // optional file
    }
  }

  return files;
}

async function main() {
  const files = await collectFiles();
  const failures = [];

  for (const file of files) {
    let content;
    try {
      content = decoder.decode(await readFile(file));
    } catch (error) {
      failures.push({
        file,
        type: "invalid-utf8",
        detail: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    const suspiciousLines = findSuspiciousLines(content);
    if (suspiciousLines.length > 0) {
      failures.push({
        file,
        type: "suspicious-text",
        detail: suspiciousLines,
      });
    }
  }

  if (failures.length === 0) {
    console.log(`UTF-8 verification passed for ${files.length} files.`);
    return;
  }

  console.error("UTF-8 verification failed.\n");
  for (const failure of failures) {
    console.error(`- ${path.relative(rootDir, failure.file)} [${failure.type}]`);
    if (failure.type === "invalid-utf8") {
      console.error(`  ${failure.detail}`);
      continue;
    }

    for (const issue of failure.detail) {
      console.error(`  line ${issue.lineNumber}: ${issue.snippet}`);
    }
  }

  process.exitCode = 1;
}

await main();

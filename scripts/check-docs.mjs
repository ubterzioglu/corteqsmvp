// Doküman düzeni denetimi (Faz 2, 2026-11-07).
//
//   npm run check:docs            rapor (exit 0)
//   npm run check:docs -- --strict  hata varsa exit 1 (CI / prelint)
//
// Kurallar — ayrıntı: docs/README.md "Sınıflandırma sözleşmesi":
//   1. INDEX     docs/README.md her üst dizini anar, olmayan dizini anmaz.
//   2. KIRIK     yaşayan doküman ve koddaki `docs/...` yolu var olan bir hedefi gösterir.
//   3. KOPYA     byte-birebir aynı iki doküman yoktur (arşiv/referans kendi içinde hariç).
//   4. YERINI    `durum: yerini-aldı` taşıyan dokümanın `yerini_alan` hedefi vardır.
//   5. AD (uyarı) tarihli tür dizinlerinde ad `YYYY-AA-GG-kucuk-harf-slug.uzanti`.
// 1–4 HATA, 5 UYARIdır: mevcut ad ihlallerini toplu düzeltmek atıfları kırar.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// ── Saf yardımcılar (test edilir) ─────────────────────────────────────────────

/** Taranmayan (tarihsel / donmuş / dış) dizinler. */
export const HISTORICAL_PREFIXES = [
  "docs/archive/",
  "docs/history/",
  "docs/reference/",
  "docs/exports/",
  "docs/handover/",
  "docs/cleanup/",
  "docs/audits/",
  "docs/database-audit/",
];

/** Repoda izlenmeyen ama script'lerin diske yazdığı bilinen çıktı yolları. */
export const LOCAL_OUTPUT_PREFIXES = ["docs/commandcenter", "docs/archive/backups", "docs/fallback-images"];

/**
 * Bilinçli kopya dizinleri (kopya kuralı uygulanmaz):
 *  - social-share-outputs: seed GİRDİSİ; her dosya social_share_assets'te AYRI bir kayıttır
 *    (aynı görsel iki numarada yayımlanmış olabilir) — silmek seed'i kırar.
 *  - partner-materials: her partner kiti kendi başına dağıtılır, ortak görsel tekrarlanır.
 */
export const INTENTIONAL_DUPLICATE_PREFIXES = ["docs/social-share-outputs/", "docs/partner-materials/"];

/** Tarihli tür dizinleri (doğrudan içindeki dosyalar için ad kuralı). */
export const DATED_DIRS = ["docs/plans", "docs/operations", "docs/kalanlar", "docs/audits", "docs/handover"];

const DATED_NAME = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.(?:md|sql|html|json)$/;
const LOOKS_DATED = /^\d{4}-\d{2}-\d{2}/;

// Önünde harf/rakam/nokta/eğik çizgi/tire OLMAYAN `docs/` (URL ve daha uzun yolun parçası değil).
const REF_PATTERN = /(?<![\p{L}\p{N}_./-])docs\/[\p{L}\p{N}_.\-/]+/gu;
const PLACEHOLDER = /(?:^|[-/])(?:0X|NN|XX|YYYY|AA-GG)(?:[-/.]|$)|[*<>{}]|\/\d+-\d+$/;

/** Metindeki `docs/...` referanslarını (temizlenmiş) döndürür. */
export function extractDocRefs(text) {
  const refs = new Set();
  const source = String(text);
  for (const match of source.matchAll(REF_PATTERN)) {
    // `docs/x.md` (repoda yok) — hedefi hiç commit'lenmemiş/silinmiş atfın BİLİNÇLİ kaydı.
    const after = source.slice(match.index + match[0].length, match.index + match[0].length + 20);
    if (/^`?\s*\(repoda yok/.test(after)) continue;
    const ref = match[0].replace(/[./-]+$/, "");
    if (ref === "docs" || PLACEHOLDER.test(ref)) continue;
    // Tire ile biten yol bir ÖNEK atfıdır ("docs/10tool/00-..." gibi), dosya adı değil.
    if (/-$/.test(match[0])) continue;
    refs.add(ref);
  }
  return [...refs];
}

/** Tracked dosya + dizin kümesine göre hedef var mı? */
export function refExists(ref, trackedFiles, trackedDirs, localExists = () => false) {
  if (trackedFiles.has(ref) || trackedDirs.has(ref)) return true;
  if (LOCAL_OUTPUT_PREFIXES.some((p) => ref === p || ref.startsWith(p + "/"))) return true;
  // Kısa önek atfı: `docs/10tool/00` → `00-ortak-mimari....md`, `README` → `README.md`.
  if (prefixIndex(trackedFiles).has(ref)) return true;
  return localExists(ref);
}

// Önek kümesi: her yolun son bölümündeki "-" ve "." karakterlerinden önceki kısmı. Küme
// başına bir kez kurulur — eski doğrusal tarama prelint süresini ~12 sn yapıyordu.
const prefixCache = new WeakMap();
function prefixIndex(trackedFiles) {
  let index = prefixCache.get(trackedFiles);
  if (index) return index;
  index = new Set();
  for (const f of trackedFiles) {
    for (let i = f.lastIndexOf("/") + 1; i < f.length; i++) if (f[i] === "-" || f[i] === ".") index.add(f.slice(0, i));
  }
  prefixCache.set(trackedFiles, index);
  return index;
}

export function isScannedForRefs(path) {
  if (!/\.(?:md|mjs|ts|tsx|html)$/.test(path)) return false;
  if (/\.test\.(?:ts|tsx|mjs)$/.test(path)) return false; // test fikstürleri bilerek var olmayan yol yazar
  if (path.endsWith(".generated.ts") || path.startsWith("referans")) return false;
  // Aylık değişiklik günlüğü: o günün yollarını anan TARİHSEL kayıttır, güncellenmez.
  if (path.startsWith("src/lib/admin-shell/admin-updates/")) return false;
  if (path.startsWith("supabase/migrations/")) return false; // değiştirilemez; ayrı raporlanır
  return !HISTORICAL_PREFIXES.some((p) => path.startsWith(p));
}

/** Üst dizinler (docs/<ad>) ile README'de anılan adları karşılaştırır. */
export function checkIndex(topDirs, readmeText, knownNames = new Set()) {
  const mentioned = new Set();
  for (const m of String(readmeText).matchAll(/`([a-z0-9][a-z0-9_.-]*)\/`/g)) mentioned.add(m[1]);
  for (const m of String(readmeText).matchAll(/\]\(\.?\/?([a-z0-9][a-z0-9_.-]*)\/?\)/g)) mentioned.add(m[1]);
  const missing = topDirs.filter((d) => !mentioned.has(d));
  const stale = [...mentioned].filter((d) => !topDirs.includes(d) && !knownNames.has(d) && !/\./.test(d));
  return { missing, stale };
}

/** Aynı blob'u paylaşan yollar; arşiv/referans dışında en az bir kopya varsa ihlaldir. */
export function findDuplicateGroups(entries) {
  const byBlob = new Map();
  for (const { blob, path } of entries) {
    if (!byBlob.has(blob)) byBlob.set(blob, []);
    byBlob.get(blob).push(path);
  }
  // frozen: tarihsel/donmuş · intentional: bilinçli kopya kaynağı · live: diğer her şey.
  const kind = (p) =>
    ["docs/archive/", "docs/reference/", "docs/history/"].some((x) => p.startsWith(x))
      ? "frozen"
      : INTENTIONAL_DUPLICATE_PREFIXES.some((x) => p.startsWith(x))
        ? "intentional"
        : "live";
  // İhlal: iki canlı kopya YA DA bilinçli bir kaynağın canlı kopyası (ör. docs/backup ↔ seed girdisi).
  return [...byBlob.values()].filter((g) => {
    const live = g.filter((p) => kind(p) === "live").length;
    const intentional = g.filter((p) => kind(p) === "intentional").length;
    return live >= 2 || (live >= 1 && intentional >= 1);
  });
}

export function checkDatedName(path) {
  const dir = path.slice(0, path.lastIndexOf("/"));
  if (!DATED_DIRS.includes(dir)) return true;
  const name = path.slice(path.lastIndexOf("/") + 1);
  if (name === "README.md") return true;
  return !LOOKS_DATED.test(name) || DATED_NAME.test(name);
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
export function supersededTarget(text) {
  const fm = FRONTMATTER.exec(String(text));
  if (!fm || !/^durum:\s*["']?yerini-ald[ıi]/im.test(fm[1])) return undefined;
  const target = /^yerini_alan:\s*["']?([^"'\s#]+)/m.exec(fm[1]);
  return target ? target[1] : null;
}

// ── Çalıştırma ───────────────────────────────────────────────────────────────

function git(args) {
  // git grep eşleşme bulamazsa exit 1 döner: boş sonuç sayılır.
  if (args[0] === "grep") {
    try {
      return execFileSync("git", ["-c", "core.quotepath=false", ...args], {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch (error) {
      if (error.status === 1) return "";
      throw error;
    }
  }
  return execFileSync("git", ["-c", "core.quotepath=false", ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

export function runChecks() {
  const tracked = git(["ls-files"]).split("\n").filter(Boolean);
  const trackedFiles = new Set(tracked);
  const trackedDirs = new Set();
  for (const f of tracked) {
    const parts = f.split("/");
    for (let i = 1; i < parts.length; i++) trackedDirs.add(parts.slice(0, i).join("/"));
  }

  const errors = [];
  const warnings = [];

  // 1. INDEX
  const topDirs = [...new Set(tracked.filter((f) => /^docs\/[^/]+\//.test(f)).map((f) => f.split("/")[1]))].sort();
  // Bilinen adlar: docs altındaki her dizinin adı + diskte var olan (yerel çıktı / kök klonu) dizinler.
  const knownNames = new Set(
    [...trackedDirs].filter((d) => d.startsWith("docs/")).map((d) => d.slice(d.lastIndexOf("/") + 1)),
  );
  const readme = readFileSync("docs/README.md", "utf8");
  for (const m of readme.matchAll(/`([a-z0-9][a-z0-9_.-]*)\/`/g))
    if (existsSync(`docs/${m[1]}`) || existsSync(m[1])) knownNames.add(m[1]);
  const { missing, stale } = checkIndex(topDirs, readme, knownNames);
  for (const d of missing) errors.push(`INDEX     docs/README.md üst dizini anmıyor: docs/${d}/`);
  for (const d of stale) errors.push(`INDEX     docs/README.md var olmayan dizini anıyor: ${d}/`);

  // 2. KIRIK
  const migrationRefs = [];
  // Yalnız `docs/` geçen dosyalar okunur (git grep indeksten çalışır). Tüm izlenen metin
  // dosyalarını okumak Windows'ta ~10 sn sürüyordu ve bu denetim prelint'te koşar.
  const candidates = new Set(git(["grep", "-l", "-F", "docs/"]).split(String.fromCharCode(10)).filter(Boolean));
  for (const path of tracked) {
    if (!candidates.has(path)) continue;
    const fromMigration = path.startsWith("supabase/migrations/") && path.endsWith(".sql");
    if (!fromMigration && !isScannedForRefs(path)) continue;
    let text;
    try {
      text = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    for (const ref of extractDocRefs(text)) {
      if (refExists(ref, trackedFiles, trackedDirs, existsSync)) continue;
      if (fromMigration) migrationRefs.push(`${ref}  <=  ${path}`);
      else errors.push(`KIRIK     ${ref}  <=  ${path}`);
    }
  }
  for (const r of migrationRefs) warnings.push(`KIRIK-MIG ${r}  (migration değiştirilemez — yalnız bilgi)`);

  // 3. KOPYA
  const entries = git(["ls-files", "-s", "docs"])
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [meta, path] = line.split("\t");
      return { blob: meta.split(" ")[1], path };
    });
  for (const g of findDuplicateGroups(entries)) errors.push(`KOPYA     ${g.join("  ==  ")}`);

  // 4. YERINI + 5. AD
  for (const path of tracked.filter((f) => f.startsWith("docs/"))) {
    if (!checkDatedName(path)) warnings.push(`AD        ${path}`);
    if (!path.endsWith(".md") || HISTORICAL_PREFIXES.some((p) => path.startsWith(p))) continue;
    const target = supersededTarget(readFileSync(path, "utf8"));
    if (target === null) errors.push(`YERINI    ${path}: durum yerini-aldı ama yerini_alan yok`);
    else if (target && !refExists(target, trackedFiles, trackedDirs, existsSync))
      errors.push(`YERINI    ${path}: yerini_alan hedefi yok → ${target}`);
  }

  return { errors, warnings };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const strict = process.argv.includes("--strict");
  const { errors, warnings } = runChecks();
  for (const w of warnings) console.log(`  uyarı  ${w}`);
  for (const e of errors) console.log(`  HATA   ${e}`);
  console.log(`\n[check-docs] ${errors.length} hata · ${warnings.length} uyarı${strict ? " (strict)" : ""}`);
  if (strict && errors.length > 0) process.exitCode = 1;
}

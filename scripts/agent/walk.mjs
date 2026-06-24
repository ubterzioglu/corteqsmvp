// Paylaşılan dosya-yürüme yardımcısı — verify-text-encoding.mjs desenini izler.
// Repo ağacını gezer, skipDirs'i atlar, eşleşen dosyaların yollarını döndürür.
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const DEFAULT_SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  "build",
  ".vite",
]);

/**
 * @param {string} rootDir Mutlak kök dizin (genelde process.cwd()).
 * @param {object} [opts]
 * @param {Set<string>} [opts.skipDirs] Atlanacak dizin adları.
 * @param {(absPath: string, relPath: string) => boolean} [opts.accept]
 *   Bir dosyanın sonuç listesine girip girmeyeceğini belirler.
 * @returns {Promise<string[]>} Köke göre POSIX-ayraçlı göreli yollar.
 */
export async function walkRepo(rootDir, opts = {}) {
  const skipDirs = opts.skipDirs ?? DEFAULT_SKIP_DIRS;
  const accept = opts.accept ?? (() => true);
  const found = [];

  async function recurse(targetPath) {
    const entry = await stat(targetPath);
    if (entry.isDirectory()) {
      if (skipDirs.has(path.basename(targetPath))) return;
      const children = await readdir(targetPath, { withFileTypes: true });
      for (const child of children) {
        await recurse(path.join(targetPath, child.name));
      }
      return;
    }
    const rel = path.relative(rootDir, targetPath).split(path.sep).join("/");
    if (accept(targetPath, rel)) {
      found.push(rel);
    }
  }

  await recurse(rootDir);
  found.sort();
  return found;
}

/**
 * Bir göreli yoldan `module_family` türetir (path-tabanlı sınıflandırma).
 * @param {string} relPath POSIX-ayraçlı göreli yol.
 * @returns {string}
 */
export function moduleFamilyOf(relPath) {
  if (relPath.startsWith("supabase/functions/")) return "edge";
  if (relPath.startsWith("workers/")) return "worker";
  if (relPath.startsWith("scripts/")) return "script";
  if (relPath.startsWith("supabase/migrations/")) return "migration";
  if (relPath.startsWith("docs/")) return "docs";
  if (relPath === "README.md" || relPath === "server.mjs") return "runtime";

  if (relPath.startsWith("src/lib/cadde")) return "cadde";
  if (relPath.startsWith("src/lib/muhasebe")) return "muhasebe";
  if (relPath.includes("survey")) return "surveys";
  if (relPath.includes("catalog")) return "catalog";
  if (relPath.includes("relocation")) return "relocation";
  if (relPath.startsWith("src/lib/")) return "lib";
  if (relPath.startsWith("src/")) return "ui";
  return "other";
}

/**
 * Bir yolun uzantısından `kind` döndürür.
 * @param {string} relPath
 * @returns {string}
 */
export function kindOf(relPath) {
  const ext = path.extname(relPath).replace(/^\./, "").toLowerCase();
  return ext || "none";
}

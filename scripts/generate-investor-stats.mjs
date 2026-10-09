#!/usr/bin/env node
// Yatırımcı sayfası (/yatirimci) için REPO rakamlarını üretir.
//
// NEDEN: CLAUDE.md'deki elle yazılmış rakamlar defalarca bayatladı. Yatırımcıya
// gösterilen sayı ölçülmüş olmalı; bu script `git ls-files` üzerinden sayar
// (çıplak `find` gitignore'lu `referanslovable/` klonunu da tarar — yanlış sonuç).
//
// Canlı DB rakamları (tablo/RLS/rol) buradan ÜRETİLMEZ — onlar
// `src/lib/investor/investor-content.ts` içinde ölçüm tarihiyle elle durur.
//
// Kullanım: npm run investor:stats            → dosyayı yazar
//           npm run investor:stats -- --check → dosya güncel değilse exit 1

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(projectRoot, "src", "lib", "investor", "investor-stats.generated.ts");

const STACK_PACKAGES = [
  "react",
  "typescript",
  "vite",
  "react-router-dom",
  "@tanstack/react-query",
  "tailwindcss",
  "zod",
  "react-hook-form",
  "framer-motion",
  "@supabase/supabase-js",
  "vitest",
  "@playwright/test",
];

/** @returns {string[]} */
export function gitFiles(patterns) {
  const out = execFileSync("git", ["ls-files", "--", ...patterns], {
    cwd: projectRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split(/\r?\n/).filter(Boolean);
}

const isTestFile = (file) => /\.(test|spec)\.(ts|tsx|mjs|js)$/.test(file);
const isGenerated = (file) => /\.generated\.ts$/.test(file) || file.endsWith("integrations/supabase/types.ts");

function countLines(files) {
  let total = 0;
  for (const file of files) {
    const full = path.join(projectRoot, file);
    // BİLEREK: izlenen ama çalışma ağacında silinmiş dosya sayımı düşürmesin.
    if (!existsSync(full)) continue;
    total += readFileSync(full, "utf8").split("\n").length;
  }
  return total;
}

/** Kaynak koddaki (git'te izlenen) edge function sayısı — canlı dağıtım sayısı DEĞİL. */
function countEdgeFunctions() {
  const names = new Set(
    gitFiles(["supabase/functions/*/index.ts"])
      .map((file) => file.split("/")[2])
      .filter((name) => name && !name.startsWith("_")),
  );
  return names.size;
}

function readVersions() {
  const pkg = JSON.parse(readFileSync(path.join(projectRoot, "package.json"), "utf8"));
  const all = { ...pkg.dependencies, ...pkg.devDependencies };
  const versions = {};
  for (const name of STACK_PACKAGES) {
    const raw = all[name];
    if (raw) versions[name] = String(raw).replace(/^[\^~]/, "");
  }
  return { versions, node: pkg.engines?.node ?? "" };
}

function countLazyRoutes() {
  const app = readFileSync(path.join(projectRoot, "src", "App.tsx"), "utf8");
  return (app.match(/lazyWithReload\(\(\) =>/g) ?? []).length;
}

/** Repo rakamlarını ölçer. Saf veri döner, dosyaya yazmaz. */
export function collectInvestorStats() {
  const srcFiles = gitFiles(["src/*.ts", "src/*.tsx"]);
  const srcTests = srcFiles.filter(isTestFile);
  const srcProduction = srcFiles.filter((f) => !isTestFile(f) && !isGenerated(f));
  const allTests = gitFiles(["*.test.ts", "*.test.tsx", "*.test.mjs", "*.test.js"]);
  const e2eSpecs = gitFiles(["*.spec.ts"]);
  const appliedMigrations = gitFiles(["supabase/migrations/applied/*.sql"]);
  const archivedMigrations = gitFiles(["supabase/migrations/archive/*.sql"]);
  const pages = gitFiles(["src/pages/*.tsx"]).filter((f) => !isTestFile(f));
  const components = gitFiles(["src/components/*.tsx"]).filter((f) => !isTestFile(f));
  const { versions, node } = readVersions();

  return {
    sourceFiles: srcFiles.length - srcTests.length,
    productionLines: countLines(srcProduction),
    testFiles: allTests.length,
    e2eSpecs: e2eSpecs.length,
    pages: pages.length,
    components: components.length,
    lazyRoutes: countLazyRoutes(),
    edgeFunctions: countEdgeFunctions(),
    migrations: appliedMigrations.length + archivedMigrations.length,
    versions,
    node,
  };
}

export function renderStatsModule(stats, measuredAt) {
  const body = JSON.stringify({ measuredAt, ...stats }, null, 2);
  return (
    "// BU DOSYA ÜRETİLİR — elle düzenleme. Kaynak: scripts/generate-investor-stats.mjs\n" +
    "// Güncellemek için: npm run investor:stats\n\n" +
    `export const INVESTOR_REPO_STATS = ${body} as const;\n`
  );
}

function stripMeasuredAt(text) {
  return text.replace(/"measuredAt": "[^"]*",?\n/, "");
}

function main() {
  const check = process.argv.includes("--check");
  const stats = collectInvestorStats();
  const today = new Date().toISOString().slice(0, 10);
  const next = renderStatsModule(stats, today);

  if (check) {
    let current = "";
    try {
      current = readFileSync(OUTPUT_PATH, "utf8");
    } catch {
      console.error(`[investor:stats] ${path.relative(projectRoot, OUTPUT_PATH)} yok.`);
      process.exit(1);
    }
    if (stripMeasuredAt(current) !== stripMeasuredAt(next)) {
      console.error("[investor:stats] Rakamlar bayat — `npm run investor:stats` çalıştır.");
      process.exit(1);
    }
    console.log("[investor:stats] güncel.");
    return;
  }

  writeFileSync(OUTPUT_PATH, next, "utf8");
  console.log(`[investor:stats] yazıldı → ${path.relative(projectRoot, OUTPUT_PATH)}`);
  console.log(JSON.stringify(stats, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

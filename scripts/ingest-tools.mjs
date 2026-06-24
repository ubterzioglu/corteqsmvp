#!/usr/bin/env node
// Repo ingestion — canlı koddan makinece-okunabilir tool kataloğu türetir.
// Çıktı: docs/agent/tools.json (tek doğruluk kaynağı, git'e commit edilir).
// Kullanım:
//   node scripts/ingest-tools.mjs          → docs/agent/tools.json yaz
//   node scripts/ingest-tools.mjs --check  → kataloğu yeniden üret ve commit'liyle karşılaştır (CI)
//
// Bu bir build-time script'idir (edge function değil); verify-text-encoding.mjs
// desenini izler. Runtime'a bağımlılık eklemez.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { walkRepo, moduleFamilyOf, kindOf } from "./agent/walk.mjs";
import {
  extractEdgeTool,
  extractWorkerTool,
  extractLibTool,
  extractScriptTool,
} from "./agent/extract.mjs";

const rootDir = process.cwd();
const OUT_DIR = path.join(rootDir, "docs", "agent");
const OUT_FILE = path.join(OUT_DIR, "tools.json");

async function readSafe(relPath) {
  try {
    return await readFile(path.join(rootDir, relPath), "utf-8");
  } catch {
    return "";
  }
}

async function collectEdgeTools(files) {
  const indexes = files.filter(
    (f) => /^supabase\/functions\/[^/]+\/index\.ts$/.test(f),
  );
  const tools = [];
  for (const rel of indexes) {
    const source = await readSafe(rel);
    tools.push(extractEdgeTool(rel, source));
  }
  return tools;
}

async function collectWorkerTools(files) {
  const pkgs = files.filter((f) => /^workers\/[^/]+\/package\.json$/.test(f));
  const tools = [];
  for (const rel of pkgs) {
    const name = rel.split("/")[1];
    const pkgText = await readSafe(rel);
    // Worker'ın tüm src/**/*.ts dosyalarını tek metinde birleştirip data-access tara.
    const srcFiles = files.filter(
      (f) => f.startsWith(`workers/${name}/src/`) && f.endsWith(".ts") && !f.endsWith(".test.ts"),
    );
    let combined = "";
    for (const sf of srcFiles) combined += await readSafe(sf);
    tools.push(extractWorkerTool(rel, pkgText, combined));
  }
  return tools;
}

async function collectLibTools(files) {
  const libs = files.filter(
    (f) => /^src\/lib\/[a-zA-Z0-9-]+-api\.ts$/.test(f),
  );
  const tools = [];
  for (const rel of libs) {
    const source = await readSafe(rel);
    tools.push(extractLibTool(rel, source));
  }
  return tools;
}

function buildFileIndex(files) {
  return files.map((rel) => ({
    path: rel,
    kind: kindOf(rel),
    module_family: moduleFamilyOf(rel),
  }));
}

async function main() {
  const checkMode = process.argv.includes("--check");

  const files = await walkRepo(rootDir, {
    accept: (_abs, rel) => {
      if (rel.includes("node_modules/")) return false;
      return (
        /^supabase\/functions\//.test(rel) ||
        /^workers\//.test(rel) ||
        /^src\/lib\//.test(rel) ||
        rel === "package.json"
      );
    },
  });

  const pkgText = await readSafe("package.json");
  let scripts = {};
  try {
    scripts = JSON.parse(pkgText).scripts ?? {};
  } catch {
    scripts = {};
  }

  const edgeTools = await collectEdgeTools(files);
  const workerTools = await collectWorkerTools(files);
  const libTools = await collectLibTools(files);
  const scriptTool = extractScriptTool(scripts);

  const tools = [...edgeTools, ...workerTools, ...libTools, scriptTool].sort(
    (a, b) => a.tool_key.localeCompare(b.tool_key),
  );

  const catalog = {
    schema_version: 1,
    generated_by: "scripts/ingest-tools.mjs",
    counts: {
      total: tools.length,
      edge_functions: edgeTools.length,
      workers: workerTools.length,
      ui_modules: libTools.length,
    },
    tools,
    file_index: buildFileIndex(files.filter((f) => !f.includes("node_modules/"))),
  };

  // Deterministik JSON (stabil diff için 2-boşluk + sıralı).
  const json = JSON.stringify(catalog, null, 2) + "\n";

  if (checkMode) {
    const existing = await readSafe("docs/agent/tools.json");
    if (existing !== json) {
      console.error(
        "[ingest-tools] docs/agent/tools.json güncel değil. `node scripts/ingest-tools.mjs` çalıştırıp commit'leyin.",
      );
      process.exit(1);
    }
    console.log("[ingest-tools] Katalog güncel.");
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, json, "utf-8");
  console.log(
    `[ingest-tools] ${tools.length} tool kataloglandı → docs/agent/tools.json ` +
      `(${edgeTools.length} edge, ${workerTools.length} worker, ${libTools.length} modül).`,
  );

  if (process.argv.includes("--push")) {
    const { pushCatalog } = await import("./agent/push.mjs");
    const count = await pushCatalog(rootDir, catalog);
    console.log(`[ingest-tools] ${count} tool ingest.tools tablosuna upsert edildi.`);
  }
}

main().catch((err) => {
  console.error("[ingest-tools] HATA:", err);
  process.exit(1);
});

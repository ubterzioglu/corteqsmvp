#!/usr/bin/env node
// Drift detector — doküman/versiyon/endpoint çelişkilerini deklaratif kurallarla yakalar.
// Çıktı: docs/agent/drift-report.json + insan-okunur stdout özeti.
// Kullanım:
//   node scripts/check-drift.mjs           → raporla (drift varsa exit 1)
//   node scripts/check-drift.mjs --warn     → raporla ama her zaman exit 0 (uyarı modu / CI rampası)
//
// scripts/agent/drift-rules.mjs içindeki kuralları çalıştırır. Tool kataloğu
// (docs/agent/tools.json) varsa kurallara bağlam olarak verilir; önce
// `node scripts/ingest-tools.mjs` çalıştırmak güncel sonuç verir.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { driftRules } from "./agent/drift-rules.mjs";

const rootDir = process.cwd();
const OUT_DIR = path.join(rootDir, "docs", "agent");
const OUT_FILE = path.join(OUT_DIR, "drift-report.json");

function readSafeSync() {
  const cache = new Map();
  return async (relPath) => {
    if (cache.has(relPath)) return cache.get(relPath);
    let content = "";
    try {
      content = await readFile(path.join(rootDir, relPath), "utf-8");
    } catch {
      content = "";
    }
    cache.set(relPath, content);
    return content;
  };
}

async function main() {
  const warnOnly = process.argv.includes("--warn");
  const reader = readSafeSync();

  const pkgText = await reader("package.json");
  let pkg = {};
  try {
    pkg = JSON.parse(pkgText);
  } catch {
    pkg = {};
  }

  const catalogText = await reader("docs/agent/tools.json");
  let catalog = null;
  try {
    catalog = catalogText ? JSON.parse(catalogText) : null;
  } catch {
    catalog = null;
  }

  // Kurallar senkron `read` bekliyor; tüm gerekli dosyaları önceden yükleyip
  // senkron erişim sağlayan bir sarmalayıcı kullan.
  // NOT: AGENT_CONTEXT.md ve ARCHITECTURE.md 2026-08-04'te kökten docs/ altına taşındı.
  // Bu yollar drift-rules.mjs'teki `docs` dizisiyle BİREBİR aynı olmalı — eşleşmezse
  // ctx.read("") döner ve kural sessizce hiç bulgu üretmez.
  const preload = [
    "README.md",
    "docs/AGENT_CONTEXT.md",
    "docs/ARCHITECTURE.md",
    "CLAUDE.md",
    "package.json",
  ];
  const loaded = new Map();
  for (const p of preload) loaded.set(p, await reader(p));
  const read = (relPath) => loaded.get(relPath) ?? "";

  const ctx = { read, pkg, catalog };

  const findings = [];
  for (const rule of driftRules) {
    try {
      findings.push(...rule(ctx));
    } catch (err) {
      findings.push({
        rule: rule.name || "unknown",
        severity: "error",
        message: `Kural çalıştırılamadı: ${err instanceof Error ? err.message : String(err)}`,
        evidence: [],
      });
    }
  }

  const report = {
    schema_version: 1,
    generated_by: "scripts/check-drift.mjs",
    catalog_present: Boolean(catalog),
    total: findings.length,
    by_severity: findings.reduce((acc, f) => {
      acc[f.severity] = (acc[f.severity] ?? 0) + 1;
      return acc;
    }, {}),
    findings,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(report, null, 2) + "\n", "utf-8");

  if (findings.length === 0) {
    console.log("[check-drift] Drift bulunamadı. ✓");
    return;
  }

  console.log(`[check-drift] ${findings.length} drift bulundu:`);
  for (const f of findings) {
    const where = f.evidence
      .map((e) => (e.line ? `${e.path}:${e.line}` : e.path))
      .join(", ");
    console.log(`  [${f.severity}] ${f.rule} — ${f.message}`);
    if (where) console.log(`      → ${where}`);
  }
  console.log(`\n[check-drift] Rapor: docs/agent/drift-report.json`);

  if (!warnOnly) process.exit(1);
}

main().catch((err) => {
  console.error("[check-drift] HATA:", err);
  process.exit(1);
});

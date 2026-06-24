// Tool kataloğu doğrulama testi — her tool AYRI AYRI test edilir.
// Katalogdaki her girdinin gerçek kaynak dosyaya karşı tutarlılığını kontrol eder.
// Bu, ingestion'ın doğruluğunu kanıtlayan kalıcı bir regresyon ağıdır (CI'da koşar).
import { describe, expect, it, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  extractEdgeTool,
  extractWorkerTool,
  extractLibTool,
} from "./extract.mjs";
import { buildOpenApi } from "./openapi.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf-8");
}

let catalog;
beforeAll(() => {
  catalog = JSON.parse(read("docs/agent/tools.json"));
});

describe("tool kataloğu — genel sağlık", () => {
  it("katalog üretildi ve sayımlar tutarlı", () => {
    expect(catalog.schema_version).toBe(1);
    const fams = catalog.tools.reduce((a, t) => {
      a[t.family] = (a[t.family] ?? 0) + 1;
      return a;
    }, {});
    expect(fams.edge_function).toBe(catalog.counts.edge_functions);
    expect(fams.worker).toBe(catalog.counts.workers);
    expect(fams.ui_module).toBe(catalog.counts.ui_modules);
    expect(catalog.counts.total).toBe(catalog.tools.length);
  });

  it("her tool benzersiz tool_key taşır", () => {
    const keys = catalog.tools.map((t) => t.tool_key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("her tool'un entrypoint'i diskte mevcut", () => {
    for (const t of catalog.tools) {
      if (t.tool_key === "cli.npm_scripts") continue; // package.json
      const p = t.entrypoint.endsWith("/")
        ? t.entrypoint // worker dizini
        : t.entrypoint;
      expect(existsSync(path.join(root, p)), `${t.tool_key} → ${p}`).toBe(true);
    }
  });
});

// --- EDGE FUNCTIONS: her biri ayrı test ------------------------------------
describe("edge functions — tool-by-tool", () => {
  const edgeKeys = [
    "edge.find_matches",
    "edge.lansman_admin",
    "edge.radar_news_scan",
    "edge.relocation_notifications",
    "edge.send_submission_email",
    "edge.submit_survey_response",
  ];

  it.each(edgeKeys)("%s katalog girdisi kaynaktan yeniden türetilebilir", (key) => {
    const tool = catalog.tools.find((t) => t.tool_key === key);
    expect(tool, `${key} katalogda yok`).toBeTruthy();
    const source = read(tool.entrypoint);
    const fresh = extractEdgeTool(tool.entrypoint, source);
    // Kritik alanlar kaynaktan birebir yeniden üretilmeli (idempotent extraction).
    expect(fresh.status).toBe(tool.status);
    expect(fresh.input_schema.validation).toBe(tool.input_schema.validation);
    expect(fresh.version_pins).toEqual(tool.version_pins);
    expect(fresh.tables_read_write).toEqual(tool.tables_read_write);
  });

  it("find-matches: Zod input + limitler doğru çıkarıldı", () => {
    const t = catalog.tools.find((x) => x.tool_key === "edge.find_matches");
    expect(t.input_schema.validation).toBe("zod");
    expect(t.input_schema.fields).toContain("offers_needs");
    expect(t.input_schema.fields).toContain("persist");
    expect(t.limits.RATE_LIMIT_MAX).toBe(8);
    expect(t.limits.MAX_BODY_BYTES).toBe(16000);
    expect(t.tables_read_write).toContain("submissions");
    expect(t.tables_read_write).toContain("matches");
  });

  it("lansman-admin: 410 → status deprecated", () => {
    const t = catalog.tools.find((x) => x.tool_key === "edge.lansman_admin");
    expect(t.status).toBe("deprecated");
    expect(read(t.entrypoint)).toMatch(/410/);
  });

  it("aktif edge function'lar deprecated değil", () => {
    const active = catalog.tools.filter(
      (t) => t.family === "edge_function" && t.tool_key !== "edge.lansman_admin",
    );
    expect(active.every((t) => t.status === "active")).toBe(true);
  });
});

// --- WORKERS: her biri ayrı test -------------------------------------------
describe("workers — tool-by-tool", () => {
  const workerKeys = ["worker.relocation_ingestion", "worker.service_finder"];

  it.each(workerKeys)("%s package.json ile tutarlı", (key) => {
    const tool = catalog.tools.find((t) => t.tool_key === key);
    expect(tool).toBeTruthy();
    const pkgRel = `${tool.entrypoint}package.json`;
    const pkg = JSON.parse(read(pkgRel));
    expect(tool.node_engine).toBe(pkg.engines?.node ?? null);
    expect(tool.version_pins["@supabase/supabase-js"]).toBe(
      pkg.dependencies?.["@supabase/supabase-js"],
    );
    // Yeniden türetme idempotent.
    const fresh = extractWorkerTool(pkgRel, read(pkgRel), "");
    expect(fresh.tool_name).toBe(tool.tool_name);
    expect(fresh.node_engine).toBe(tool.node_engine);
  });
});

// --- UI MODULES: her biri ayrı test ----------------------------------------
describe("ui modülleri — tool-by-tool", () => {
  it("her *-api modülü export ve veri-erişim çıkarımı taşır", () => {
    const mods = catalog.tools.filter((t) => t.family === "ui_module");
    expect(mods.length).toBeGreaterThanOrEqual(17);
    for (const tool of mods) {
      const source = read(tool.entrypoint);
      const fresh = extractLibTool(tool.entrypoint, source);
      expect(fresh.exports, `${tool.tool_key} exports`).toEqual(tool.exports);
      expect(fresh.rpcs, `${tool.tool_key} rpcs`).toEqual(tool.rpcs);
      // En az bir export veya RPC olmalı (boş api modülü = ingestion hatası işareti).
      expect(
        tool.exports.length + tool.rpcs.length,
        `${tool.tool_key} boş görünüyor`,
      ).toBeGreaterThan(0);
    }
  });

  it("muhasebe-api referans desen olarak export taşır", () => {
    const t = catalog.tools.find((x) => x.tool_key === "module.muhasebe_api");
    expect(t).toBeTruthy();
    expect(t.exports.length).toBeGreaterThan(0);
  });
});

// --- OPENAPI: sözleşme üretimi (Faz 2) -------------------------------------
describe("openapi sözleşmesi", () => {
  it("her edge function için bir path üretilir", () => {
    const yaml = buildOpenApi(catalog);
    const edges = catalog.tools.filter((t) => t.family === "edge_function");
    for (const e of edges) {
      expect(yaml, `${e.tool_name} path eksik`).toContain(
        `/functions/v1/${e.tool_name}:`,
      );
      expect(yaml).toContain(`x-tool-key: ${e.tool_key}`);
    }
  });

  it("deprecated edge function spec'te deprecated: true taşır", () => {
    const yaml = buildOpenApi(catalog);
    const block = yaml.slice(yaml.indexOf("/functions/v1/lansman-admin:"));
    expect(block).toContain("deprecated: true");
  });

  it("find-matches required offers_needs + kısıtlar taşır", () => {
    const yaml = buildOpenApi(catalog);
    expect(yaml).toContain("required: [offers_needs]");
    expect(yaml).toContain("minLength: 5");
    expect(yaml).toContain("maxLength: 2000");
  });

  it("üretim deterministiktir (aynı katalog → aynı YAML)", () => {
    expect(buildOpenApi(catalog)).toBe(buildOpenApi(catalog));
  });
});

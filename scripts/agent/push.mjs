// Tool kataloğunu Supabase ingest.tools tablosuna upsert eder (opsiyonel DB projeksiyonu).
// scripts/import-command-center-may13.mjs env-yükleme desenini izler.
// Service role kullanır (RLS bypass). Yalnız --push flag'i ile çağrılır.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function parseEnvFile(content) {
  const result = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const sep = line.indexOf("=");
    if (sep <= 0) continue;
    const key = line.slice(0, sep).trim();
    let value = line.slice(sep + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

async function loadEnv(rootDir) {
  try {
    const content = await readFile(path.join(rootDir, ".env.local"), "utf8");
    return parseEnvFile(content);
  } catch {
    return {};
  }
}

/**
 * Kataloğu ingest.tools'a upsert eder.
 * @param {string} rootDir
 * @param {{ tools: object[] }} catalog
 */
export async function pushCatalog(rootDir, catalog) {
  const env = await loadEnv(rootDir);
  const supabaseUrl =
    process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL/VITE_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik (.env.local veya ortam değişkeni).",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const rows = catalog.tools.map((t) => ({
    tool_key: t.tool_key,
    tool_name: t.tool_name,
    tool_family: t.family,
    status: t.status,
    entrypoint_path: t.entrypoint,
    interface_kind: t.interface_kind,
    input_schema: t.input_schema ?? null,
    tables_read_write: t.tables_read_write ?? [],
    rpcs: t.rpcs ?? [],
    dependencies: t.dependencies ?? [],
    version_pins: t.version_pins ?? {},
    evidence_path: t.evidence_path ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .schema("ingest")
    .from("tools")
    .upsert(rows, { onConflict: "tool_key" });

  if (error) {
    throw new Error(`ingest.tools upsert hatası: ${error.message}`);
  }
  return rows.length;
}

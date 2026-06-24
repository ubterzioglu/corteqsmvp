// Tool kataloğunu Supabase ingest.tools tablosuna upsert eder (opsiyonel DB projeksiyonu).
// PostgREST `ingest` şemasını expose etmediği için yazma, Supabase Management API
// /database/query üzerinden INSERT ... ON CONFLICT ile yapılır (PostgREST bypass).
// scripts/import-command-center-may13.mjs env-yükleme desenini izler.
import { readFile } from "node:fs/promises";
import path from "node:path";

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

// SQL literal kaçışı (tek tırnak ikiye katlanır). Türkçe karakterler korunur.
function sqlStr(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

// jsonb literal: JSON.stringify + ::jsonb cast.
function sqlJsonb(value) {
  if (value === null || value === undefined) return "null::jsonb";
  return `${sqlStr(JSON.stringify(value))}::jsonb`;
}

/**
 * Kataloğu ingest.tools'a upsert eder (Management API).
 * @param {string} rootDir
 * @param {{ tools: object[] }} catalog
 * @param {string} [nowIso] Deterministik test için zaman damgası.
 */
export async function pushCatalog(rootDir, catalog, nowIso) {
  const env = await loadEnv(rootDir);
  const token =
    process.env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN;
  const ref =
    process.env.VITE_SUPABASE_PROJECT_ID ||
    env.VITE_SUPABASE_PROJECT_ID ||
    env.SUPABASE_PROJECT_ID;

  if (!token || !ref) {
    throw new Error(
      "SUPABASE_ACCESS_TOKEN veya VITE_SUPABASE_PROJECT_ID eksik (.env.local veya ortam değişkeni).",
    );
  }

  const stamp = nowIso ?? new Date().toISOString();
  const values = catalog.tools
    .map((t) => {
      const cols = [
        sqlStr(t.tool_key),
        sqlStr(t.tool_name),
        sqlStr(t.family),
        sqlStr(t.status),
        sqlStr(t.entrypoint),
        sqlStr(t.interface_kind),
        sqlJsonb(t.input_schema ?? null),
        sqlJsonb(t.tables_read_write ?? []),
        sqlJsonb(t.rpcs ?? []),
        sqlJsonb(t.dependencies ?? []),
        sqlJsonb(t.version_pins ?? {}),
        sqlStr(t.evidence_path ?? null),
        sqlStr(stamp),
      ];
      return `(${cols.join(", ")})`;
    })
    .join(",\n  ");

  const sql = `
insert into ingest.tools (
  tool_key, tool_name, tool_family, status, entrypoint_path, interface_kind,
  input_schema, tables_read_write, rpcs, dependencies, version_pins, evidence_path, updated_at
) values
  ${values}
on conflict (tool_key) do update set
  tool_name = excluded.tool_name,
  tool_family = excluded.tool_family,
  status = excluded.status,
  entrypoint_path = excluded.entrypoint_path,
  interface_kind = excluded.interface_kind,
  input_schema = excluded.input_schema,
  tables_read_write = excluded.tables_read_write,
  rpcs = excluded.rpcs,
  dependencies = excluded.dependencies,
  version_pins = excluded.version_pins,
  evidence_path = excluded.evidence_path,
  updated_at = excluded.updated_at;
`;

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ingest.tools upsert hatası (HTTP ${res.status}): ${text}`);
  }
  return catalog.tools.length;
}

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

import {
  buildImportRecords,
  ensureCatalogCategory,
  loadRoleMap,
  parseCsv,
  resolveRoleConfig,
  upsertImportRecord,
} from "./catalog-role-importer.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const defaultMapPath = path.join(__dirname, "catalog-role-import-map.json");

const args = process.argv.slice(2);
const writeMode = args.includes("--write");

function getArg(name, fallback = "") {
  const prefix = `--${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function getDefaults() {
  const defaults = {};
  for (const arg of args) {
    if (!arg.startsWith("--defaults.")) continue;
    const [rawKey, ...valueParts] = arg.slice("--defaults.".length).split("=");
    defaults[rawKey] = valueParts.join("=");
  }
  return defaults;
}

function parseEnvFile(content) {
  const result = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

async function createAdminClient(envFilePath) {
  const env = parseEnvFile(await readFile(envFilePath, "utf8"));
  const supabaseUrl = process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function run() {
  const roleKey = getArg("role");
  const csvPath = getArg("csv");
  const envFilePath = path.resolve(projectRoot, getArg("env-file", ".env.local"));
  const mapPath = path.resolve(projectRoot, getArg("map", defaultMapPath));
  const delimiter = getArg("delimiter", ";");

  if (!roleKey) throw new Error("--role gerekli.");
  if (!csvPath) throw new Error("--csv gerekli.");

  const roleMap = await loadRoleMap(mapPath);
  const roleConfig = resolveRoleConfig(roleMap, roleKey);
  const rows = parseCsv(await readFile(csvPath, "utf8"), delimiter);
  const sourceType = getArg("source", `csv.${roleKey}`);
  const records = buildImportRecords(rows, roleConfig, roleMap, {
    sourceType,
    sourceLabel: getArg("source-label", `${roleConfig.label} CSV`),
    defaults: getDefaults(),
  });

  console.log(`CSV okundu: ${records.length} kayıt`);
  console.log(`Rol: ${roleKey} (${roleConfig.label})`);
  console.log(`Item type: ${roleConfig.itemType}`);
  console.log(`Mod: ${writeMode ? "WRITE" : "DRY RUN"}`);

  if (!writeMode) {
    for (const record of records) {
      console.log(`- ${record.title} | ${record.roleLabel} | ${record.location.city || "-"} | ${record.sourceUrl || "source yok"}`);
    }
    return;
  }

  const supabase = await createAdminClient(envFilePath);
  const imported = [];

  for (const record of records) {
    const categoryId = await ensureCatalogCategory(supabase, record);
    const itemId = await upsertImportRecord(supabase, record, categoryId, sourceType);
    imported.push(itemId);
    console.log(`IMPORTED: ${record.title} -> ${itemId}`);
  }

  console.log(`Toplam import edilen/kaynakla eşlenen kayıt: ${imported.length}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

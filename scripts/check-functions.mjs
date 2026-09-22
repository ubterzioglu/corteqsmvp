// scripts/check-functions.mjs
// Canlı Supabase Edge Function listesi ile deploy edilebilir repo fonksiyonlarını
// karşılaştırır. Frontend deploy'u Edge Function deploy'u YAPMADIĞI için bu kontrol
// ayrışmayı CI/yerel doğrulamada görünür kılar.

import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const FUNCTIONS_DIR = "supabase/functions";

export function repoFunctionNames(entryNames) {
  return [...new Set(entryNames.filter((name) => !name.startsWith("_")))].sort();
}

export function diffFunctionSets({ repoNames, liveNames }) {
  const repo = new Set(repoNames);
  const live = new Set(liveNames);
  const repoOnly = [...repo].filter((name) => !live.has(name)).sort();
  const liveOnly = [...live].filter((name) => !repo.has(name)).sort();
  return { repoOnly, liveOnly, ok: repoOnly.length === 0 && liveOnly.length === 0 };
}

function readProjectRef() {
  const config = readFileSync(path.join(projectRoot, "supabase/config.toml"), "utf8");
  const match = config.match(/^project_id\s*=\s*"([^"]+)"/m);
  if (!match) throw new Error("supabase/config.toml içinde project_id bulunamadı.");
  return match[1];
}

function readEnvValue(name) {
  if (process.env[name]) return process.env[name];
  const envPath = path.join(projectRoot, ".env.local");
  const text = readFileSync(envPath, "utf8");
  const match = text.match(new RegExp(`^${name}=(.*)$`, "m"));
  if (!match) return null;
  return match[1].trim().replace(/^['"]|['"]$/g, "");
}

async function fetchLiveFunctionNames(projectRef, accessToken) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/functions`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Management API HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload)) throw new Error("Management API beklenen fonksiyon listesini döndürmedi.");
  return payload
    .filter((entry) => entry && typeof entry.slug === "string" && entry.status === "ACTIVE")
    .map((entry) => entry.slug);
}

async function main() {
  const accessToken = readEnvValue("SUPABASE_ACCESS_TOKEN");
  if (!accessToken) {
    console.error("[check-functions] SUPABASE_ACCESS_TOKEN yok — canlı kontrol yapılamadı.");
    process.exit(2);
  }

  const entries = await readdir(path.join(projectRoot, FUNCTIONS_DIR), { withFileTypes: true });
  const repoNames = repoFunctionNames(entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name));
  const liveNames = await fetchLiveFunctionNames(readProjectRef(), accessToken);
  const result = diffFunctionSets({ repoNames, liveNames });

  console.log(`[check-functions] repo ${repoNames.length} · canlı ${new Set(liveNames).size} aktif fonksiyon`);
  if (result.ok) {
    console.log("[check-functions] Sapma yok — canlı ve repo fonksiyonları eşleşiyor.");
    return;
  }
  if (result.repoOnly.length) console.error(`[check-functions] REPO'DA VAR, CANLIDA YOK: ${result.repoOnly.join(", ")}`);
  if (result.liveOnly.length) console.error(`[check-functions] CANLIDA VAR, REPO'DA YOK: ${result.liveOnly.join(", ")}`);
  process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  await main();
}

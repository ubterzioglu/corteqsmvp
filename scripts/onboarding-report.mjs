import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const envArg = args.find((arg) => arg.startsWith("--env-file="));
const envFilePath = path.resolve(projectRoot, envArg ? envArg.slice("--env-file=".length) : ".env.local");
const batchIdArg = args.find((arg) => arg.startsWith("--batch-id="));
const batchId = batchIdArg?.slice("--batch-id=".length) ?? null;

function parseEnvFile(content) {
  const result = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
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

async function loadEnv() {
  const content = await readFile(envFilePath, "utf8");
  return parseEnvFile(content);
}

async function createAdminClient() {
  const env = await loadEnv();
  const supabaseUrl = process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function run() {
  const supabase = await createAdminClient();

  let query = supabase
    .from("profile_onboarding_imports")
    .select("id, batch_id, email_normalized, status, invite_sent_at, activated_at, last_error, snapshot, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (batchId) {
    query = query.eq("batch_id", batchId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const statusCounts = rows.reduce((accumulator, row) => {
    accumulator[row.status] = (accumulator[row.status] ?? 0) + 1;
    return accumulator;
  }, {});
  const batchCounts = rows.reduce((accumulator, row) => {
    accumulator[row.batch_id] = (accumulator[row.batch_id] ?? 0) + 1;
    return accumulator;
  }, {});

  console.log("STATUS COUNTS");
  console.log(JSON.stringify(statusCounts, null, 2));
  console.log("");
  console.log("BATCH COUNTS");
  console.log(JSON.stringify(batchCounts, null, 2));
  console.log("");
  console.log("LATEST ROWS");
  console.log(
    JSON.stringify(
      rows.map((row) => ({
        batch_id: row.batch_id,
        email_normalized: row.email_normalized,
        status: row.status,
        fullname:
          row.snapshot && typeof row.snapshot === "object" && typeof row.snapshot.fullname === "string"
            ? row.snapshot.fullname
            : "",
        invite_sent_at: row.invite_sent_at,
        activated_at: row.activated_at,
        last_error: row.last_error,
      })),
      null,
      2,
    ),
  );
}

run().catch((error) => {
  console.error("ERROR:", error instanceof Error ? error.message : error);
  process.exit(1);
});

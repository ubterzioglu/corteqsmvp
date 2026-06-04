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

const sendInvites = args.includes("--send-invites");
const resumeFailed = args.includes("--resume-failed");
const dryRun = args.includes("--dry-run") || !sendInvites;
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const batchSizeArg = args.find((arg) => arg.startsWith("--batch-size="));
const batchIdArg = args.find((arg) => arg.startsWith("--batch-id="));
const limit = Number(limitArg?.slice("--limit=".length) ?? 0) || null;
const batchSize = Number(batchSizeArg?.slice("--batch-size=".length) ?? 25) || 25;
const batchId = batchIdArg?.slice("--batch-id=".length) || createBatchId();

function createBatchId() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    now.getUTCFullYear(),
    pad(now.getUTCMonth() + 1),
    pad(now.getUTCDate()),
    "-",
    pad(now.getUTCHours()),
    pad(now.getUTCMinutes()),
    pad(now.getUTCSeconds()),
  ].join("");
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

function normalizeEmail(value) {
  return (value ?? "").trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function info(message) {
  console.log(`INFO: ${message}`);
}

function printJson(label, value) {
  console.log(`${label}: ${JSON.stringify(value, null, 2)}`);
}

function buildSnapshot(submission) {
  return {
    fullname: submission.fullname ?? "",
    email: submission.email ?? "",
    country: submission.country ?? "",
    city: submission.city ?? "",
    business: submission.business ?? "",
    field: submission.field ?? "",
    referral_code: submission.referral_code ?? "",
    referral_source: submission.referral_source ?? "",
    category: submission.category ?? "",
    form_type: submission.form_type ?? "",
    source_type: submission.source_type ?? "",
  };
}

async function createAdminClient() {
  const env = await loadEnv();
  const supabaseUrl = process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.APP_URL || env.APP_URL || "https://corteqs.net";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
  }

  return {
    appUrl,
    supabase: createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
  };
}

async function listUsersByEmail(supabase, emailNormalized) {
  const perPage = 200;

  for (let page = 1; page <= 25; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users ?? [];
    const matched = users.find((user) => normalizeEmail(user.email) === emailNormalized);
    if (matched) return matched;
    if (users.length < perPage) break;
  }

  return null;
}

async function fetchResumeRows(supabase) {
  const { data, error } = await supabase
    .from("profile_onboarding_imports")
    .select("id, batch_id, source_submission_id, email_normalized, auth_user_id, profile_user_id, source_type, status, retry_count, snapshot")
    .eq("status", "invite_failed")
    .order("created_at", { ascending: true })
    .limit(limit ?? batchSize);

  if (error) throw error;
  return data ?? [];
}

async function fetchCandidateSubmissions(supabase) {
  const size = Math.min(limit ?? batchSize, 250);
  const { data, error } = await supabase
    .from("submissions")
    .select("id, form_type, category, fullname, country, city, business, field, email, referral_code, referral_source, source_type, created_at, user_id")
    .eq("form_type", "register")
    .eq("category", "bireysel")
    .is("user_id", null)
    .order("created_at", { ascending: true })
    .limit(size);

  if (error) throw error;
  return data ?? [];
}

async function fetchExistingImportMap(supabase, submissionIds) {
  if (!submissionIds.length) return new Map();

  const { data, error } = await supabase
    .from("profile_onboarding_imports")
    .select("id, source_submission_id, status, batch_id")
    .in("source_submission_id", submissionIds);

  if (error) throw error;

  return new Map((data ?? []).map((row) => [row.source_submission_id, row]));
}

async function upsertImportRow(supabase, payload) {
  const { error } = await supabase.from("profile_onboarding_imports").upsert(payload, {
    onConflict: "batch_id,source_submission_id",
  });

  if (error) throw error;
}

async function updateResumeRow(supabase, rowId, patch) {
  const { error } = await supabase
    .from("profile_onboarding_imports")
    .update(patch)
    .eq("id", rowId);

  if (error) throw error;
}

async function inviteUser(supabase, email, fullName, appUrl) {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
    },
    redirectTo: `${appUrl}/welcome/activate`,
  });

  if (error) throw error;
  return data?.user ?? null;
}

function groupByNormalizedEmail(submissions) {
  const grouped = new Map();

  for (const submission of submissions) {
    const emailNormalized = normalizeEmail(submission.email);
    if (!grouped.has(emailNormalized)) {
      grouped.set(emailNormalized, []);
    }
    grouped.get(emailNormalized).push(submission);
  }

  return grouped;
}

async function run() {
  const { supabase, appUrl } = await createAdminClient();

  info(`Batch ID: ${batchId}`);
  info(`Mode: ${dryRun ? "dry-run" : "send-invites"}`);
  if (resumeFailed) {
    info("Flow: invite_failed kayıtları tekrar denenecek.");
  }

  const summary = {
    processed: 0,
    invited: 0,
    existingAuthUser: 0,
    invalidEmail: 0,
    manualReview: 0,
    skippedExisting: 0,
    inviteFailed: 0,
  };

  if (resumeFailed) {
    const rows = await fetchResumeRows(supabase);
    const takeRows = limit ? rows.slice(0, limit) : rows.slice(0, batchSize);

    for (const row of takeRows) {
      summary.processed += 1;
      const emailNormalized = normalizeEmail(row.email_normalized);
      const snapshot = row.snapshot && typeof row.snapshot === "object" ? row.snapshot : {};
      const fullName = typeof snapshot.fullname === "string" ? snapshot.fullname : "CorteQS Üyesi";

      if (dryRun) {
        info(`DRY RUN retry: ${emailNormalized}`);
        continue;
      }

      try {
        const existingUser = row.auth_user_id
          ? { id: row.auth_user_id, email: emailNormalized }
          : await listUsersByEmail(supabase, emailNormalized);

        if (existingUser) {
          await updateResumeRow(supabase, row.id, {
            auth_user_id: existingUser.id,
            status: "existing_auth_user",
            last_error: null,
            updated_at: new Date().toISOString(),
          });
          summary.existingAuthUser += 1;
          continue;
        }

        const invitedUser = await inviteUser(supabase, emailNormalized, fullName, appUrl);
        await updateResumeRow(supabase, row.id, {
          auth_user_id: invitedUser?.id ?? null,
          status: "invited",
          invite_sent_at: new Date().toISOString(),
          retry_count: (row.retry_count ?? 0) + 1,
          last_error: null,
          updated_at: new Date().toISOString(),
        });
        summary.invited += 1;
      } catch (error) {
        await updateResumeRow(supabase, row.id, {
          retry_count: (row.retry_count ?? 0) + 1,
          last_error: error instanceof Error ? error.message : "Invite yeniden gönderilemedi.",
          updated_at: new Date().toISOString(),
        });
        summary.inviteFailed += 1;
      }
    }

    printJson("SUMMARY", summary);
    return;
  }

  const submissions = await fetchCandidateSubmissions(supabase);
  const existingImportMap = await fetchExistingImportMap(
    supabase,
    submissions.map((submission) => submission.id),
  );
  const grouped = groupByNormalizedEmail(submissions);

  for (const [emailNormalized, group] of grouped.entries()) {
    const primary = group[0];
    const snapshot = buildSnapshot(primary);
    summary.processed += group.length;

    if (existingImportMap.has(primary.id)) {
      summary.skippedExisting += group.length;
      continue;
    }

    if (!isValidEmail(emailNormalized)) {
      summary.invalidEmail += group.length;
      if (!dryRun) {
        await upsertImportRow(supabase, {
          batch_id: batchId,
          source_submission_id: primary.id,
          email_normalized: emailNormalized,
          source_type: primary.source_type ?? "form",
          status: "invalid_email",
          last_error: "Geçersiz e-posta biçimi",
          snapshot,
        });
      }
      continue;
    }

    if (group.length > 1) {
      summary.manualReview += group.length;
      if (!dryRun) {
        await upsertImportRow(supabase, {
          batch_id: batchId,
          source_submission_id: primary.id,
          email_normalized: emailNormalized,
          source_type: primary.source_type ?? "form",
          status: "manual_review",
          last_error: `Aynı normalize e-posta için ${group.length} submission bulundu: ${group.map((item) => item.id).join(", ")}`,
          snapshot,
        });
      }
      continue;
    }

    const existingUser = await listUsersByEmail(supabase, emailNormalized);
    if (existingUser) {
      summary.existingAuthUser += 1;
      if (!dryRun) {
        await upsertImportRow(supabase, {
          batch_id: batchId,
          source_submission_id: primary.id,
          email_normalized: emailNormalized,
          auth_user_id: existingUser.id,
          profile_user_id: existingUser.id,
          source_type: primary.source_type ?? "form",
          status: "existing_auth_user",
          last_error: null,
          snapshot,
        });
      }
      continue;
    }

    if (dryRun) {
      info(`DRY RUN invite candidate: ${emailNormalized} (${primary.fullname})`);
      summary.invited += 1;
      continue;
    }

    try {
      const invitedUser = await inviteUser(supabase, emailNormalized, primary.fullname, appUrl);
      await upsertImportRow(supabase, {
        batch_id: batchId,
        source_submission_id: primary.id,
        email_normalized: emailNormalized,
        auth_user_id: invitedUser?.id ?? null,
        source_type: primary.source_type ?? "form",
        status: "invited",
        invite_sent_at: new Date().toISOString(),
        retry_count: 0,
        last_error: null,
        snapshot,
      });
      summary.invited += 1;
    } catch (error) {
      await upsertImportRow(supabase, {
        batch_id: batchId,
        source_submission_id: primary.id,
        email_normalized: emailNormalized,
        source_type: primary.source_type ?? "form",
        status: "invite_failed",
        retry_count: 1,
        last_error: error instanceof Error ? error.message : "Invite gönderilemedi.",
        snapshot,
      });
      summary.inviteFailed += 1;
    }
  }

  printJson("SUMMARY", summary);
}

run().catch((error) => {
  console.error("ERROR:", error instanceof Error ? error.message : error);
  process.exit(1);
});

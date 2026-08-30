// Tek bir yeni migration dosyasını migration gövdesi + Supabase ledger kaydı aynı
// transaction içinde olacak şekilde uygular. Geçmiş migration'ları yeniden çalıştırmaz.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { readdir, realpath, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const pendingDir = path.join(projectRoot, "supabase", "migrations");
const appliedDir = path.join(pendingDir, "applied");
const archiveDir = path.join(pendingDir, "archive");

const DB = {
  host: "aws-1-eu-west-2.pooler.supabase.com",
  port: "5432",
  user: "postgres.injprdrsklkxgnaiixzh",
  database: "postgres",
};

export function parseMigrationFileName(fileName) {
  const match = /^(\d{14})_([a-z0-9][a-z0-9_]*)\.sql$/.exec(fileName);
  if (!match) {
    throw new Error(
      "Migration dosya adı `YYYYMMDDHHMMSS_ascii_snake_case.sql` biçiminde olmalı.",
    );
  }
  return { version: match[1], name: match[2] };
}

export function findForbiddenSql(sql) {
  const transactionCommand =
    /^\s*(?:begin(?:\s+(?:work|transaction))?|start\s+transaction|commit(?:\s+work)?|rollback(?:\s+work)?)\s*;\s*(?:--.*)?$/im;
  if (transactionCommand.test(sql)) {
    return "Migration transaction komutu içeremez; transaction sınırını runner yönetir.";
  }
  if (/^\s*\\\S+/m.test(sql)) {
    return "Migration psql meta komutu içeremez.";
  }
  return null;
}

export function validatePendingMigrationPath(filePath, root = projectRoot) {
  const absolute = path.resolve(filePath);
  const expectedParent = path.resolve(root, "supabase", "migrations");
  if (path.dirname(absolute).toLocaleLowerCase("en-US") !== expectedParent.toLocaleLowerCase("en-US")) {
    throw new Error("Yalnız supabase/migrations parent dizinindeki yeni migration uygulanabilir.");
  }
  return { ...parseMigrationFileName(path.basename(absolute)), absolute };
}

const sqlLiteral = (value) => `'${String(value).replaceAll("'", "''")}'`;

export function buildTransactionalSql({ version, name, body }) {
  return [
    "begin;",
    body.trim(),
    "",
    "insert into supabase_migrations.schema_migrations (version, statements, name)",
    `values (${sqlLiteral(version)}, null, ${sqlLiteral(name)});`,
    "commit;",
    "",
  ].join("\n");
}

export function connectionLabel({ host, port, user, database = "postgres" }) {
  return `${user}@${host}:${port}/${database}`;
}

export function isDryRunRequested(args, env = process.env) {
  return args.includes("--dry-run") || env.npm_config_dry_run === "true";
}

function readDbPassword() {
  if (process.env.SUPABASE_DB_PASSWORD) return process.env.SUPABASE_DB_PASSWORD;
  const envPath = path.join(projectRoot, ".env.local");
  let content;
  try {
    content = readFileSync(envPath, "utf8");
  } catch {
    throw new Error("SUPABASE_DB_PASSWORD bulunamadı; .env.local okunamadı.");
  }
  const match = content.match(/^SUPABASE_DB_PASSWORD=(.*)$/m);
  if (!match) throw new Error(".env.local içinde SUPABASE_DB_PASSWORD yok.");
  return match[1].trim().replace(/^(["'])|(["'])$/g, "");
}

async function assertNoLocalVersionCollision(version, sourceFileName) {
  for (const directory of [appliedDir, archiveDir]) {
    let names = [];
    try {
      names = await readdir(directory);
    } catch {
      continue;
    }
    const collision = names.find((name) => name.startsWith(`${version}_`) || name === `${version}.sql`);
    if (collision) {
      throw new Error(`Migration sürümü yerelde zaten var: ${collision}`);
    }
  }

  const destination = path.join(appliedDir, sourceFileName);
  if (existsSync(destination)) throw new Error(`Hedef dosya zaten var: ${destination}`);
  return destination;
}

function runPsql(sql, password) {
  const connection = [
    `host=${DB.host}`,
    `port=${DB.port}`,
    `dbname=${DB.database}`,
    `user=${DB.user}`,
    "sslmode=require",
  ].join(" ");
  const result = spawnSync(
    "psql",
    [connection, "-X", "--set=ON_ERROR_STOP=1", "--file=-"],
    {
      env: { ...process.env, PGPASSWORD: password },
      input: sql,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    },
  );

  if (result.error) throw new Error(`psql başlatılamadı: ${result.error.message}`);
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "psql başarısız oldu").trim();
    throw new Error(`Migration transaction'ı geri alındı.\n${detail}`);
  }
  return (result.stdout ?? "").trim();
}

function usage() {
  console.log(
    "Kullanım: npm run migrate:apply -- supabase/migrations/YYYYMMDDHHMMSS_name.sql [--dry-run]",
  );
}

async function main() {
  const args = process.argv.slice(2);
  // npm kendi `--dry-run` seçeneğini script argümanlarından çıkarıp
  // npm_config_dry_run=true olarak aktarır. Her iki çağrı biçimi de güvenli kalır.
  const dryRun = isDryRunRequested(args);
  const positional = args.filter((arg) => !arg.startsWith("--"));
  const unknownFlags = args.filter((arg) => arg.startsWith("--") && arg !== "--dry-run");
  if (positional.length !== 1 || unknownFlags.length > 0) {
    usage();
    process.exitCode = 2;
    return;
  }

  const parsed = validatePendingMigrationPath(positional[0]);
  const canonicalFile = await realpath(parsed.absolute);
  const canonicalParent = await realpath(pendingDir);
  if (path.dirname(canonicalFile) !== canonicalParent) {
    throw new Error("Migration symlink üzerinden parent dizini dışına çıkamaz.");
  }

  const body = readFileSync(canonicalFile, "utf8");
  if (!body.trim()) throw new Error("Migration dosyası boş.");
  const forbidden = findForbiddenSql(body);
  if (forbidden) throw new Error(forbidden);
  const destination = await assertNoLocalVersionCollision(parsed.version, path.basename(canonicalFile));

  console.log(`[apply-migration] Dosya: ${path.relative(projectRoot, canonicalFile)}`);
  console.log(`[apply-migration] Sürüm: ${parsed.version} (${parsed.name})`);
  console.log(`[apply-migration] Hedef: ${connectionLabel(DB)}`);

  if (dryRun) {
    console.log("[apply-migration] DRY RUN temiz — SQL çalıştırılmadı, dosya taşınmadı.");
    return;
  }

  const password = readDbPassword();
  const output = runPsql(buildTransactionalSql({ ...parsed, body }), password);
  if (output) console.log(output);

  try {
    await rename(canonicalFile, destination);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Veritabanı uygulandı ancak dosya applied/ altına taşınamadı: ${message}. ` +
        "Dosyayı elle taşıyın; migration'ı yeniden çalıştırmayın.",
    );
  }
  console.log(`[apply-migration] Tamamlandı: ${path.relative(projectRoot, destination)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(scriptPath)) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[apply-migration] HATA: ${message}`);
    process.exitCode = 1;
  });
}

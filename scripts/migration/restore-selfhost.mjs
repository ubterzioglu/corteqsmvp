#!/usr/bin/env node
/**
 * export-supabase.mjs çıktısını KENDİ Postgres'imize yükler.
 *
 * 🔴 BU SCRIPT YIKICIDIR. Korumaları zayıflatma.
 *
 * TASARIM KURALLARI:
 *  1. Hedef Supabase Cloud ise KOŞULSUZ REDDEDER.
 *  2. Hedef BOŞ DEĞİLSE reddeder (--allow-nonempty ile bilerek geçilebilir).
 *  3. Parola komut satırına yazılmaz; yalnız alt sürecin ortamına konur.
 *  4. --confirm olmadan yalnız plan gösterir.
 *  5. Her adım ON_ERROR_STOP=1 ile çalışır; ilk hatada durur.
 *     TEK İSTİSNA: roller dosyası (zaten var olan roller "already exists" verir).
 *     Orada hata yutulmaz — sonrasında rollerin GERÇEKTEN var olduğu DOĞRULANIR.
 *  6. Veri yüklemesi sırasında session_replication_role=replica: trigger'lar ve FK
 *     kontrolleri kapanır. Aksi halde 56 auth.users FK'sı ve 115 trigger yüzünden
 *     sıraya bağlı hatalar çıkar ve kolonlar çift şifrelenebilir.
 *
 * ÖN KOŞUL: hedef yığın BİR KEZ boş DB ile ayağa kaldırılmış olmalı ki GoTrue ve
 * storage-api kendi `auth` / `storage` şemalarını KENDİ sürümlerine göre kursun.
 * Bu script o şemaların DDL'ini yüklemez, yalnız VERİSİNİ.
 *
 * Kullanım:
 *   node scripts/migration/restore-selfhost.mjs --from <DIZIN> --target <PG_URL>
 *   ... --confirm
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");

/** Sıra ÖNEMLİ. auth verisi public'ten ÖNCE gelir (56 FK). */
const ORDER = [
  { file: "01-roles.sql", label: "Roller", tolerateErrors: true },
  { file: "02-schema-public.sql", label: "Şema DDL (public + ops)", tolerateErrors: false },
  { file: "03-data-auth.sql", label: "VERİ auth (kullanıcılar)", tolerateErrors: false, dataOnly: true },
  { file: "04-data-public.sql", label: "VERİ public + ops", tolerateErrors: false, dataOnly: true },
  { file: "05-data-storage.sql", label: "VERİ storage metadata", tolerateErrors: false, dataOnly: true },
  { file: "06-migrations.sql", label: "supabase_migrations", tolerateErrors: false },
];

/** Restore sonrası VAR OLMASI ZORUNLU roller. Yoksa RLS sessizce anonim davranır. */
const REQUIRED_ROLES = [
  "anon",
  "authenticated",
  "service_role",
  "authenticator",
  "supabase_auth_admin",
  "supabase_storage_admin",
];

function fail(message, hint) {
  console.error(`\n✗ ${message}`);
  if (hint) console.error(`  → ${hint}`);
  process.exit(1);
}

function maskUrl(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.username || "?"}:***@${u.hostname}:${u.port || "5432"}${u.pathname}`;
  } catch {
    return "(ayrıştırılamayan URL)";
  }
}

function psql(targetEnv, sqlOrFile, { isFile = false, stopOnError = true, extraArgs = [] } = {}) {
  const args = [
    "--no-psqlrc",
    "--quiet",
    `--set=ON_ERROR_STOP=${stopOnError ? 1 : 0}`,
    ...extraArgs,
  ];
  if (isFile) args.push("--file", sqlOrFile);
  else args.push("--tuples-only", "--no-align", "--command", sqlOrFile);

  return spawnSync("psql", args, {
    env: targetEnv,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  });
}

function parsePgUrl(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    fail("--target geçerli bir postgres URL'i değil.", "postgresql://kullanici:parola@host:port/veritabani");
  }
  if (!u.protocol.startsWith("postgres")) fail("--target postgresql:// ile başlamalı.");
  return {
    host: u.hostname,
    port: u.port || "5432",
    user: decodeURIComponent(u.username || "postgres"),
    password: decodeURIComponent(u.password || ""),
    database: (u.pathname || "/postgres").slice(1) || "postgres",
  };
}

const HELP = `
Yedek → kendi Postgres'imiz (YIKICI)

  --from <DIZIN>        export-supabase.mjs çıktısı (ZORUNLU)
  --target <PG_URL>     Hedef postgres URL'i (ZORUNLU)
  --confirm             Gerçekten çalıştır
  --allow-nonempty      Hedef boş değilse bile devam et (BİLEREK)

Hedef Supabase Cloud ise koşulsuz reddedilir.
Ön koşul: hedef yığın bir kez boş DB ile ayağa kaldırılmış olmalı (GoTrue ve
storage-api kendi şemalarını kursun diye).
`;

function main() {
  const argv = process.argv.slice(2);
  const args = { from: null, target: null, confirm: false, allowNonEmpty: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--from") args.from = argv[++i];
    else if (argv[i] === "--target") args.target = argv[++i];
    else if (argv[i] === "--confirm") args.confirm = true;
    else if (argv[i] === "--allow-nonempty") args.allowNonEmpty = true;
    else if (argv[i] === "--help" || argv[i] === "-h") args.help = true;
    else fail(`Bilinmeyen argüman: ${argv[i]}`);
  }
  if (args.help) {
    console.log(HELP);
    return;
  }

  console.log("Restore → kendi altyapımız — ön kontroller\n");

  if (!args.from) fail("--from zorunlu.", HELP.trim());
  if (!args.target) fail("--target zorunlu.", HELP.trim());

  const fromDir = resolve(args.from);
  if (!existsSync(fromDir)) fail(`Yedek dizini yok: ${fromDir}`);

  const manifestPath = join(fromDir, "manifest.json");
  if (!existsSync(manifestPath)) {
    fail("manifest.json yok.", "Bu dizin export-supabase.mjs çıktısı değil gibi görünüyor.");
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  console.log(`  yedek        : ${fromDir}`);
  console.log(`  alınma       : ${manifest.createdAt}`);
  console.log(`  kaynak host  : ${manifest.sourceHost}`);

  for (const step of ORDER) {
    if (!existsSync(join(fromDir, step.file))) fail(`Yedekte eksik dosya: ${step.file}`);
  }

  // ---- HEDEF GÜVENLİĞİ -------------------------------------------------------
  const t = parsePgUrl(args.target);
  console.log(`  hedef        : ${maskUrl(args.target)}`);

  if (t.host.includes("supabase.co") || t.host.includes("supabase.com")) {
    fail(
      "🔴 HEDEF SUPABASE CLOUD. Reddediyorum.",
      "Bu script yalnız KENDİ Postgres'imize yükleme içindir. Canlıya yazmaz.",
    );
  }

  const targetEnv = {
    ...process.env,
    PGHOST: t.host,
    PGPORT: t.port,
    PGUSER: t.user,
    PGPASSWORD: t.password,
    PGDATABASE: t.database,
    PGCONNECT_TIMEOUT: "15",
  };

  if (!spawnSync("psql", ["--version"], { encoding: "utf8" }).stdout) {
    fail("psql bulunamadı.", "PostgreSQL client araçlarını PATH'e ekle.");
  }

  const ping = psql(targetEnv, "select version();");
  if (ping.status !== 0) {
    fail("Hedefe bağlanılamadı.", (ping.stderr || "").trim().split("\n").slice(-5).join("\n"));
  }
  console.log(`  hedef sürüm  : ${(ping.stdout || "").trim().split(",")[0]}`);

  // Ön koşul: auth ve storage şemaları VAR OLMALI (yığın bir kez kalkmış olmalı).
  const schemaCheck = psql(
    targetEnv,
    "select string_agg(nspname, ',' order by nspname) from pg_namespace where nspname in ('auth','storage');",
  );
  const presentSchemas = (schemaCheck.stdout || "").trim();
  if (!presentSchemas.includes("auth") || !presentSchemas.includes("storage")) {
    fail(
      `Hedefte 'auth' ve/veya 'storage' şeması yok (bulunan: ${presentSchemas || "hiçbiri"}).`,
      "Önce yığını BİR KEZ boş DB ile ayağa kaldır (docker compose up) — GoTrue ve " +
        "storage-api kendi şemalarını kendi sürümlerine göre kurar. Sonra bu script'i çalıştır.",
    );
  }

  const tableCount = psql(
    targetEnv,
    "select count(*) from pg_tables where schemaname in ('public','ops');",
  );
  const existingTables = Number.parseInt((tableCount.stdout || "0").trim(), 10) || 0;
  console.log(`  hedefte public+ops tablo sayısı: ${existingTables}`);

  if (existingTables > 0 && !args.allowNonEmpty) {
    fail(
      `Hedef BOŞ DEĞİL (${existingTables} tablo).`,
      "Yıkıcı bir yüklemeyi kazara doğru veritabanına yapmamak için duruyorum. " +
        "Bilerek üzerine yazacaksan --allow-nonempty ekle.",
    );
  }

  console.log(`\n  adımlar      :`);
  for (const s of ORDER) console.log(`                 • ${s.file} — ${s.label}`);
  console.log(`
  Veri adımlarında session_replication_role=replica uygulanır
  (trigger + FK kontrolleri kapanır; 56 auth FK'sı ve 115 trigger yüzünden şart).`);

  if (!args.confirm) {
    console.log(`\n▸ PLAN — hiçbir şey yazılmadı. --confirm ekleyerek başlat.\n`);
    return;
  }

  // ---- Yükle -----------------------------------------------------------------
  console.log(`\n▸ Yükleniyor…\n`);

  for (const step of ORDER) {
    process.stdout.write(`  ${step.file} … `);
    const filePath = join(fromDir, step.file);

    const extraArgs = step.dataOnly
      ? ["--command", "SET session_replication_role = replica;"]
      : [];

    const r = psql(targetEnv, filePath, {
      isFile: true,
      stopOnError: !step.tolerateErrors,
      extraArgs,
    });

    if (r.status !== 0 && !step.tolerateErrors) {
      console.log("HATA");
      console.error((r.stderr || "").trim().split("\n").slice(-25).join("\n"));
      fail(
        `${step.file} başarısız.`,
        "Hedef YARIM KALDI. Devam etme — temiz bir veritabanıyla baştan başla.",
      );
    }
    if (step.tolerateErrors && r.status !== 0) {
      // Hata YUTULMUYOR: görünür kılınıyor, sonra doğrulanıyor.
      const lines = (r.stderr || "").trim().split("\n").filter(Boolean);
      const alreadyExists = lines.filter((l) => /already exists/i.test(l)).length;
      console.log(`tamam (${alreadyExists} "already exists" — beklenen, doğrulanacak)`);
      const other = lines.filter((l) => !/already exists/i.test(l));
      if (other.length > 0) {
        console.error(`    ⚠️ beklenmeyen uyarılar:`);
        for (const l of other.slice(0, 10)) console.error(`       ${l}`);
      }
    } else {
      console.log("tamam");
    }
  }

  // ---- Zorunlu doğrulamalar --------------------------------------------------
  console.log(`\n▸ Doğrulama\n`);

  const roleCheck = psql(
    targetEnv,
    `select string_agg(rolname, ',' order by rolname) from pg_roles where rolname = any(array['${REQUIRED_ROLES.join("','")}']);`,
  );
  const foundRoles = (roleCheck.stdout || "").trim().split(",").filter(Boolean);
  const missingRoles = REQUIRED_ROLES.filter((r) => !foundRoles.includes(r));
  console.log(`  roller       : ${foundRoles.length}/${REQUIRED_ROLES.length} var`);
  if (missingRoles.length > 0) {
    fail(
      `Zorunlu roller EKSİK: ${missingRoles.join(", ")}`,
      "Bu tam olarak 2026-08-05'te geçişi çökerten durumdur: roller olmadan tüm " +
        "GRANT'ler ve RLS politikaları anlamsızlaşır. Devam ETME.",
    );
  }

  const checks = [
    ["public tablo", "select count(*) from pg_tables where schemaname='public';"],
    ["RLS politikası", "select count(*) from pg_policies where schemaname='public';"],
    ["fonksiyon", "select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public';"],
    ["auth.users satırı", "select count(*) from auth.users;"],
    ["storage.objects satırı", "select count(*) from storage.objects;"],
    ["storage.buckets satırı", "select count(*) from storage.buckets;"],
    ["schema_migrations", "select count(*) from supabase_migrations.schema_migrations;"],
  ];
  for (const [label, sql] of checks) {
    const r = psql(targetEnv, sql);
    const value = r.status === 0 ? (r.stdout || "").trim() : `HATA (${(r.stderr || "").trim().split("\n")[0]})`;
    console.log(`  ${label.padEnd(24)}: ${value}`);
  }

  console.log(`
✓ Restore tamam.

  SONRAKİ — bunlar OTOMATİK DEĞİL, atlanırsa canlıda sessizce kırılır:
   1) node scripts/migration/verify-parity.mjs --target <URL>   (kaynakla karşılaştır)
   2) Vault kök şifreleme anahtarını taşı (bildirim dağıtıcı sırrı)
   3) cron.job satırlarını yeniden kur (cadde-cafe-expiring)
   4) Storage dosyalarını yükle (DB yalnız metadata taşıdı)
   5) Olumsuz erişim testleri: kullanıcı A, B'nin verisini GÖREMEMELİ
`);
}

main();

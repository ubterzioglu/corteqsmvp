#!/usr/bin/env node
/**
 * Supabase Cloud'dan KENDİ ALTYAPIMIZA taşınabilir tam yedek alır.
 *
 * ⚠️ NEDEN `supabase db dump` KULLANILMIYOR — bu satırları silme:
 *    CLI'ın dump'ı Supabase→Supabase göçü içindir. Ölçüldü (2026-09-20, --dry-run):
 *    `auth`, `storage`, `supabase_migrations`, `vault`, `cron`, `extensions`
 *    şemalarını DIŞARIDA BIRAKIR ve anon/authenticated/service_role/authenticator
 *    için CREATE ROLE satırlarını YORUMA ÇEVİRİR (hedefte var sayar).
 *    Düz Postgres'e restore edilince sonuç: public şeması + 0 rol + 0 grant +
 *    auth şeması yok → auth.uid() yok → RLS anonim davranır.
 *    2026-08-05'teki başarısız geçiş TAM OLARAK böyle çöktü (102/481 politika,
 *    0 grant, auth.uid() mock). Bu script o yüzden ham pg_dump kullanır.
 *
 * TASARIM KURALLARI:
 *  1. Kaynak üzerinde SALT OKUNUR.
 *  2. Parola ASLA komut satırına yazılmaz — yalnız child process ortamına konur.
 *     Hiçbir çıktıda görünmez.
 *  3. Çıktı dizini repo İÇİNDE olamaz (158 kullanıcının kişisel verisi).
 *  4. Kısmi başarı gizlenmez: her adım ayrı doğrulanır, ilk hatada durur.
 *  5. Var olan çıktı dizininin üzerine YAZMAZ.
 *  6. --confirm olmadan yalnız plan gösterir.
 *  7. `--no-owner` KULLANILMAZ: SECURITY DEFINER fonksiyonlar SAHİBİ olarak
 *     çalışır (274 adet). Sahipliği düzleştirmek yetki semantiğini sessizce bozar.
 *
 * Kullanım:
 *   node scripts/migration/export-supabase.mjs --out <DIZIN>
 *   node scripts/migration/export-supabase.mjs --out <DIZIN> --confirm
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { resolve, relative, isAbsolute, join } from "node:path";
import { createHash } from "node:crypto";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");

/**
 * Dump adımları. Sıra ÖNEMLİ — restore aynı sırayı izler.
 *
 * Şema stratejisi (bilinçli):
 *   `auth` ve `storage` ŞEMA DDL'i DÖKÜMLENMEZ, yalnız VERİSİ alınır.
 *   Gerekçe: hedefte bu şemaları GoTrue ve storage-api KENDİ sürümlerine göre
 *   kurar. Yabancı DDL'i üzerine yazmak sürüm çatışması üretir. Veriyi boş ama
 *   doğru sürümlü şemaya yüklemek hem daha güvenli hem de hata verirse GÜRÜLTÜLÜ
 *   verir (sessiz uyumsuzluk yerine).
 */
const STEPS = [
  {
    name: "01-roles.sql",
    label: "Roller (anon, authenticated, service_role, authenticator, supabase_*)",
    tool: "pg_dumpall",
    args: ["--roles-only", "--no-role-passwords", "--quote-all-identifiers"],
  },
  {
    name: "02-schema-public.sql",
    label: "Şema DDL: public + ops + ingest + afs_backup (237 tablo, 481 RLS, 312 fonksiyon)",
    tool: "pg_dump",
    args: [
      "--schema-only",
      "--quote-all-identifiers",
      // ⚠️ `public` TEK BAŞINA YETMEZ. Canlıda ölçüldü (2026-09-20) — Supabase'e ait
      //    OLMAYAN dört uygulama şeması var. İlk planım yalnız public+ops'tu ve
      //    ikisini kaçırıyordu. Bugün üçü de 0 satır, ama YAPI taşınmazsa
      //    ileride onlara yazan kod sessizce patlar.
      "--schema=public",
      "--schema=ops", // ajan analitiği
      "--schema=ingest", // ajan araç kataloğu
      "--schema=afs_backup", // 2026-06-11 rol yedeği
    ],
  },
  {
    name: "03-data-auth.sql",
    label: "VERİ: auth şeması (kullanıcılar, kimlikler, refresh token'lar)",
    tool: "pg_dump",
    args: ["--data-only", "--quote-all-identifiers", "--schema=auth"],
    // public tabloların 56 FK'sı auth.users'a bakar → auth verisi ÖNCE yüklenir.
  },
  {
    name: "04-data-public.sql",
    label: "VERİ: public + ops + ingest + afs_backup",
    tool: "pg_dump",
    args: [
      "--data-only",
      "--quote-all-identifiers",
      "--schema=public",
      "--schema=ops",
      "--schema=ingest",
      "--schema=afs_backup",
    ],
  },
  {
    name: "05-data-storage.sql",
    label: "VERİ: storage şeması (bucket + nesne METADATA'sı — dosyalar DEĞİL)",
    tool: "pg_dump",
    args: ["--data-only", "--quote-all-identifiers", "--schema=storage"],
  },
  {
    name: "06-migrations.sql",
    label: "supabase_migrations (check:migrations bu tabloya bakar — 397 kayıt)",
    tool: "pg_dump",
    args: ["--quote-all-identifiers", "--schema=supabase_migrations"],
  },
  {
    name: "07-cron-jobs.sql",
    label: "pg_cron işleri (canlıda ÖLÇÜLDÜ: 6 adet — repoda yalnız 1'i belgeli)",
    // cron.job eklentiye ait bir tablodur, pg_dump dökümlemez. Yeniden
    // kurulabilir `cron.schedule(...)` çağrıları üretiyoruz.
    custom: "cron",
  },
];

function fail(message, hint) {
  console.error(`\n✗ ${message}`);
  if (hint) console.error(`  → ${hint}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { out: null, confirm: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--out") args.out = argv[++i];
    else if (a === "--confirm") args.confirm = true;
    else if (a === "--help" || a === "-h") args.help = true;
    else fail(`Bilinmeyen argüman: ${a}`, "--help ile kullanımı gör.");
  }
  return args;
}

/** .env.local okuyucu. dotenv gibi SON tanım kazanır (mükerrer anahtar tuzağı). */
function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = value;
  }
  return out;
}

/**
 * Bağlantı parçalarını çözer. Parola AYRI döner ve asla birleştirilmez.
 *
 * ⚠️ Doğrudan db.<ref>.supabase.co ÇALIŞMAZ ("password authentication failed").
 *    DAİMA session pooler. Ölçüldü 2026-08-04.
 */
function resolveConnection(env) {
  const ref = env.SUPABASE_PROJECT_ID || env.VITE_SUPABASE_PROJECT_ID;
  const password = env.SUPABASE_DB_PASSWORD;
  if (!ref || !password) return null;

  let host = env.SUPABASE_DB_HOST || "aws-1-eu-west-2.pooler.supabase.com";
  let port = env.SUPABASE_DB_PORT || "5432";
  let user = `postgres.${ref}`;

  // .env.local'de SUPABASE_DB_URL varsa host/port'u ondan al — ama doğrudan
  // host'a düşmesine izin verme.
  if (env.SUPABASE_DB_URL) {
    try {
      const u = new URL(env.SUPABASE_DB_URL);
      if (u.hostname.startsWith("db.") && u.hostname.endsWith(".supabase.co")) {
        console.log(
          "  uyarı        : SUPABASE_DB_URL doğrudan host'u gösteriyor " +
            "(db.<ref>.supabase.co). O adres parola doğrulamasında başarısız olur; " +
            "pooler'a çevriliyor.",
        );
      } else {
        host = u.hostname;
        port = u.port || port;
        if (u.username) user = decodeURIComponent(u.username);
      }
    } catch {
      fail("SUPABASE_DB_URL ayrıştırılamadı.");
    }
  }

  return { host, port, user, password, database: env.SUPABASE_DB_NAME || "postgres" };
}

function checkTool(name) {
  const r = spawnSync(name, ["--version"], { encoding: "utf8" });
  if (r.error || r.status !== 0) return null;
  return (r.stdout || "").trim().split("\n")[0];
}

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

const HELP = `
Supabase Cloud → kendi altyapımıza taşınabilir yedek

  --out <DIZIN>   Çıktı dizini (ZORUNLU, repo dışında olmalı).
  --confirm       Gerçekten çalıştır. Yoksa yalnız plan.

Bağlantı .env.local'den: SUPABASE_PROJECT_ID + SUPABASE_DB_PASSWORD (pooler).
Parola komut satırına YAZILMAZ, yalnız alt sürecin ortamına konur.

Yeniden çalıştırma: var olan dizinin üzerine yazmaz. Yeni dizin ver.
Bu script canlıya HİÇBİR ŞEY YAZMAZ.
`;

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return;
  }

  console.log("Supabase export (ham pg_dump) — ön kontroller\n");

  if (!args.out) fail("--out zorunlu.", HELP.trim());
  const outDir = resolve(args.out);
  const rel = relative(REPO_ROOT, outDir);
  if (rel && !rel.startsWith("..") && !isAbsolute(rel)) {
    fail(
      "Çıktı dizini repo içinde olamaz.",
      "Dump'lar 158 kullanıcının kişisel verisini içerir ve kazara commit edilebilir.",
    );
  }
  if (existsSync(outDir)) {
    fail(`Çıktı dizini zaten var: ${outDir}`, "Üzerine yazmıyorum. Yeni bir dizin ver.");
  }

  const pgDump = checkTool("pg_dump");
  const pgDumpAll = checkTool("pg_dumpall");
  if (!pgDump) fail("pg_dump bulunamadı.", "PostgreSQL client araçlarını PATH'e ekle.");
  if (!pgDumpAll) fail("pg_dumpall bulunamadı.");
  console.log(`  pg_dump      : ${pgDump}`);
  console.log(`  pg_dumpall   : ${pgDumpAll}`);

  const env = { ...loadEnvFile(join(REPO_ROOT, ".env.local")), ...process.env };
  const conn = resolveConnection(env);
  if (!conn) {
    fail(
      "Bağlantı çözülemedi.",
      ".env.local içinde SUPABASE_PROJECT_ID ve SUPABASE_DB_PASSWORD olmalı.",
    );
  }
  // Parola BURADA DA yazdırılmıyor.
  console.log(`  kaynak       : ${conn.user.replace(/\..*/, ".***")}@${conn.host}:${conn.port}/${conn.database}`);

  if (!conn.host.includes("supabase.com") && !conn.host.includes("supabase.co")) {
    fail(
      `Kaynak host Supabase değil: ${conn.host}`,
      "Bu script yalnız Supabase Cloud'dan export içindir. Yanlış veritabanını " +
        "dökümlememek için duruyorum.",
    );
  }

  console.log(`\n  çıktı        : ${outDir}`);
  console.log(`  adımlar      :`);
  for (const s of STEPS) console.log(`                 • ${s.name} — ${s.label}`);

  console.log(`
  Bu dump'ın KAPSAMADIKLARI (runbook'ta ayrı adımları var):
    • Storage DOSYALARI        → scripts/migration/export-storage.mjs
    • Vault kök şifreleme anahtarı → Dashboard'dan elle (bildirim sırrı buna bağlı)
    • Dashboard ayarları (SMTP, OAuth client, redirect URL, rate limit, mail şablonları)

  ℹ️ cron işleri ARTIK dahil (07-cron-jobs.sql) — ama restore sırasında
     ÇALIŞTIRILMAZ. Yalnız cutover'da, Supabase tarafı durdurulduktan SONRA.

  ⚠️ Canlı instance 904 MB RAM. Düşük trafikli saatte çalıştır.`);

  if (!args.confirm) {
    console.log(`\n▸ PLAN — hiçbir şey çalıştırılmadı. --confirm ekleyerek başlat.\n`);
    return;
  }

  mkdirSync(outDir, { recursive: true });
  console.log(`\n▸ Başlıyor…\n`);

  // Parola YALNIZ burada, alt sürecin ortamında. argv'ye asla girmez.
  const childEnv = {
    ...process.env,
    PGHOST: conn.host,
    PGPORT: conn.port,
    PGUSER: conn.user,
    PGPASSWORD: conn.password,
    PGDATABASE: conn.database,
    PGSSLMODE: "require",
    PGCONNECT_TIMEOUT: "30",
  };

  const manifest = { createdAt: new Date().toISOString(), sourceHost: conn.host, files: [] };

  for (const step of STEPS) {
    process.stdout.write(`  ${step.name} … `);
    const filePath = join(outDir, step.name);
    const started = Date.now();

    // cron.job eklentiye ait bir tablodur; pg_dump onu dökümlemez. Bunun yerine
    // yeniden kurulabilir `cron.schedule(...)` çağrıları üretiyoruz.
    if (step.custom === "cron") {
      const q = spawnSync(
        "psql",
        [
          "--no-psqlrc",
          "--quiet",
          "--tuples-only",
          "--no-align",
          "--set=ON_ERROR_STOP=1",
          "--command",
          "select format('select cron.schedule(%L, %L, %L);', jobname, schedule, command) from cron.job order by jobname;",
        ],
        { env: childEnv, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 8 * 1024 * 1024 },
      );
      if (q.status !== 0) {
        console.log("HATA");
        console.error((q.stderr || "").trim().split("\n").slice(-10).join("\n"));
        fail("cron.job okunamadı.");
      }
      const body = (q.stdout || "").trim();
      // ⚠️ SATIR SAYMA. Bir cron komutu çok satırlı olabilir (radar işi öyle) ve
      //    satır saymak sayıyı şişirir — ilk sürümde 6 iş "15" göründü.
      //    Üretilen ifadeleri say.
      const jobCount = (body.match(/select cron\.schedule\(/g) || []).length;
      writeFileSync(
        filePath,
        `-- pg_cron işleri — export anında canlıdan üretildi.\n` +
          `-- ⚠️ Bunları hedefte CUTOVER'A KADAR ÇALIŞTIRMA. Eski ve yeni cron aynı\n` +
          `--    anda koşarsa çift mail / çift işlem üretir (runbook §8.1 adım 6).\n` +
          `-- Bulunan iş sayısı: ${jobCount}\n\n${body}\n`,
        "utf8",
      );
      console.log(`tamam (${jobCount} iş)`);
      if (jobCount === 0) {
        console.error(`    ⚠️ 0 iş bulundu — canlıda 6 iş ölçülmüştü. Bunu doğrula.`);
      }
      manifest.files.push({
        name: step.name,
        bytes: statSync(filePath).size,
        sha256: createHash("sha256").update(readFileSync(filePath)).digest("hex"),
        jobCount,
      });
      continue;
    }

    const r = spawnSync(step.tool, [...step.args, `--file=${filePath}`], {
      env: childEnv,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    });

    if (r.error) {
      console.log("HATA");
      fail(`${step.name} çalıştırılamadı: ${r.error.message}`);
    }
    if (r.status !== 0) {
      console.log("HATA");
      console.error((r.stderr || "").trim().split("\n").slice(-15).join("\n"));
      fail(
        `${step.name} başarısız (çıkış kodu ${r.status}).`,
        `Kısmi çıktı SİLİNMEDİ, incelemek için: ${outDir}`,
      );
    }
    if (!existsSync(filePath)) {
      console.log("HATA");
      fail(`${step.name} oluşmadı — komut 0 döndü ama dosya yok (sessiz başarısızlık).`);
    }
    const size = statSync(filePath).size;
    if (size === 0) {
      console.log("HATA");
      fail(`${step.name} BOŞ. Bunu başarı saymıyorum.`);
    }

    console.log(`tamam (${humanSize(size)}, ${((Date.now() - started) / 1000).toFixed(1)}s)`);
    manifest.files.push({
      name: step.name,
      bytes: size,
      sha256: createHash("sha256").update(readFileSync(filePath)).digest("hex"),
    });
  }

  writeFileSync(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`\n✓ Export tamam → ${outDir}`);
  console.log(`  SONRAKİ:`);
  console.log(`    1) node scripts/migration/export-storage.mjs --out ${outDir}`);
  console.log(`    2) node scripts/migration/restore-selfhost.mjs --from ${outDir} --target <URL>\n`);
}

main();

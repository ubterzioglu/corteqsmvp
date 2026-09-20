#!/usr/bin/env node
/**
 * Supabase Free katman sınırlarına ne kadar yaklaşıldığını ölçer — ERKEN UYARI.
 *
 * Amaç: Free'de sınıra çarpıp sürpriz yaşamak yerine, çarpmadan ÖNCE haber almak
 * ve geçiş planını (docs/migration-runbook.md) zamanında tetiklemek.
 *
 * SALT OKUNUR. Katalog sorguları kullanır — 500 MB RAM'lik bir instance'ı yormaz.
 *
 * Kullanım:
 *   npm run selfhost:limits
 *   npm run selfhost:limits -- --json rapor.json
 *
 * Çıkış kodu: 0 = her şey eşiğin altında · 1 = en az bir sınır AŞILDI veya kritik
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");

/**
 * Free katman sınırları — supabase.com/pricing'den doğrulandı (2026-09-20).
 * ⚠️ Supabase bunları değiştirebilir. Sayı tutmuyorsa sayfayı tekrar kontrol et,
 *    script'i "çalışsın diye" gevşetme.
 */
const FREE_LIMITS = {
  dbBytes: 500 * 1024 * 1024, // 500 MB
  storageBytes: 1024 * 1024 * 1024, // 1 GB
  monthlyActiveUsers: 50_000,
};

/** Eşikler: bu oranların üstünde uyarı verilir. */
const WARN_AT = 0.7; // %70 → sarı
const CRITICAL_AT = 0.85; // %85 → kırmızı, geçişi planla

function fail(message, hint) {
  console.error(`\n✗ ${message}`);
  if (hint) console.error(`  → ${hint}`);
  process.exit(1);
}

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = value;
  }
  return out;
}

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function query(env, sql) {
  const r = spawnSync(
    "psql",
    ["--no-psqlrc", "--quiet", "--tuples-only", "--no-align", "--set=ON_ERROR_STOP=1", "--command", sql],
    { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 8 * 1024 * 1024 },
  );
  if (r.status !== 0) return null;
  return (r.stdout || "").trim();
}

function bar(ratio) {
  const width = 24;
  const filled = Math.min(width, Math.round(ratio * width));
  return `[${"█".repeat(filled)}${"·".repeat(width - filled)}]`;
}

function verdict(ratio) {
  if (ratio >= 1) return { label: "🔴 SINIR AŞILDI", critical: true };
  if (ratio >= CRITICAL_AT) return { label: "🔴 KRİTİK", critical: true };
  if (ratio >= WARN_AT) return { label: "🟡 UYARI", critical: false };
  return { label: "🟢 iyi", critical: false };
}

function main() {
  const argv = process.argv.slice(2);
  let jsonOut = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--json") jsonOut = argv[++i];
    else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log(`
Supabase Free katman sınırı erken uyarı

  --json <DOSYA>   Raporu JSON olarak da yaz

Ölçülebilenler : veritabanı boyutu, storage boyutu, aylık aktif kullanıcı
Ölçülemeyenler : egress ve Edge Function çağrısı → yalnız panelden görülür

Çıkış: 0 = iyi · 1 = kritik ya da sınır aşıldı
`);
      return;
    } else fail(`Bilinmeyen argüman: ${argv[i]}`);
  }

  const env = { ...loadEnvFile(join(REPO_ROOT, ".env.local")), ...process.env };
  const ref = env.SUPABASE_PROJECT_ID || env.VITE_SUPABASE_PROJECT_ID;
  const pw = env.SUPABASE_DB_PASSWORD;
  if (!ref || !pw) fail("Bağlantı çözülemedi (SUPABASE_PROJECT_ID + SUPABASE_DB_PASSWORD).");

  const pgEnv = {
    ...process.env,
    PGHOST: env.SUPABASE_DB_HOST || "aws-1-eu-west-2.pooler.supabase.com",
    PGPORT: env.SUPABASE_DB_PORT || "5432",
    PGUSER: `postgres.${ref}`,
    PGPASSWORD: pw,
    PGDATABASE: "postgres",
    PGSSLMODE: "require",
    PGCONNECT_TIMEOUT: "20",
  };

  console.log("Supabase Free katman sınırları — kullanım ölçümü\n");

  const dbBytes = Number.parseInt(query(pgEnv, "select pg_database_size(current_database());") || "", 10);
  const storageBytes = Number.parseInt(
    query(pgEnv, "select coalesce(sum((metadata->>'size')::bigint),0) from storage.objects;") || "",
    10,
  );
  const storageCount = Number.parseInt(query(pgEnv, "select count(*) from storage.objects;") || "", 10);
  const totalUsers = Number.parseInt(query(pgEnv, "select count(*) from auth.users;") || "", 10);
  // MAU yaklaşık: son 30 günde oturum açmış kullanıcı.
  const mau = Number.parseInt(
    query(pgEnv, "select count(*) from auth.users where last_sign_in_at > now() - interval '30 days';") || "",
    10,
  );

  if ([dbBytes, storageBytes, totalUsers].some((v) => Number.isNaN(v))) {
    fail("Ölçüm alınamadı — veritabanına bağlanılamadı.", "psql ve .env.local erişimini kontrol et.");
  }

  const rows = [
    { key: "veritabanı", used: dbBytes, limit: FREE_LIMITS.dbBytes, fmt: humanSize },
    { key: "storage", used: storageBytes, limit: FREE_LIMITS.storageBytes, fmt: humanSize },
    { key: "aylık aktif kullanıcı", used: mau, limit: FREE_LIMITS.monthlyActiveUsers, fmt: String },
  ];

  let anyCritical = false;
  const report = { checkedAt: new Date().toISOString(), metrics: [] };

  for (const row of rows) {
    const ratio = row.used / row.limit;
    const v = verdict(ratio);
    if (v.critical) anyCritical = true;
    console.log(
      `  ${row.key.padEnd(22)} ${bar(ratio)} ${(ratio * 100).toFixed(1).padStart(5)}%  ` +
        `${row.fmt(row.used)} / ${row.fmt(row.limit)}   ${v.label}`,
    );
    report.metrics.push({ key: row.key, used: row.used, limit: row.limit, ratio, critical: v.critical });
  }

  console.log(`\n  (toplam kayıtlı kullanıcı: ${totalUsers} · storage nesnesi: ${storageCount})`);
  console.log(`
  ℹ️ "Aylık aktif kullanıcı" burada son 30 günde OTURUM AÇMIŞ kullanıcıdır
     (auth.users.last_sign_in_at). Supabase'in kendi MAU tanımı daha geniştir:
     kimliği doğrulanmış İSTEK yapan herkesi sayar. Uzun ömürlü oturumu olup
     yeniden giriş yapmayan kullanıcı burada görünmez — yani bu sayı bir
     ALT SINIRDIR, kesin MAU değildir. Panel rakamıyla karşılaştır.`);

  console.log(`
  ⚠️ BURADAN ÖLÇÜLEMEYEN İKİ SINIR VAR — panelden bakılmalı:
     • Egress: Free'de 5 GB/ay (Pro'da 250 GB). En olası darboğaz budur;
       avatar/medya servis eden bir sitede 268 MB'lık dosya havuzu ayda
       defalarca indirilir. Dashboard → Organization → Usage → Egress.
     • Edge Function çağrısı: Free'de 500.000/ay. 6 cron işi + webhook'lar
       buna sayılır.`);

  if (jsonOut) {
    writeFileSync(resolve(jsonOut), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`\n  Rapor: ${resolve(jsonOut)}`);
  }

  console.log(`\n${"─".repeat(72)}`);
  if (anyCritical) {
    console.error(`🔴 En az bir sınır kritik seviyede ya da aşıldı.`);
    console.error(`
   YAPILACAK: geçiş planını tetikle → docs/migration-runbook.md
   Plan hazır ve test edilmiş durumda; Faz 1'den başlanır.`);
    process.exit(1);
  }
  console.log(`🟢 Tüm ölçülebilir sınırlar eşiğin altında.`);
  console.log(`   Eşikler: %${WARN_AT * 100} uyarı · %${CRITICAL_AT * 100} kritik.`);
  console.log(`   Bu script'i ayda bir çalıştır (ya da cron'a bağla) — sınıra çarpmadan haber alırsın.`);
}

main();

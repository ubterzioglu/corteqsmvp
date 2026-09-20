#!/usr/bin/env node
/**
 * Kaynak (Supabase Cloud) ile hedef (kendi Postgres'imiz) arasında DENKLİK doğrular.
 *
 * ⚠️ Satır sayısı EŞİTLİĞİ TEK BAŞINA YETMEZ. 2026-08-05'te kopyalanan veritabanı
 *    satır sayısı bakımından makul görünüyordu ama 0 grant, 0 rol ve mock bir
 *    auth.uid() taşıyordu — yani veri "oradaydı" ama yetkilendirme tamamen ölüydü.
 *    Bu script o yüzden ŞUNLARI da karşılaştırır:
 *      • rol varlığı              • grant sayısı
 *      • RLS politika sayısı      • RLS'in AÇIK olduğu tablo sayısı
 *      • SECURITY DEFINER sayısı  • fonksiyon/trigger/index sayısı
 *      • sequence son değerleri   • öksüz (orphan) kayıtlar
 *      • auth.users ↔ profil bağı • storage nesne sayısı
 *
 * SALT OKUNUR — her iki tarafa da hiçbir şey yazmaz.
 *
 * Kullanım:
 *   node scripts/migration/verify-parity.mjs --target <PG_URL>
 *   node scripts/migration/verify-parity.mjs --target <PG_URL> --json rapor.json
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");

/**
 * Her sorgu TEK bir skaler döndürür.
 * `critical: true` olanlar eşleşmezse çıkış kodu 1 olur.
 */
const PROBES = [
  {
    key: "public_tablo",
    critical: true,
    sql: "select count(*) from pg_tables where schemaname='public'",
  },
  {
    key: "public_view",
    critical: true,
    sql: "select count(*) from pg_views where schemaname='public'",
  },
  {
    key: "rls_politika",
    critical: true,
    sql: "select count(*) from pg_policies where schemaname='public'",
  },
  {
    key: "rls_acik_tablo",
    critical: true,
    // RLS'in ENABLE edilmiş olması politika sayısından AYRI bir gerçektir.
    // Politika var ama RLS kapalıysa tablo herkese açıktır.
    sql: "select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity",
  },
  {
    key: "fonksiyon",
    critical: true,
    sql: "select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'",
  },
  {
    key: "security_definer",
    critical: true,
    sql: "select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef",
  },
  {
    key: "trigger",
    critical: true,
    sql: "select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal",
  },
  {
    key: "index",
    critical: false,
    sql: "select count(*) from pg_indexes where schemaname='public'",
  },
  {
    key: "grant_public",
    critical: true,
    // 2026-08-05'te bu sayı 0'dı ve kimse fark etmedi.
    sql: "select count(*) from information_schema.role_table_grants where table_schema='public'",
  },
  {
    key: "rol_anon_auth_service",
    critical: true,
    sql: "select count(*) from pg_roles where rolname in ('anon','authenticated','service_role','authenticator')",
  },
  {
    key: "extension",
    critical: true,
    sql: "select count(*) from pg_extension",
  },
  {
    key: "auth_users",
    critical: true,
    sql: "select count(*) from auth.users",
  },
  {
    key: "auth_identities",
    critical: true,
    sql: "select count(*) from auth.identities",
  },
  {
    key: "storage_buckets",
    critical: true,
    sql: "select count(*) from storage.buckets",
  },
  {
    key: "storage_objects",
    critical: true,
    sql: "select count(*) from storage.objects",
  },
  {
    key: "schema_migrations",
    critical: true,
    sql: "select count(*) from supabase_migrations.schema_migrations",
  },
  {
    key: "oksuz_user_role_assignments",
    critical: true,
    // Öksüz kayıt: auth.users'a bakan ama karşılığı olmayan satır.
    // Kaynakta 0 olmalı; hedefte de 0 kalmalı. Farklıysa auth verisi eksik yüklenmiş.
    sql: "select count(*) from public.user_role_assignments ura left join auth.users u on u.id=ura.user_id where u.id is null",
  },
  {
    key: "oksuz_user_profile_attributes",
    critical: true,
    sql: "select count(*) from public.user_profile_attributes upa left join auth.users u on u.id=upa.user_id where u.id is null",
  },
];

/** Satır sayısı karşılaştırması: public'teki HER tablo için tek sorguda. */
const PER_TABLE_SQL = `
select string_agg(t.tablename || '=' || (
  select n_live_tup from pg_stat_user_tables s
  where s.schemaname='public' and s.relname=t.tablename
), ',' order by t.tablename)
from pg_tables t where t.schemaname='public'
`;

/** Sequence son değerleri — atlanırsa yeni kayıtlar PK çakışması verir. */
const SEQUENCE_SQL = `
select string_agg(schemaname || '.' || sequencename || '=' || coalesce(last_value::text,'null'), ',' order by sequencename)
from pg_sequences where schemaname='public'
`;

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

function makeEnv(conn) {
  return {
    ...process.env,
    PGHOST: conn.host,
    PGPORT: conn.port,
    PGUSER: conn.user,
    PGPASSWORD: conn.password,
    PGDATABASE: conn.database,
    PGCONNECT_TIMEOUT: "20",
    ...(conn.ssl ? { PGSSLMODE: "require" } : {}),
  };
}

function query(env, sql) {
  const r = spawnSync(
    "psql",
    ["--no-psqlrc", "--quiet", "--tuples-only", "--no-align", "--set=ON_ERROR_STOP=1", "--command", sql],
    { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024 },
  );
  if (r.status !== 0) {
    return { ok: false, error: (r.stderr || "").trim().split("\n")[0] };
  }
  return { ok: true, value: (r.stdout || "").trim() };
}

function parsePgUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port || "5432",
    user: decodeURIComponent(u.username || "postgres"),
    password: decodeURIComponent(u.password || ""),
    database: (u.pathname || "/postgres").slice(1) || "postgres",
    ssl: false,
  };
}

function parseKv(text) {
  const map = new Map();
  if (!text) return map;
  for (const part of text.split(",")) {
    const eq = part.lastIndexOf("=");
    if (eq === -1) continue;
    map.set(part.slice(0, eq), part.slice(eq + 1));
  }
  return map;
}

function main() {
  const argv = process.argv.slice(2);
  const args = { target: null, json: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--target") args.target = argv[++i];
    else if (argv[i] === "--json") args.json = argv[++i];
    else if (argv[i] === "--help" || argv[i] === "-h") args.help = true;
    else fail(`Bilinmeyen argüman: ${argv[i]}`);
  }
  if (args.help) {
    console.log(`
Kaynak ↔ hedef denklik doğrulaması (SALT OKUNUR)

  --target <PG_URL>   Hedef Postgres (ZORUNLU)
  --json <DOSYA>      Raporu JSON olarak da yaz

Kaynak .env.local'den okunur (Supabase pooler).
`);
    return;
  }
  if (!args.target) fail("--target zorunlu.");

  const env = { ...loadEnvFile(join(REPO_ROOT, ".env.local")), ...process.env };
  const ref = env.SUPABASE_PROJECT_ID || env.VITE_SUPABASE_PROJECT_ID;
  const pw = env.SUPABASE_DB_PASSWORD;
  if (!ref || !pw) fail("Kaynak bağlantısı çözülemedi (SUPABASE_PROJECT_ID + SUPABASE_DB_PASSWORD).");

  const sourceEnv = makeEnv({
    host: env.SUPABASE_DB_HOST || "aws-1-eu-west-2.pooler.supabase.com",
    port: env.SUPABASE_DB_PORT || "5432",
    user: `postgres.${ref}`,
    password: pw,
    database: "postgres",
    ssl: true,
  });
  const targetEnv = makeEnv(parsePgUrl(args.target));

  console.log("Denklik doğrulaması (kaynak = Supabase Cloud, hedef = kendi altyapımız)\n");
  console.log(`  ${"ölçüm".padEnd(30)} ${"kaynak".padStart(10)} ${"hedef".padStart(10)}   durum`);
  console.log(`  ${"-".repeat(30)} ${"-".repeat(10)} ${"-".repeat(10)}   -----`);

  const report = { checkedAt: new Date().toISOString(), probes: [], mismatches: [] };
  let criticalMismatch = 0;

  for (const probe of PROBES) {
    const s = query(sourceEnv, probe.sql);
    const t = query(targetEnv, probe.sql);

    const sVal = s.ok ? s.value : `HATA`;
    const tVal = t.ok ? t.value : `HATA`;
    const equal = s.ok && t.ok && sVal === tVal;
    const status = equal ? "✓" : probe.critical ? "✗ KRİTİK" : "~ farklı";
    if (!equal && probe.critical) criticalMismatch += 1;
    if (!equal) report.mismatches.push({ key: probe.key, source: sVal, target: tVal, critical: probe.critical });

    report.probes.push({ key: probe.key, source: sVal, target: tVal, equal, critical: probe.critical });
    console.log(`  ${probe.key.padEnd(30)} ${sVal.padStart(10)} ${tVal.padStart(10)}   ${status}`);
    if (!s.ok) console.log(`      kaynak hatası: ${s.error}`);
    if (!t.ok) console.log(`      hedef hatası : ${t.error}`);
  }

  // ---- Tablo bazlı satır sayısı ---------------------------------------------
  console.log(`\n  Tablo bazlı satır sayıları…`);
  const sRows = parseKv(query(sourceEnv, PER_TABLE_SQL).value);
  const tRows = parseKv(query(targetEnv, PER_TABLE_SQL).value);
  const rowDiffs = [];
  for (const [table, sCount] of sRows) {
    const tCount = tRows.get(table);
    if (tCount === undefined) rowDiffs.push({ table, source: sCount, target: "TABLO YOK" });
    else if (tCount !== sCount) rowDiffs.push({ table, source: sCount, target: tCount });
  }
  for (const table of tRows.keys()) {
    if (!sRows.has(table)) rowDiffs.push({ table, source: "TABLO YOK", target: tRows.get(table) });
  }
  report.rowDiffs = rowDiffs;

  if (rowDiffs.length === 0) {
    console.log(`  ✓ ${sRows.size} tablonun hepsinde satır sayısı eşleşti.`);
  } else {
    console.log(`  ✗ ${rowDiffs.length} tabloda fark var (ilk 25):`);
    for (const d of rowDiffs.slice(0, 25)) {
      console.log(`      ${d.table.padEnd(40)} kaynak=${d.source}  hedef=${d.target}`);
    }
    console.log(`
    ⚠️ pg_stat_user_tables.n_live_tup YAKLAŞIK bir değerdir. Küçük farklar
       ANALYZE yapılmamış olmasından gelebilir. Kesin sayım için hedefte
       'ANALYZE;' çalıştırıp tekrar dene; fark sürüyorsa gerçektir.`);
  }

  // ---- Sequence'ler ----------------------------------------------------------
  console.log(`\n  Sequence son değerleri…`);
  const sSeq = parseKv(query(sourceEnv, SEQUENCE_SQL).value);
  const tSeq = parseKv(query(targetEnv, SEQUENCE_SQL).value);
  const seqDiffs = [];
  for (const [name, sVal] of sSeq) {
    const tVal = tSeq.get(name);
    if (tVal !== sVal) seqDiffs.push({ sequence: name, source: sVal, target: tVal ?? "YOK" });
  }
  report.sequenceDiffs = seqDiffs;
  if (seqDiffs.length === 0) {
    console.log(`  ✓ ${sSeq.size} sequence eşleşti.`);
  } else {
    console.log(`  ✗ ${seqDiffs.length} sequence farklı:`);
    for (const d of seqDiffs.slice(0, 20)) {
      console.log(`      ${d.sequence.padEnd(40)} kaynak=${d.source}  hedef=${d.target}`);
    }
    console.log(`
    ⚠️ Sequence geride kalırsa yeni kayıtlar PRIMARY KEY çakışması verir.
       Bu, geçişten GÜNLER SONRA ortaya çıkan bir hata sınıfıdır.`);
  }

  if (args.json) {
    writeFileSync(resolve(args.json), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`\n  Rapor yazıldı: ${resolve(args.json)}`);
  }

  const totalProblems = criticalMismatch + rowDiffs.length + seqDiffs.length;
  console.log(`\n${"─".repeat(64)}`);
  if (totalProblems === 0) {
    console.log(`✓ Denklik doğrulandı. Kritik uyuşmazlık yok.`);
    console.log(`
  Bu YETERLİ DEĞİL — hâlâ elle doğrulanması gerekenler:
    • Olumsuz erişim testleri (kullanıcı A, B'nin verisini görememeli)
    • Storage DOSYALARI (bu script yalnız metadata sayar)
    • Vault sırlarının ÇÖZÜLEBİLDİĞİ
    • Giriş / kayıt / parola sıfırlama / Google OAuth akışları`);
    return;
  }
  console.error(`✗ ${totalProblems} sorun bulundu (kritik: ${criticalMismatch}, tablo: ${rowDiffs.length}, sequence: ${seqDiffs.length}).`);
  console.error(`  Bunları çözmeden cutover YAPMA.`);
  process.exit(1);
}

main();

// scripts/check-migrations.mjs
// Yerel migration dosyaları ile CANLI `supabase_migrations.schema_migrations` tablosunu
// karşılaştırır. Amaç: "migration commit edildi ama canlıya uygulanmadı" sapmasını elle
// kontrol etmek zorunda kalmadan yakalamak.
//
// İKİ AYRI SAPMA TÜRÜ denetlenir:
//   1) sürüm farkı — dosya var/canlıda kayıt yok (veya tersi)
//   2) YER farkı   — `.sql` parent dizinde kalmış, yani uygulanıp applied/ altına taşınmamış
// (2) ayrı bir kontroldür çünkü parent dizin MIGRATION_DIRS'e dahil DEĞİLDİR; oradaki bir
// dosya sürüm karşılaştırmasına hiç girmez ve tek başına (1) "temiz" der. 2026-08-05'te
// tam bu oldu — bkz. findStrayParentMigrations.
//
// Kullanım:
//   npm run check:migrations         (sapma varsa exit 1)
//   npm run check:migrations:warn    (sapmayı yazar, exit 0)
//
// Gerekli: .env.local içinde SUPABASE_DB_PASSWORD + PATH'te psql.
// Bağlantı session pooler üzerinden yapılır — direct host (db.<ref>.supabase.co) ARTIK
// ÇÖZÜLMÜYOR, bkz. docs/operations/.
//
// NEDEN saf fonksiyon ayrı: `diffMigrations` DB'siz test edilebilsin diye
// (scripts/check-migrations.test.mjs). Ağ gerektiren kısım yalnız `main`.

import { readdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

/** Migration dosyalarının yaşadığı dizinler. `archive/` = taban çizgisi öncesi (2026-08-04). */
const MIGRATION_DIRS = ["supabase/migrations/applied", "supabase/migrations/archive"];

/**
 * Migration'ların YAŞAMADIĞI dizin. Buraya düşen bir `.sql` "yazıldı ama canlıya
 * uygulanmadı" demektir; dosya applied/ altına ancak uygulandıktan SONRA taşınır.
 */
const PARENT_MIGRATION_DIR = "supabase/migrations";

const DB_HOST = "aws-1-eu-west-2.pooler.supabase.com";
const DB_PORT = "5432";
const DB_USER = "postgres.injprdrsklkxgnaiixzh";

/** `20260804160000_ad.sql` → `20260804160000` */
export const versionOf = (fileName) => fileName.replace(/_.*$/, "").replace(/\.sql$/, "");

/**
 * Aynı zaman damgasını paylaşan dosyaların canlıdaki karşılığı.
 *
 * `schema_migrations.version` TEKİLDİR. İki migration dosyası aynı damgayı taşıyorsa
 * (ör. `20260718120000_a.sql` + `20260718120000_b.sql`) ikincisi canlıya `...0001` olarak
 * kaydedilir. Bu bir hata değil, gerçekte olan durum — bu yüzden N kopyalı bir damga için
 * V, V+1, ... V+(N-1) sürümlerini bekleriz. Bunu modellemezsek her koşuda yanlış alarm çıkar.
 */
export const expectedVersionsFor = (version, count) =>
  Array.from({ length: count }, (_, i) => String(BigInt(version) + BigInt(i)));

/**
 * Saf karşılaştırma. Ağ/dosya sistemi yok — girdi iki sürüm listesi.
 * @param {{fileVersions: string[], dbVersions: string[]}} input
 * @returns {{missingInDb: string[], missingLocally: string[], duplicateTimestamps: Array<{version: string, count: number}>, ok: boolean}}
 */
export function diffMigrations({ fileVersions, dbVersions }) {
  const counts = new Map();
  for (const v of fileVersions) counts.set(v, (counts.get(v) ?? 0) + 1);

  const dbSet = new Set(dbVersions);
  const expectedSet = new Set();
  const missingInDb = [];
  const duplicateTimestamps = [];

  for (const [version, count] of [...counts.entries()].sort()) {
    if (count > 1) duplicateTimestamps.push({ version, count });
    for (const expected of expectedVersionsFor(version, count)) {
      expectedSet.add(expected);
      if (!dbSet.has(expected)) missingInDb.push(expected);
    }
  }

  const missingLocally = dbVersions.filter((v) => !expectedSet.has(v)).sort();

  return {
    missingInDb: missingInDb.sort(),
    missingLocally,
    duplicateTimestamps,
    ok: missingInDb.length === 0 && missingLocally.length === 0,
  };
}

/**
 * Parent dizinde kalan `.sql` dosyaları. Saf fonksiyon — girdi bir dizin listesi.
 *
 * NEDEN AYRI BİR SİNYAL: bu dosyalar MIGRATION_DIRS taramasına GİRMEZ, dolayısıyla
 * `diffMigrations` onları hiç görmez ve denetim "sapma yok" der. 2026-08-05'te tam bu
 * yaşandı: `20260805200000_cadde_geo_bridge_backfill.sql` parent dizinde duruyordu,
 * canlıda kaydı yoktu, kontrol yine de temiz raporladı. Sessiz başarısızlık sınıfı.
 *
 * @param {string[]} entryNames Dizin girdileri (dosya + alt dizin adları)
 * @returns {string[]} Ada göre sıralı `.sql` dosya adları
 */
export function findStrayParentMigrations(entryNames) {
  return entryNames.filter((name) => name.endsWith(".sql")).sort();
}

async function collectStrayParentMigrations() {
  try {
    const entries = await readdir(path.join(projectRoot, PARENT_MIGRATION_DIR));
    return findStrayParentMigrations(entries);
  } catch {
    return []; // dizin yoksa sinyal de yok
  }
}

async function collectFileVersions() {
  const versions = [];
  for (const dir of MIGRATION_DIRS) {
    let entries;
    try {
      entries = await readdir(path.join(projectRoot, dir));
    } catch {
      continue; // dizin yoksa sessizce atla
    }
    for (const entry of entries) {
      if (entry.endsWith(".sql")) versions.push(versionOf(entry));
    }
  }
  return versions.sort();
}

function readDbPassword() {
  const envPath = path.join(projectRoot, ".env.local");
  let content;
  try {
    content = readFileSync(envPath, "utf8");
  } catch {
    throw new Error(".env.local okunamadı — SUPABASE_DB_PASSWORD gerekli.");
  }
  const match = content.match(/^SUPABASE_DB_PASSWORD=(.*)$/m);
  if (!match) throw new Error(".env.local içinde SUPABASE_DB_PASSWORD yok.");
  return match[1].trim().replace(/^["']|["']$/g, "");
}

function fetchDbVersions() {
  const password = readDbPassword();
  const conn = `host=${DB_HOST} port=${DB_PORT} dbname=postgres user=${DB_USER} sslmode=require`;
  const out = execFileSync(
    "psql",
    [conn, "-tAc", "select version from supabase_migrations.schema_migrations order by version;"],
    { env: { ...process.env, PGPASSWORD: password }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  return out
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function main() {
  const warnOnly = process.argv.includes("--warn");

  // Dosya sistemi kontrolü DB'den ÖNCE: bağlantı kurulamasa bile bu sinyali verebiliriz.
  // Bekleyen bir migration'ı "bağlanamadım" hatasının arkasında kaybetmek istemiyoruz.
  const strayParents = await collectStrayParentMigrations();
  if (strayParents.length) {
    console.error(
      `\n[check-migrations] PARENT DİZİNDE BEKLEYEN MIGRATION (${strayParents.length}) — ` +
        "canlıya uygulanmamış sayılır:"
    );
    for (const name of strayParents) console.error(`  - ${PARENT_MIGRATION_DIR}/${name}`);
    console.error(
      "  ↳ Migration dosyaları applied/ (veya archive/) altında yaşar. Parent dizindeki bir\n" +
        "    dosya sürüm karşılaştırmasına GİRMEZ. Önce uygula, sonra applied/ altına taşı."
    );
  }

  let dbVersions;
  try {
    dbVersions = fetchDbVersions();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Ağ/parola yoksa CI'ı kilitleme: bu bir SAPMA DEĞİL, kontrolün yapılamamasıdır.
    // Sessizce "temiz" demek en tehlikeli sonuç olurdu — açıkça belirt.
    console.error(`[check-migrations] Canlı DB'ye bağlanılamadı, KONTROL YAPILAMADI: ${message}`);
    process.exit(warnOnly ? 0 : 2);
    return;
  }

  const fileVersions = await collectFileVersions();
  const result = diffMigrations({ fileVersions, dbVersions });

  console.log(
    `[check-migrations] ${fileVersions.length} dosya · ${dbVersions.length} canlı kayıt` +
      (result.duplicateTimestamps.length
        ? ` · ${result.duplicateTimestamps.length} çakışan zaman damgası (bilinen durum)`
        : "")
  );

  for (const { version, count } of result.duplicateTimestamps) {
    console.log(`  ↳ ${version}: ${count} dosya aynı damgayı paylaşıyor → canlıda ${count} ardışık sürüm bekleniyor`);
  }

  if (result.ok && strayParents.length === 0) {
    console.log("[check-migrations] Sapma yok — tüm migration'lar canlıda kayıtlı.");
    return;
  }

  if (result.missingInDb.length) {
    console.error(`\n[check-migrations] CANLIDA KAYDI YOK (${result.missingInDb.length}) — uygulanmamış olabilir:`);
    for (const v of result.missingInDb) console.error(`  - ${v}`);
  }
  if (result.missingLocally.length) {
    console.error(`\n[check-migrations] CANLIDA VAR, DOSYASI YOK (${result.missingLocally.length}):`);
    for (const v of result.missingLocally) console.error(`  - ${v}`);
  }
  if (result.missingInDb.length || result.missingLocally.length) {
    console.error(
      "\nNot: tablo/kolon canlıda var olsa BİLE schema_migrations kaydı eksik olabilir " +
        "(daha önce yaşandı). Uygulamadan önce şemanın gerçek hâline bak."
    );
  }

  process.exit(warnOnly ? 0 : 1);
}

// Test dosyası bu modülü import ettiğinde main çalışmamalı.
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  await main();
}

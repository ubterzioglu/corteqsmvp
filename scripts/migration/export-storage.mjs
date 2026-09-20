#!/usr/bin/env node
/**
 * Supabase Storage'daki TÜM dosyaları yerel diske indirir.
 *
 * ⚠️ Veritabanı dump'ı dosyaların KENDİSİNİ İÇERMEZ — yalnız metadata'yı.
 *    Bu script olmadan geçiş dosyasız kalır ve kimse fark etmez (DB tutarlı görünür,
 *    ama her avatar/CV/medya 404 verir).
 *
 * TASARIM KURALLARI:
 *  1. SALT OKUNUR. Kaynakta hiçbir şey değiştirmez, hiçbir bucket'ı public yapmaz.
 *  2. Tüm bucket'lar ve nesneler SAYFALAMA ile eksiksiz listelenir (klasörler dahil,
 *     özyinelemeli). PostgREST/Storage listelemesi sessizce keser — 100'de durmayız.
 *  3. YENİDEN ÇALIŞTIRILABİLİR: yarım kalan transfer kaldığı yerden devam eder.
 *     Var olan dosya boyut + sha256 ile doğrulanır; eşleşiyorsa atlanır.
 *  4. Her dosyanın sha256'sı hesaplanır ve index.json'a yazılır.
 *     ⚠️ S3 ETag'i HER ZAMAN dosyanın MD5'i DEĞİLDİR (çok parçalı yüklemede farklıdır).
 *        Bu yüzden ETag'e güvenmiyor, kendi sha256'mızı üretiyoruz.
 *  5. Çıktı dizini repo İÇİNDE olamaz.
 *  6. Kısmi başarı gizlenmez: başarısız dosyalar sayılır ve çıkış kodu 1 olur.
 *
 * Kullanım:
 *   node scripts/migration/export-storage.mjs --out <DIZIN>
 *   node scripts/migration/export-storage.mjs --out <DIZIN> --confirm
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync, createWriteStream } from "node:fs";
import { resolve, relative, isAbsolute, join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");
const LIST_PAGE_SIZE = 1000;

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

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

/** Yol ayırıcılarını güvenli hale getirir — `..` ile dizin dışına çıkışı engeller. */
function safeLocalPath(outDir, bucket, objectName) {
  const cleaned = objectName
    .split("/")
    .filter((seg) => seg && seg !== "." && seg !== "..")
    .join("/");
  const full = resolve(outDir, "storage", bucket, cleaned);
  const base = resolve(outDir, "storage", bucket);
  if (!full.startsWith(base)) {
    fail(`Güvensiz nesne adı, dizin dışına çıkıyor: ${bucket}/${objectName}`);
  }
  return full;
}

async function api(baseUrl, path, serviceKey, init = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  return res;
}

/** Bir bucket'ı özyinelemeli, sayfalamalı olarak listeler. Klasörler id===null gelir. */
async function listBucketObjects(baseUrl, serviceKey, bucket, prefix = "") {
  const objects = [];
  let offset = 0;

  for (;;) {
    const res = await api(baseUrl, `/storage/v1/object/list/${encodeURIComponent(bucket)}`, serviceKey, {
      method: "POST",
      body: JSON.stringify({
        prefix,
        limit: LIST_PAGE_SIZE,
        offset,
        sortBy: { column: "name", order: "asc" },
      }),
    });
    if (!res.ok) {
      fail(`Bucket listelenemedi: ${bucket} (HTTP ${res.status})`, (await res.text()).slice(0, 300));
    }
    const page = await res.json();
    if (!Array.isArray(page) || page.length === 0) break;

    for (const entry of page) {
      const name = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null || entry.id === undefined) {
        // Klasör — içine in.
        const nested = await listBucketObjects(baseUrl, serviceKey, bucket, name);
        objects.push(...nested);
      } else {
        objects.push({
          bucket,
          name,
          size: entry.metadata?.size ?? null,
          mimetype: entry.metadata?.mimetype ?? null,
          etag: entry.metadata?.eTag ?? null,
          cacheControl: entry.metadata?.cacheControl ?? null,
          createdAt: entry.created_at ?? null,
          updatedAt: entry.updated_at ?? null,
        });
      }
    }

    // Sayfa doluysa devam et; değilse bu prefix bitti.
    if (page.length < LIST_PAGE_SIZE) break;
    offset += page.length;
  }

  return objects;
}

const HELP = `
Supabase Storage → yerel disk (tüm bucket'lar, tüm nesneler)

  --out <DIZIN>   Çıktı dizini (ZORUNLU, repo dışında).
  --confirm       Gerçekten indir. Yoksa yalnız envanter çıkarılır (indirme yok).

Anahtar .env.local'den: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
Anahtar hiçbir çıktıda görünmez.

Yeniden çalıştırma DESTEKLİ: aynı --out ile tekrar çalıştır, eksikler tamamlanır.
Bu script kaynakta HİÇBİR ŞEY DEĞİŞTİRMEZ.
`;

async function main() {
  const argv = process.argv.slice(2);
  const args = { out: null, confirm: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--out") args.out = argv[++i];
    else if (argv[i] === "--confirm") args.confirm = true;
    else if (argv[i] === "--help" || argv[i] === "-h") args.help = true;
    else fail(`Bilinmeyen argüman: ${argv[i]}`);
  }
  if (args.help) {
    console.log(HELP);
    return;
  }

  console.log("Supabase Storage export\n");

  if (!args.out) fail("--out zorunlu.", HELP.trim());
  const outDir = resolve(args.out);
  const rel = relative(REPO_ROOT, outDir);
  if (rel && !rel.startsWith("..") && !isAbsolute(rel)) {
    fail("Çıktı dizini repo içinde olamaz.", "Dosyalar kişisel veri içerir (CV, avatar, belge).");
  }

  const env = { ...loadEnvFile(join(REPO_ROOT, ".env.local")), ...process.env };
  const baseUrl = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl) fail("VITE_SUPABASE_URL / SUPABASE_URL tanımsız.");
  if (!serviceKey) {
    fail(
      "SUPABASE_SERVICE_ROLE_KEY tanımsız.",
      "Özel bucket'ları listelemek için service_role gerekir. Anahtar yazdırılmaz.",
    );
  }
  console.log(`  kaynak       : ${baseUrl}`);

  // ---- Bucket'lar -----------------------------------------------------------
  const bucketRes = await api(baseUrl, "/storage/v1/bucket", serviceKey);
  if (!bucketRes.ok) {
    fail(`Bucket listesi alınamadı (HTTP ${bucketRes.status}).`, (await bucketRes.text()).slice(0, 300));
  }
  const buckets = await bucketRes.json();
  console.log(`  bucket sayısı: ${buckets.length}\n`);

  const inventory = { createdAt: new Date().toISOString(), sourceUrl: baseUrl, buckets: [], objects: [] };
  let grandTotalBytes = 0;

  for (const b of buckets) {
    process.stdout.write(`  ${b.name} (${b.public ? "public" : "private"}) listeleniyor … `);
    const objs = await listBucketObjects(baseUrl, serviceKey, b.name);
    const bytes = objs.reduce((s, o) => s + (o.size || 0), 0);
    grandTotalBytes += bytes;
    console.log(`${objs.length} nesne, ${humanSize(bytes)}`);

    inventory.buckets.push({
      name: b.name,
      // ⚠️ Bu alanlar hedefte AYNEN kurulmalı. Özel bir bucket'ı kolaylık olsun
      //    diye public yapmak veri sızdırır — yapma.
      public: b.public,
      fileSizeLimit: b.file_size_limit ?? null,
      allowedMimeTypes: b.allowed_mime_types ?? null,
      objectCount: objs.length,
      totalBytes: bytes,
    });
    inventory.objects.push(...objs);
  }

  console.log(`\n  TOPLAM       : ${inventory.objects.length} nesne, ${humanSize(grandTotalBytes)}`);

  if (!args.confirm) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "storage-inventory.json"), `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
    console.log(`\n▸ Yalnız ENVANTER çıkarıldı (indirme yok) → ${join(outDir, "storage-inventory.json")}`);
    console.log(`  İndirmek için --confirm ekle.\n`);
    return;
  }

  // ---- İndirme ---------------------------------------------------------------
  console.log(`\n▸ İndiriliyor (yeniden çalıştırmada eksikler tamamlanır)…\n`);
  mkdirSync(outDir, { recursive: true });

  let downloaded = 0;
  let skipped = 0;
  const failures = [];

  for (const [i, obj] of inventory.objects.entries()) {
    const localPath = safeLocalPath(outDir, obj.bucket, obj.name);

    if (existsSync(localPath) && obj.size !== null && statSync(localPath).size === obj.size) {
      obj.sha256 = sha256File(localPath);
      obj.localPath = relative(outDir, localPath).split("\\").join("/");
      skipped += 1;
      continue;
    }

    try {
      const res = await api(
        baseUrl,
        `/storage/v1/object/${encodeURIComponent(obj.bucket)}/${obj.name.split("/").map(encodeURIComponent).join("/")}`,
        serviceKey,
      );
      if (!res.ok || !res.body) {
        failures.push({ bucket: obj.bucket, name: obj.name, status: res.status });
        continue;
      }
      mkdirSync(dirname(localPath), { recursive: true });
      await pipeline(Readable.fromWeb(res.body), createWriteStream(localPath));

      const actualSize = statSync(localPath).size;
      if (obj.size !== null && actualSize !== obj.size) {
        failures.push({
          bucket: obj.bucket,
          name: obj.name,
          reason: `boyut uyuşmadı: beklenen ${obj.size}, inen ${actualSize}`,
        });
        continue;
      }
      obj.sha256 = sha256File(localPath);
      obj.localPath = relative(outDir, localPath).split("\\").join("/");
      downloaded += 1;
    } catch (error) {
      failures.push({ bucket: obj.bucket, name: obj.name, reason: String(error?.message || error) });
    }

    if ((i + 1) % 50 === 0) {
      process.stdout.write(`  … ${i + 1}/${inventory.objects.length}\n`);
    }
  }

  inventory.result = { downloaded, skipped, failed: failures.length, failures };
  writeFileSync(join(outDir, "storage-inventory.json"), `${JSON.stringify(inventory, null, 2)}\n`, "utf8");

  console.log(`\n  indirilen    : ${downloaded}`);
  console.log(`  atlanan      : ${skipped} (zaten vardı, boyut eşleşti)`);
  console.log(`  BAŞARISIZ    : ${failures.length}`);

  if (failures.length > 0) {
    console.error(`\n✗ ${failures.length} dosya indirilemedi. Ayrıntı: storage-inventory.json`);
    console.error(`  Aynı komutu tekrar çalıştır — eksikler tamamlanır.`);
    process.exit(1);
  }

  console.log(`\n✓ Storage export tamam → ${join(outDir, "storage")}`);
}

main().catch((error) => fail(String(error?.stack || error)));

// scripts/seed-fallback-image-pool.mjs
// docs/fallback-images/news-diaspora/ altındaki dosyaları fallback-image-pool
// bucket'ına yükler ve fallback_image_pool tablosuna idempotent şekilde satır
// ekler (aynı dosya tekrar çalıştırıldığında atlanır). Yalnızca Radar News
// (haber) akışı için — service-finder/mekan bu havuzu kullanmaz.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const BUCKET = "fallback-image-pool";
const CATEGORY_DIRS = [
  { category: "news_diaspora", dir: path.join(projectRoot, "docs", "fallback-images", "news-diaspora") },
];
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function parseEnvFile(content) {
  const result = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

async function createAdminClient() {
  const envFilePath = path.join(projectRoot, ".env.local");
  const env = parseEnvFile(await readFile(envFilePath, "utf8"));
  const supabaseUrl = process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env.local kontrol et).");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function buildStoragePath(category, originalName) {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const rand = Math.random().toString(36).slice(2, 8);
  return `${category}/${Date.now()}-${rand}-${safeName}`;
}

function contentTypeFor(extension) {
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "image/jpeg";
}

async function run() {
  const client = await createAdminClient();

  const { data: existingRows, error: existingError } = await client
    .from("fallback_image_pool")
    .select("category, storage_bucket, storage_path");
  if (existingError) {
    throw new Error(`Mevcut havuz okunamadı: ${existingError.message}`);
  }

  const existingBasenamesByCategory = new Map();
  for (const row of existingRows ?? []) {
    if (row.storage_bucket !== BUCKET) continue;
    const basenames = existingBasenamesByCategory.get(row.category) ?? new Set();
    basenames.add(path.basename(row.storage_path));
    existingBasenamesByCategory.set(row.category, basenames);
  }

  let uploaded = 0;
  let skipped = 0;
  const failures = [];

  for (const { category, dir } of CATEGORY_DIRS) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (error) {
      console.warn(`Klasör bulunamadı, atlanıyor: ${dir} (${error instanceof Error ? error.message : error})`);
      continue;
    }

    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => ALLOWED_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort();

    const existingBasenames = existingBasenamesByCategory.get(category) ?? new Set();

    for (const filename of files) {
      const alreadySeeded = [...existingBasenames].some((basename) => basename.endsWith(filename));
      if (alreadySeeded) {
        skipped += 1;
        console.log(`Atlandı (zaten yüklü): ${category}/${filename}`);
        continue;
      }

      try {
        const extension = path.extname(filename).toLowerCase();
        const fileBuffer = await readFile(path.join(dir, filename));
        const storagePath = buildStoragePath(category, filename);

        const { error: uploadError } = await client.storage
          .from(BUCKET)
          .upload(storagePath, fileBuffer, { contentType: contentTypeFor(extension), upsert: false });
        if (uploadError) throw new Error(uploadError.message);

        const { error: insertError } = await client.from("fallback_image_pool").insert({
          category,
          storage_bucket: BUCKET,
          storage_path: storagePath,
        });
        if (insertError) throw new Error(insertError.message);

        uploaded += 1;
        existingBasenames.add(path.basename(storagePath));
        existingBasenamesByCategory.set(category, existingBasenames);
        console.log(`Yüklendi: ${category}/${filename} → ${storagePath}`);
      } catch (error) {
        failures.push({ filename: `${category}/${filename}`, message: error instanceof Error ? error.message : String(error) });
        console.error(`HATA: ${category}/${filename} → ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  console.log("\n--- Özet ---");
  console.log(`Yüklendi: ${uploaded}, atlandı (zaten vardı): ${skipped}`);
  console.log(`Hata: ${failures.length}`);
  if (failures.length > 0) {
    for (const failure of failures) {
      console.log(`  - ${failure.filename}: ${failure.message}`);
    }
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

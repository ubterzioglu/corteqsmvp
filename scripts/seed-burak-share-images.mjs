// scripts/seed-burak-share-images.mjs
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

import { parseBurakImageFilename } from "./burak-share-image-filename.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const SOURCE_DIR = path.join(projectRoot, "docs", "social-share-outputs");
const BUCKET = "burak-share";

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

function buildImagePath(toolOrder, variant, originalName) {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const rand = Math.random().toString(36).slice(2, 8);
  const variantIndex = variant - 1;
  return `burak/burak-tool-${toolOrder}/variant-${variantIndex}/${Date.now()}-${rand}-${safeName}`;
}

function slotKeyFor(toolOrder, variant) {
  const variantIndex = variant - 1;
  return `burak/burak-tool-${toolOrder}/variant-${variantIndex}`;
}

async function run() {
  const client = await createAdminClient();

  const entries = await readdir(SOURCE_DIR, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();

  const parsed = [];
  const unparsed = [];
  for (const name of files) {
    const info = parseBurakImageFilename(name);
    if (!info) {
      unparsed.push(name);
      continue;
    }
    parsed.push({ ...info, filename: name });
  }

  if (unparsed.length > 0) {
    console.warn(`Çözümlenemeyen ${unparsed.length} dosya atlanıyor: ${unparsed.join(", ")}`);
  }

  const { data: existingAssets, error: assetsError } = await client
    .from("social_share_assets")
    .select("slot_key, image_bucket, image_path")
    .like("slot_key", "burak/%");
  if (assetsError) {
    throw new Error(`Mevcut kapak görselleri okunamadı: ${assetsError.message}`);
  }
  const filledCoverSlots = new Set(
    (existingAssets ?? [])
      .filter((row) => row.image_bucket && row.image_path)
      .map((row) => row.slot_key),
  );

  const { data: existingExtras, error: extrasError } = await client
    .from("social_share_asset_images")
    .select("slot_key, image_path")
    .like("slot_key", "burak/%");
  if (extrasError) {
    throw new Error(`Mevcut ek görseller okunamadı: ${extrasError.message}`);
  }
  const existingExtraBasenamesBySlot = new Map();
  for (const row of existingExtras ?? []) {
    const basenames = existingExtraBasenamesBySlot.get(row.slot_key) ?? new Set();
    basenames.add(path.basename(row.image_path));
    existingExtraBasenamesBySlot.set(row.slot_key, basenames);
  }

  function hasExistingExtra(slotKey, filename) {
    const basenames = existingExtraBasenamesBySlot.get(slotKey);
    if (!basenames) return false;
    for (const basename of basenames) {
      if (basename.endsWith(filename)) return true;
    }
    return false;
  }

  function rememberExtra(slotKey, storagePath) {
    const basenames = existingExtraBasenamesBySlot.get(slotKey) ?? new Set();
    basenames.add(path.basename(storagePath));
    existingExtraBasenamesBySlot.set(slotKey, basenames);
  }

  let coverUploaded = 0;
  let coverSkipped = 0;
  let extraUploaded = 0;
  let extraSkipped = 0;
  const failures = [];

  for (const item of parsed) {
    const slotKey = slotKeyFor(item.toolOrder, item.variant);
    const isCover = item.promptNo === 1;

    try {
      if (isCover) {
        if (filledCoverSlots.has(slotKey)) {
          coverSkipped += 1;
          console.log(`Atlandı (zaten dolu kapak): ${item.filename} → ${slotKey}`);
          continue;
        }

        const fileBuffer = await readFile(path.join(SOURCE_DIR, item.filename));
        const storagePath = buildImagePath(item.toolOrder, item.variant, item.filename);
        const { error: uploadError } = await client.storage
          .from(BUCKET)
          .upload(storagePath, fileBuffer, { contentType: "image/png", upsert: false });
        if (uploadError) throw new Error(uploadError.message);

        const { error: upsertError } = await client
          .from("social_share_assets")
          .upsert(
            {
              slot_key: slotKey,
              image_bucket: BUCKET,
              image_path: storagePath,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "slot_key" },
          );
        if (upsertError) throw new Error(upsertError.message);

        coverUploaded += 1;
        filledCoverSlots.add(slotKey);
        console.log(`Kapak yüklendi: ${item.filename} → ${slotKey}`);
      } else {
        if (hasExistingExtra(slotKey, item.filename)) {
          extraSkipped += 1;
          console.log(`Atlandı (zaten var ek görsel): ${item.filename} → ${slotKey}`);
          continue;
        }

        const fileBuffer = await readFile(path.join(SOURCE_DIR, item.filename));
        const storagePath = buildImagePath(item.toolOrder, item.variant, item.filename);
        const { error: uploadError } = await client.storage
          .from(BUCKET)
          .upload(storagePath, fileBuffer, { contentType: "image/png", upsert: false });
        if (uploadError) throw new Error(uploadError.message);

        const { error: insertError } = await client.from("social_share_asset_images").insert({
          slot_key: slotKey,
          image_bucket: BUCKET,
          image_path: storagePath,
          sort_order: 0,
        });
        if (insertError) throw new Error(insertError.message);

        extraUploaded += 1;
        rememberExtra(slotKey, storagePath);
        console.log(`Ek görsel yüklendi: ${item.filename} → ${slotKey}`);
      }
    } catch (error) {
      failures.push({ filename: item.filename, message: error instanceof Error ? error.message : String(error) });
      console.error(`HATA: ${item.filename} → ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log("\n--- Özet ---");
  console.log(`Toplam dosya: ${files.length}`);
  console.log(`Çözümlenemeyen: ${unparsed.length}`);
  console.log(`Kapak yüklendi: ${coverUploaded}, atlandı (zaten doluydu): ${coverSkipped}`);
  console.log(`Ek görsel yüklendi: ${extraUploaded}, atlandı (zaten vardı): ${extraSkipped}`);
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

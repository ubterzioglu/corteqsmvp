// scripts/reseed-social-share-outputs.mjs
// docs/social-share-outputs klasöründeki dosyalar önceden yanlışlıkla tek şema
// (burak/burak-tool-N) varsayılarak DB'ye işlenmişti. Gerçekte dosya adındaki
// sayı "Tümü" birleşik listesindeki sabit sıra numarasıdır (globalIndex+1),
// interleaveBySource algoritmasıyla tools/diaspora/tests/burak arasında
// harmanlanır. Bu script:
//   1) Eski yanlış burak/% kayıtlarını (storage + tablo) siler.
//   2) Aynı dosyaları doğru tab/id/variant slot_key'lerine yeniden yükler.
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

// --- interleaveBySource: social-share-unified.ts ile birebir aynı mantık ---
function interleaveBySource(sources) {
  const total = sources.reduce((sum, list) => sum + list.length, 0);
  const cursors = sources.map(() => 0);
  const result = [];
  for (let slot = 0; slot < total; slot++) {
    let bestSource = -1;
    let bestDeficit = -Infinity;
    for (let s = 0; s < sources.length; s++) {
      if (cursors[s] >= sources[s].length) continue;
      const targetShare = (sources[s].length / total) * (slot + 1);
      const deficit = targetShare - cursors[s];
      if (deficit > bestDeficit) {
        bestDeficit = deficit;
        bestSource = s;
      }
    }
    result.push(sources[bestSource][cursors[bestSource]]);
    cursors[bestSource] += 1;
  }
  return result;
}

const TOOLS_COUNT = 10;
const DIASPORA_COUNT = 68;
const TESTS_COUNT = 10;
const BURAK_COUNT = 12;

const makeItems = (tab, prefix, count) =>
  Array.from({ length: count }, (_, i) => ({ tab, id: `${prefix}-${i + 1}` }));

const UNIFIED_ORDER = interleaveBySource([
  makeItems("tools", "tool", TOOLS_COUNT),
  makeItems("diaspora", "post", DIASPORA_COUNT),
  makeItems("tests", "test-tool", TESTS_COUNT),
  makeItems("burak", "burak-tool", BURAK_COUNT),
]);

function slotKeyFor(tab, id, variant) {
  const variantIndex = variant - 1;
  return `${tab}/${id}/variant-${variantIndex}`;
}

function buildImagePath(tab, id, variant, originalName) {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const rand = Math.random().toString(36).slice(2, 8);
  const variantIndex = variant - 1;
  return `${tab}/${id}/variant-${variantIndex}/${Date.now()}-${rand}-${safeName}`;
}

async function run() {
  const client = await createAdminClient();

  // 1) Kaynak dosyaları oku + doğru unified karta çöz.
  const entries = await readdir(SOURCE_DIR, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile()).map((e) => e.name).sort();

  const parsed = [];
  const unparsed = [];
  for (const name of files) {
    const info = parseBurakImageFilename(name);
    if (!info) {
      unparsed.push(name);
      continue;
    }
    const unifiedItem = UNIFIED_ORDER[info.toolOrder - 1];
    if (!unifiedItem) {
      unparsed.push(name);
      continue;
    }
    parsed.push({ ...info, filename: name, tab: unifiedItem.tab, id: unifiedItem.id });
  }

  if (unparsed.length > 0) {
    console.warn(`Çözümlenemeyen ${unparsed.length} dosya atlanıyor: ${unparsed.join(", ")}`);
  }

  // 2) Eski yanlış burak/% kayıtlarını (storage + tablo) sil.
  console.log("\n--- Eski yanlış kayıtlar temizleniyor ---");
  const { data: oldCovers, error: oldCoversError } = await client
    .from("social_share_assets")
    .select("slot_key, image_bucket, image_path")
    .like("slot_key", "burak/%");
  if (oldCoversError) throw new Error(`Eski kapak kayıtları okunamadı: ${oldCoversError.message}`);

  const { data: oldExtras, error: oldExtrasError } = await client
    .from("social_share_asset_images")
    .select("id, slot_key, image_bucket, image_path")
    .like("slot_key", "burak/%");
  if (oldExtrasError) throw new Error(`Eski ek görsel kayıtları okunamadı: ${oldExtrasError.message}`);

  const storagePathsToRemove = [
    ...(oldCovers ?? []).filter((r) => r.image_path).map((r) => r.image_path),
    ...(oldExtras ?? []).filter((r) => r.image_path).map((r) => r.image_path),
  ];
  if (storagePathsToRemove.length > 0) {
    const { error: removeError } = await client.storage.from(BUCKET).remove(storagePathsToRemove);
    if (removeError) console.warn(`Storage temizliği kısmen başarısız: ${removeError.message}`);
    else console.log(`Storage'dan silindi: ${storagePathsToRemove.length} dosya`);
  }

  if ((oldCovers ?? []).length > 0) {
    const { error } = await client.from("social_share_assets").delete().like("slot_key", "burak/%");
    if (error) throw new Error(`Eski kapak kayıtları silinemedi: ${error.message}`);
    console.log(`social_share_assets'ten silindi: ${oldCovers.length} kayıt`);
  }
  if ((oldExtras ?? []).length > 0) {
    const { error } = await client.from("social_share_asset_images").delete().like("slot_key", "burak/%");
    if (error) throw new Error(`Eski ek görsel kayıtları silinemedi: ${error.message}`);
    console.log(`social_share_asset_images'ten silindi: ${oldExtras.length} kayıt`);
  }

  // 3) Doğru slot_key'lere yeniden yükle.
  console.log("\n--- Doğru kartlara yeniden yükleniyor ---");
  let coverUploaded = 0;
  let extraUploaded = 0;
  const failures = [];

  for (const item of parsed) {
    const slotKey = slotKeyFor(item.tab, item.id, item.variant);
    const isCover = item.promptNo === 1;

    try {
      const fileBuffer = await readFile(path.join(SOURCE_DIR, item.filename));
      const storagePath = buildImagePath(item.tab, item.id, item.variant, item.filename);
      const { error: uploadError } = await client.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, { contentType: "image/png", upsert: false });
      if (uploadError) throw new Error(uploadError.message);

      if (isCover) {
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
        console.log(`Kapak: ${item.filename} → ${slotKey}`);
      } else {
        const { error: insertError } = await client.from("social_share_asset_images").insert({
          slot_key: slotKey,
          image_bucket: BUCKET,
          image_path: storagePath,
          sort_order: 0,
        });
        if (insertError) throw new Error(insertError.message);
        extraUploaded += 1;
        console.log(`Ek görsel: ${item.filename} → ${slotKey}`);
      }
    } catch (error) {
      failures.push({ filename: item.filename, message: error instanceof Error ? error.message : String(error) });
      console.error(`HATA: ${item.filename} → ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log("\n--- Özet ---");
  console.log(`Toplam dosya: ${files.length}`);
  console.log(`Çözümlenemeyen: ${unparsed.length}`);
  console.log(`Kapak yüklendi: ${coverUploaded}`);
  console.log(`Ek görsel yüklendi: ${extraUploaded}`);
  console.log(`Hata: ${failures.length}`);
  if (failures.length > 0) {
    for (const f of failures) console.log(`  - ${f.filename}: ${f.message}`);
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

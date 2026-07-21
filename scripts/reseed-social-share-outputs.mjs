// scripts/reseed-social-share-outputs.mjs
// docs/social-share-outputs klasöründeki dosyalar iki kez yanlış şemayla DB'ye
// işlenmişti:
//   - İlk seferinde tek şema (burak/burak-tool-N) varsayılmıştı.
//   - İkinci seferinde (interleaveBySource ile) dosya adındaki sayı "Tümü"
//     birleşik listesindeki sabit sıra numarası (globalIndex+1) sanılmıştı —
//     ama dosya adları aslında BURAK_SHARE_TOOLS'taki "order" alanına (1..12,
//     kartın BURAK sekmesi içindeki kendi sırası) göre kodlanmış, genel 100'lük
//     listedeki globalIndex'e göre DEĞİL. Bu da item-1..item-12 gibi yanlış
//     slot_key'lere yükleme yapılmasına yol açtı (gerçek Burak globalId'leri
//     item-3, item-12, item-21, item-30, item-39, item-48, item-53, item-62,
//     item-71, item-80, item-89, item-98 — bkz. burak-share-tools.ts).
// Bu script BURAK_SHARE_TOOLS'un gerçek order→globalId eşlemesini doğrudan
// kaynaktan (derlenmiş dosyadan regex ile) okur, hesaplamaz. Adımlar:
//   1) Eski yanlış item-1..item-12 (ve varsa burak/%) kayıtlarını (storage + tablo) siler.
//   2) Aynı dosyaları doğru globalId/variant slot_key'lerine yeniden yükler.
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

// --- BURAK_SHARE_TOOLS'un order→globalId eşlemesini kaynaktan oku ---
// Dosya adlarındaki toolOrder, burak-share-tools.ts'teki her aracın "order"
// alanına (1..12) karşılık gelir — bu alan globalId ile birebir eşleşir.
async function loadBurakOrderToGlobalId() {
  const filePath = path.join(
    projectRoot,
    "src",
    "lib",
    "admin-shell",
    "burak-share-tools.ts",
  );
  const src = await readFile(filePath, "utf8");
  // Her tool bloğu: id: "burak-tool-N", globalId: "item-M", order: N, ...
  const blockRegex = /id:\s*"burak-tool-\d+",\s*globalId:\s*"(item-\d+)",\s*order:\s*(\d+),/g;
  const map = new Map();
  let match;
  while ((match = blockRegex.exec(src)) !== null) {
    const globalId = match[1];
    const order = Number(match[2]);
    map.set(order, globalId);
  }
  if (map.size !== 12) {
    throw new Error(
      `burak-share-tools.ts'ten beklenen 12 order→globalId eşlemesi okunamadı (bulunan: ${map.size}). Dosya formatı değişmiş olabilir.`,
    );
  }
  return map;
}

// Gerçek DB şeması (bkz. burak-share-assets.ts burakSlotKey): "${globalId}/variant-${variantIndex}".
// tab/id YALNIZCA storage dosya yolunu okunaklı kılmak için kullanılır, slot_key'e girmez.
function slotKeyFor(globalId, variant) {
  const variantIndex = variant - 1;
  return `${globalId}/variant-${variantIndex}`;
}

function buildImagePath(tab, id, variant, originalName) {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const rand = Math.random().toString(36).slice(2, 8);
  const variantIndex = variant - 1;
  return `${tab}/${id}/variant-${variantIndex}/${Date.now()}-${rand}-${safeName}`;
}

async function run() {
  const client = await createAdminClient();
  const orderToGlobalId = await loadBurakOrderToGlobalId();

  // 1) Kaynak dosyaları oku + doğru Burak kartına (order→globalId) çöz.
  // NOT: docs/social-share-outputs dosya adları yalnızca Burak'ın 12 kartını
  // kapsar (toolOrder 1..12, bkz. burak-share-image-filename.mjs) — diğer
  // kaynaklar (tools/diaspora/tests) bu script'in kapsamı dışındadır.
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
    const globalId = orderToGlobalId.get(info.toolOrder);
    if (!globalId) {
      unparsed.push(name);
      continue;
    }
    parsed.push({
      ...info,
      filename: name,
      tab: "burak",
      id: `burak-tool-${info.toolOrder}`,
      globalId,
    });
  }

  if (unparsed.length > 0) {
    console.warn(`Çözümlenemeyen ${unparsed.length} dosya atlanıyor: ${unparsed.join(", ")}`);
  }

  // 2) Eski yanlış kayıtları (storage + tablo) sil.
  // DB'de şu anda social_share_assets/social_share_asset_images'te bulunan
  // TÜM kayıtlar bu klasördeki 32 dosyanın önceki (yanlış) reseed
  // çalıştırmalarından geldiği doğrulandı (item-1/variant-0..item-12/variant-2
  // aralığı, tab/id/variant biçimindeki tarihsel "burak/%" biçimiyle birlikte).
  // Bu iki tablo başka hiçbir kaynaktan (tools/diaspora/tests) veri
  // içermediği için tamamını temizleyip aynı 32 dosyayı doğru globalId'lere
  // yeniden yüklemek en güvenli yoldur — kısmi pattern eşleştirmesi, item-12
  // gibi yanlış/gerçek globalId çakışmalarında yanlışlıkla doğru bir kaydı
  // atlama riski taşır.
  console.log("\n--- Eski yanlış kayıtlar temizleniyor ---");
  const { data: oldCovers, error: oldCoversError } = await client
    .from("social_share_assets")
    .select("slot_key, image_bucket, image_path");
  if (oldCoversError) throw new Error(`Eski kapak kayıtları okunamadı: ${oldCoversError.message}`);

  const { data: oldExtras, error: oldExtrasError } = await client
    .from("social_share_asset_images")
    .select("id, slot_key, image_bucket, image_path");
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
    // slot_key her zaman dolu olduğundan "not null" ile tüm satırları hedefler.
    const { error } = await client.from("social_share_assets").delete().not("slot_key", "is", null);
    if (error) throw new Error(`Eski kapak kayıtları silinemedi: ${error.message}`);
    console.log(`social_share_assets'ten silindi: ${oldCovers.length} kayıt`);
  }
  if ((oldExtras ?? []).length > 0) {
    const { error } = await client
      .from("social_share_asset_images")
      .delete()
      .not("slot_key", "is", null);
    if (error) throw new Error(`Eski ek görsel kayıtları silinemedi: ${error.message}`);
    console.log(`social_share_asset_images'ten silindi: ${oldExtras.length} kayıt`);
  }

  // 3) Doğru slot_key'lere yeniden yükle.
  console.log("\n--- Doğru kartlara yeniden yükleniyor ---");
  let coverUploaded = 0;
  let extraUploaded = 0;
  const failures = [];

  for (const item of parsed) {
    const slotKey = slotKeyFor(item.globalId, item.variant);
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

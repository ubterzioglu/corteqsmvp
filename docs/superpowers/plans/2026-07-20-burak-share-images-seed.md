# BURAK BURAYA BAK Görsel Seed Script Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `docs/social-share-outputs/` altındaki 32 sayısal isimli PNG'yi, dosya adından çözümlenen `(toolOrder, variant, promptNo)` bilgisiyle Supabase Storage `burak-share` bucket'ına yükleyip `social_share_assets` (kapak) / `social_share_asset_images` (ek görsel) tablolarına kaydeden, idempotent, tek seferlik bir Node script'i yazmak.

**Architecture:** Tek dosyalık `scripts/seed-burak-share-images.mjs`, projede zaten kullanılan desene uyar (`@supabase/supabase-js` + `.env.local`'den manuel env parse + service-role client). Dosya adı çözümleme saf bir fonksiyon olarak ayrılır, böylece Vitest ile birim testi yazılabilir. Script iki fazda çalışır: (1) mevcut DB durumunu oku (hangi slotlar zaten dolu), (2) her dosya için upload + upsert/insert, zaten dolu olanları atla.

**Tech Stack:** Node.js (ESM, `.mjs`), `@supabase/supabase-js` (zaten bağımlılık), Vitest (mevcut test altyapısı).

## Global Constraints

- Dosya adı kodu: `<toolOrder><variant><promptNo>` — varyant 1 ise varyant hanesi atlanır. Son hane her zaman `promptNo` (1 veya 2); ondan önceki tek hane varsa (ve kalan kısım tool numarasıysa) `variant` (2 veya 3)'tür.
- Slot key formatı: `burak/burak-tool-<toolOrder>/variant-<variant-1>` (0-tabanlı varyant index, mevcut `burakSlotKey` ile birebir).
- p1 → `social_share_assets` (kapak, `slot_key` UNIQUE upsert). p2 → `social_share_asset_images` (ek görsel, `sort_order: 0`).
- Bucket: `burak-share` (private, zaten var — mig `20260708120000_burak_share_assets.sql`).
- Storage path deseni: `burak/burak-tool-<toolOrder>/variant-<variant-1>/<Date.now()>-<rand6>-<safeOriginalName>` (mevcut `buildImagePath` ile aynı güvenli-isim kuralı: `file.name.replace(/[^a-zA-Z0-9._-]/g, "_")`).
- Env: `SUPABASE_URL` (veya `VITE_SUPABASE_URL`) + `SUPABASE_SERVICE_ROLE_KEY`, `.env.local`'den manuel parse edilir (dotenv paketi yok, projede zaten bu desen kullanılıyor).
- Script idempotent olmalı: zaten dolu bir kapak slotu (`social_share_assets` içinde `image_bucket` veya `image_path` dolu) varsa o dosyayı atlar, konsola uyarı basar; üzerine yazmaz. Ek görseller için aynı `slot_key` + aynı orijinal dosya adına sahip bir satır zaten varsa atlar.
- Migration YOK — tablolar zaten canlıda.

---

### Task 1: Dosya adı çözümleme fonksiyonu (saf fonksiyon + test)

**Files:**
- Create: `scripts/burak-share-image-filename.mjs`
- Test: `scripts/burak-share-image-filename.test.mjs`

**Interfaces:**
- Produces: `parseBurakImageFilename(filename: string): { toolOrder: number, variant: number, promptNo: number } | null` — sonraki task'lar bu fonksiyonu import edip kullanır. `null` döner eğer dosya adı `.png` ile bitmiyorsa veya sayısal gövde çözümlenemiyorsa.

- [ ] **Step 1: Write the failing test**

```javascript
// scripts/burak-share-image-filename.test.mjs
import { describe, expect, it } from "vitest";

import { parseBurakImageFilename } from "./burak-share-image-filename.mjs";

describe("parseBurakImageFilename", () => {
  it("parses 2-digit filenames as variant 1 (variant digit omitted)", () => {
    expect(parseBurakImageFilename("11.png")).toEqual({ toolOrder: 1, variant: 1, promptNo: 1 });
    expect(parseBurakImageFilename("12.png")).toEqual({ toolOrder: 1, variant: 1, promptNo: 2 });
    expect(parseBurakImageFilename("21.png")).toEqual({ toolOrder: 2, variant: 1, promptNo: 1 });
    expect(parseBurakImageFilename("22.png")).toEqual({ toolOrder: 2, variant: 1, promptNo: 2 });
    expect(parseBurakImageFilename("41.png")).toEqual({ toolOrder: 4, variant: 1, promptNo: 1 });
    expect(parseBurakImageFilename("91.png")).toEqual({ toolOrder: 9, variant: 1, promptNo: 1 });
    expect(parseBurakImageFilename("101.png")).toEqual({ toolOrder: 10, variant: 1, promptNo: 1 });
    expect(parseBurakImageFilename("102.png")).toEqual({ toolOrder: 10, variant: 1, promptNo: 2 });
    expect(parseBurakImageFilename("111.png")).toEqual({ toolOrder: 11, variant: 1, promptNo: 1 });
    expect(parseBurakImageFilename("112.png")).toEqual({ toolOrder: 11, variant: 1, promptNo: 2 });
  });

  it("parses 3-digit filenames with explicit variant 2 or 3", () => {
    expect(parseBurakImageFilename("311.png")).toEqual({ toolOrder: 3, variant: 1, promptNo: 1 });
    expect(parseBurakImageFilename("312.png")).toEqual({ toolOrder: 3, variant: 1, promptNo: 2 });
    expect(parseBurakImageFilename("321.png")).toEqual({ toolOrder: 3, variant: 2, promptNo: 1 });
    expect(parseBurakImageFilename("322.png")).toEqual({ toolOrder: 3, variant: 2, promptNo: 2 });
    expect(parseBurakImageFilename("811.png")).toEqual({ toolOrder: 8, variant: 1, promptNo: 1 });
    expect(parseBurakImageFilename("821.png")).toEqual({ toolOrder: 8, variant: 2, promptNo: 1 });
    expect(parseBurakImageFilename("831.png")).toEqual({ toolOrder: 8, variant: 3, promptNo: 1 });
    expect(parseBurakImageFilename("832.png")).toEqual({ toolOrder: 8, variant: 3, promptNo: 2 });
  });

  it("parses 4-digit filenames for 2-digit tool numbers with explicit variant", () => {
    expect(parseBurakImageFilename("1221.png")).toEqual({ toolOrder: 12, variant: 2, promptNo: 1 });
    expect(parseBurakImageFilename("1222.png")).toEqual({ toolOrder: 12, variant: 2, promptNo: 2 });
    expect(parseBurakImageFilename("1231.png")).toEqual({ toolOrder: 12, variant: 3, promptNo: 1 });
    expect(parseBurakImageFilename("1232.png")).toEqual({ toolOrder: 12, variant: 3, promptNo: 2 });
  });

  it("returns null for non-png files", () => {
    expect(parseBurakImageFilename("11.jpg")).toBeNull();
    expect(parseBurakImageFilename("readme.md")).toBeNull();
  });

  it("returns null for non-numeric or malformed basenames", () => {
    expect(parseBurakImageFilename("tool-1_p1.png")).toBeNull();
    expect(parseBurakImageFilename("abc.png")).toBeNull();
    expect(parseBurakImageFilename(".png")).toBeNull();
  });

  it("returns null for invalid promptNo or variant digits", () => {
    expect(parseBurakImageFilename("13.png")).toBeNull();
    expect(parseBurakImageFilename("340.png")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/burak-share-image-filename.test.mjs`
Expected: FAIL — `Cannot find module './burak-share-image-filename.mjs'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// scripts/burak-share-image-filename.mjs

/**
 * Dosya adı kodu: <toolOrder><variant><promptNo>.
 * - Son hane her zaman promptNo (1 veya 2).
 * - Varyant hanesi (2 veya 3) yalnız varyant 1 değilse yazılır; varyant 1 ise atlanır.
 * - Geri kalan basamaklar toolOrder'dır.
 *
 * Çözümleme, en sağdan başlayarak dener: önce "son iki hane variant+promptNo,
 * geri kalanı toolOrder" (variant 2/3), sonra "sadece son hane promptNo, geri
 * kalanı toolOrder, variant=1" olasılığını dener. Sonuç toolOrder 1..12
 * aralığında olmalı; aksi halde null döner.
 */
export function parseBurakImageFilename(filename) {
  const match = /^(\d+)\.png$/.exec(filename);
  if (!match) return null;

  const digits = match[1];
  const lastDigit = Number(digits.at(-1));
  if (lastDigit !== 1 && lastDigit !== 2) return null;

  // Olasılık A: son iki hane "variant + promptNo" (variant 2 veya 3).
  if (digits.length >= 3) {
    const variantDigit = Number(digits.at(-2));
    if (variantDigit === 2 || variantDigit === 3) {
      const toolOrderStr = digits.slice(0, -2);
      const toolOrder = Number(toolOrderStr);
      if (toolOrderStr && toolOrder >= 1 && toolOrder <= 12) {
        return { toolOrder, variant: variantDigit, promptNo: lastDigit };
      }
    }
  }

  // Olasılık B: variant 1, hanesi atlanmış — geri kalan tamamı toolOrder.
  const toolOrderStr = digits.slice(0, -1);
  const toolOrder = Number(toolOrderStr);
  if (toolOrderStr && toolOrder >= 1 && toolOrder <= 12) {
    return { toolOrder, variant: 1, promptNo: lastDigit };
  }

  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/burak-share-image-filename.test.mjs`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/burak-share-image-filename.mjs scripts/burak-share-image-filename.test.mjs
git commit -m "feat: add burak share image filename decoder"
```

---

### Task 2: Seed script — dosya listesi + DB durumu okuma + upload/kaydetme + rapor

**Files:**
- Create: `scripts/seed-burak-share-images.mjs`

**Interfaces:**
- Consumes: `parseBurakImageFilename(filename: string): { toolOrder: number, variant: number, promptNo: number } | null` (Task 1).
- Produces: CLI script, `npm`/`node` ile doğrudan çalıştırılır. Dış modül arayüzü yok (uçtan uca script).

Bu script test edilmez (I/O ağırlıklı, tek seferlik operasyon) — mevcut `import-profiles-csv.mjs`, `import-dortmund-doctors.mjs` gibi diğer seed script'leri de testsizdir. Doğrulama, çalıştırdıktan sonra SQL sorgusu + admin panel QA ile yapılır (Task 3).

- [ ] **Step 1: Script iskeletini ve env/client kurulumunu yaz**

```javascript
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
  const existingExtraPaths = new Set(
    (existingExtras ?? []).map((row) => `${row.slot_key}::${path.basename(row.image_path)}`),
  );

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
        const dedupeKey = `${slotKey}::${item.filename}`;
        if (existingExtraPaths.has(dedupeKey)) {
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
        existingExtraPaths.add(dedupeKey);
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
```

- [ ] **Step 2: Kuru çalıştırma ile dosya çözümlemesini doğrula (DB'ye dokunmadan)**

Bu adımda script henüz DB'ye bağlanmadan önce, sadece 32 dosyanın hepsinin `unparsed` listesine düşmediğini terminal çıktısından gözle kontrol et:

Run: `node -e "import('./scripts/burak-share-image-filename.mjs').then(async (m) => { const { readdir } = await import('node:fs/promises'); const files = await readdir('docs/social-share-outputs'); const unparsed = files.filter(f => !m.parseBurakImageFilename(f)); console.log('unparsed:', unparsed); console.log('parsed count:', files.length - unparsed.length); })"`
Expected: `unparsed: []` ve `parsed count: 32`

- [ ] **Step 3: Gerçek script'i çalıştır**

Run: `node scripts/seed-burak-share-images.mjs`
Expected: Konsolda 32 dosya için "Kapak yüklendi" veya "Ek görsel yüklendi" satırları, özet bölümünde `Hata: 0`. (Eğer script daha önce kısmen çalıştırılmışsa bazı satırlar "Atlandı" olabilir — bu da beklenen idempotent davranış.)

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-burak-share-images.mjs
git commit -m "feat: seed burak share images from docs/social-share-outputs"
```

---

### Task 3: Doğrulama — DB satır sayıları ve admin panel QA

**Files:** Yok (kod değişikliği değil, doğrulama adımı).

**Interfaces:** Yok.

- [ ] **Step 1: Supabase SQL Editor'de (veya Management API ile) satır sayılarını doğrula**

```sql
select
  (select count(*) from public.social_share_assets where slot_key like 'burak/%' and image_bucket is not null) as kapak_sayisi,
  (select count(*) from public.social_share_asset_images where slot_key like 'burak/%') as ek_gorsel_sayisi;
```

Expected: `kapak_sayisi + ek_gorsel_sayisi` toplamı, script çıktısındaki "yüklendi" sayılarının toplamı ile eşleşmeli (32 eksi varsa `unparsed`/`Hata` sayısı).

- [ ] **Step 2: Dev sunucuyu başlat**

Run: `npm run dev`
Expected: Vite dev server `http://localhost:8080` üzerinde ayağa kalkar.

- [ ] **Step 3: Admin panelde görsel QA**

`http://localhost:8080/admin/social-share-vault` adresine git, "Burak" filtresine tıkla, birkaç kartı aç (örn. tool 1, tool 3, tool 12) ve "Görsel" butonunun yeşil/dolu göründüğünü, doğru varyant altında doğru görselin (kapak + varsa ek görsel) yüklendiğini gözle doğrula.

- [ ] **Step 4: Bulguları kaydet**

Eğer tüm görseller doğru yerdeyse, iş tamamlanmış sayılır — ek commit gerekmez (bu task kod üretmiyor). Eğer bir uyumsuzluk bulunursa (yanlış slotta görsel), Task 1'deki `parseBurakImageFilename` fonksiyonuna test case eklenip düzeltme yapılmalı.

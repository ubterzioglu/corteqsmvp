// scripts/download-pexels-fallback-images.mjs
// Pexels API üzerinden diaspora ve mekan (cafe/dükkan/işyeri) temalı serbest lisanslı
// görselleri indirip docs/fallback-images/<category>/ altına kaydeder. Bu script sadece
// dosyaları indirir — DB'ye yükleme adımı scripts/seed-fallback-image-pool.mjs'de.
//
// Kullanım: PEXELS_API_KEY .env.local'da tanımlı olmalı.
//   node scripts/download-pexels-fallback-images.mjs
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search";
const PER_CATEGORY_TARGET = 50;
const PER_PAGE = 25;

const CATEGORIES = [
  {
    category: "news_diaspora",
    dir: path.join(projectRoot, "docs", "fallback-images", "news-diaspora"),
    queries: [
      "diaspora community",
      "immigrant family",
      "multicultural community gathering",
      "people flags world",
      "international friends group",
    ],
  },
  {
    category: "mekan",
    dir: path.join(projectRoot, "docs", "fallback-images", "mekan"),
    queries: [
      "cafe interior",
      "restaurant interior",
      "small shop storefront",
      "office workspace",
      "local business store",
    ],
  },
];

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

async function loadPexelsApiKey() {
  const envFilePath = path.join(projectRoot, ".env.local");
  let env = {};
  try {
    env = parseEnvFile(await readFile(envFilePath, "utf8"));
  } catch {
    // .env.local yoksa yalnızca process.env kullanılır.
  }
  const apiKey = process.env.PEXELS_API_KEY || env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error("PEXELS_API_KEY gerekli (.env.local içine ekleyin veya ortam değişkeni olarak verin).");
  }
  return apiKey;
}

async function searchPexels(apiKey, query, page) {
  const url = new URL(PEXELS_SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(PER_PAGE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("orientation", "landscape");

  const response = await fetch(url, { headers: { Authorization: apiKey } });
  if (!response.ok) {
    throw new Error(`Pexels arama hatası (${response.status}): ${query}`);
  }
  return response.json();
}

async function downloadImage(url, destPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Görsel indirilemedi (${response.status}): ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await writeFile(destPath, Buffer.from(arrayBuffer));
}

async function run() {
  const apiKey = await loadPexelsApiKey();

  for (const { category, dir, queries } of CATEGORIES) {
    await mkdir(dir, { recursive: true });

    const seenPhotoIds = new Set();
    const collected = [];

    for (const query of queries) {
      if (collected.length >= PER_CATEGORY_TARGET) break;

      let page = 1;
      while (collected.length < PER_CATEGORY_TARGET && page <= 3) {
        const result = await searchPexels(apiKey, query, page);
        const photos = result.photos ?? [];
        if (photos.length === 0) break;

        for (const photo of photos) {
          if (collected.length >= PER_CATEGORY_TARGET) break;
          if (seenPhotoIds.has(photo.id)) continue;
          seenPhotoIds.add(photo.id);
          collected.push(photo);
        }
        page += 1;
      }
    }

    console.log(`${category}: ${collected.length} görsel bulundu, indiriliyor...`);

    let downloaded = 0;
    for (const photo of collected) {
      const src = photo.src?.large ?? photo.src?.original;
      if (!src) continue;
      const filename = `pexels-${photo.id}.jpg`;
      const destPath = path.join(dir, filename);
      try {
        await downloadImage(src, destPath);
        downloaded += 1;
      } catch (error) {
        console.error(`HATA (${category}/${filename}): ${error instanceof Error ? error.message : error}`);
      }
    }

    console.log(`${category}: ${downloaded}/${collected.length} görsel indirildi → ${dir}`);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

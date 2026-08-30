import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const MAX_JS_BYTES = 500 * 1024;
const assetsDirectory = path.resolve(process.cwd(), "dist", "assets");

const entries = await readdir(assetsDirectory);
const oversized = [];

for (const entry of entries) {
  if (!entry.endsWith(".js")) continue;
  const size = (await stat(path.join(assetsDirectory, entry))).size;
  if (size > MAX_JS_BYTES) oversized.push({ entry, size });
}

if (oversized.length > 0) {
  for (const { entry, size } of oversized) {
    console.error(`[check-bundle-size] ${entry}: ${(size / 1024).toFixed(1)} KB`);
  }
  process.exitCode = 1;
} else {
  console.log(`[check-bundle-size] Tüm JS chunk'ları 500 KB sınırının altında. ✓`);
}

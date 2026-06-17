/**
 * Build-time yardımcı (tek seferlik / nadiren çalıştırılır).
 * world-atlas TopoJSON'unu (land-110m) sade bir GeoJSON'a çevirip statik bir TS
 * dosyasına gömer. Böylece runtime'da ekstra paket / fetch olmaz; d3-geo doğrudan
 * gömülü veriyi çizer (deneme landing /landingtrial atlas haritası için).
 *
 * Çalıştırma:  node scripts/generate-world-geojson.mjs
 * Gerektirir:  world-atlas + topojson-client (npm i --no-save world-atlas topojson-client)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { feature } from "topojson-client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const topo = JSON.parse(
  readFileSync(resolve(root, "node_modules/world-atlas/land-110m.json"), "utf8"),
);

const geo = feature(topo, topo.objects.land); // FeatureCollection

// Koordinatları 2 ondalığa yuvarla (dosya boyutu küçülür, dekoratif harita için yeterli).
const round = (coords) =>
  coords.map((ring) =>
    Array.isArray(ring[0])
      ? round(ring)
      : [Math.round(ring[0] * 100) / 100, Math.round(ring[1] * 100) / 100],
  );

const slimCollection = {
  type: "FeatureCollection",
  features: geo.features.map((f) => ({
    type: "Feature",
    properties: {},
    geometry: {
      type: f.geometry.type,
      coordinates: round(f.geometry.coordinates),
    },
  })),
};

const out = `/**
 * OTOMATİK ÜRETİLDİ — scripts/generate-world-geojson.mjs ile.
 * Kaynak: world-atlas land-110m (Natural Earth). Elle düzenleme.
 * Gerçekçi dünya kara hattı (FeatureCollection), d3-geo geoPath ile çizilir.
 * Runtime fetch / ek paket gerektirmez.
 */

export const WORLD_LAND_GEOJSON = ${JSON.stringify(slimCollection)} as const;
`;

const target = resolve(root, "src/components/home-trial/world-geojson.ts");
writeFileSync(target, out, "utf8");

const kb = Math.round(Buffer.byteLength(out, "utf8") / 1024);
console.log(`Yazıldı: ${target} (${kb} kB)`);

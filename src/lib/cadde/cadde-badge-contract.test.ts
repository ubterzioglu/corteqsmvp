// T6 (m142) — rozet sistemi sözleşmesi: üç tip, başka yok.
//
// SORUN (denetim 27.08.2026): Cadde yüzeylerinde ONÜÇ farklı rozet stili dolaşıyordu
// ve hiçbirinin görsel ağırlığı anlamsal önemiyle örtüşmüyordu. "Sabit" siyah dolgu
// ile en ağır stildeydi ama en az bilgi taşıyordu; "Sponsorlu" turuncu dolguyla
// akıştaki en dikkat çekici rozetti — reklam içeriğinin en yüksek görsel ağırlığa
// sahip olması yanlış sinyaldi.
//
// Bu sınıf SESSİZCE geri gelir: biri `<Badge className="bg-...">` yazar, build
// patlamaz, lint susar, hiçbir test kırılmaz — yalnız rozet envanteri yeniden
// dağılır. Bu yüzden metin düzeyinde kilitleniyor.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SURFACE_DIRS = ["src/pages/cadde", "src/components/cadde"];

function collectFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return collectFiles(full);
    if (!/\.tsx?$/.test(entry) || /\.test\.tsx?$/.test(entry)) return [];
    return [full];
  });
}

const SURFACE_SOURCE = SURFACE_DIRS.flatMap(collectFiles)
  // CaddeBadge'in KENDİSİ renk tanımlar — sistemin tek meşru yeri.
  .filter((file) => !file.endsWith("CaddeBadge.tsx"))
  .map((file) => ({ file, source: readFileSync(file, "utf8") }));

const BADGE_COMPONENT = readFileSync("src/components/cadde/CaddeBadge.tsx", "utf8");

describe("Cadde rozet sözleşmesi", () => {
  it("taranacak dosya bulur", () => {
    expect(SURFACE_SOURCE.length).toBeGreaterThan(10);
  });

  it("hiçbir yüzey dosyası rozete kendi rengini vermez", () => {
    // Ad-hoc renk = envanterin yeniden dağılması. Renk YALNIZ CaddeBadge'den gelir.
    const offenders = SURFACE_SOURCE.flatMap(({ file, source }) =>
      [...source.matchAll(/<Badge[^>]*className="[^"]*(?:bg-|border-(?!transparent))[^"]*"/g)].map(
        (match) => `${file}: ${match[0].slice(0, 90)}`,
      ),
    );

    expect(offenders).toEqual([]);
  });

  it("üç tip tanımlıdır ve dördüncüsü yoktur", () => {
    expect(BADGE_COMPONENT).toContain('"durum" | "kimlik" | "kategori"');
  });

  it("durum yalnız İKİ tona sınırlıdır", () => {
    // Üçüncü bir durum rengi eklemek tam da kapatılan sorunu geri getirir:
    // renk sayısı arttıkça hiçbiri anlam taşımaz.
    expect(BADGE_COMPONENT).toContain('"positive" | "neutral"');
  });

  it("her tip için tek bir stil tanımı vardır", () => {
    for (const tone of ["durum:", "kimlik:", "kategori:"]) {
      const occurrences = BADGE_COMPONENT.split(tone).length - 1;
      // Biri TONE_CLASS'ta, biri de tip birleşiminde/anlatımda geçebilir; ikiden
      // fazlası aynı tipin birden çok stil tanımı demektir.
      expect(occurrences).toBeLessThanOrEqual(2);
    }
  });
});

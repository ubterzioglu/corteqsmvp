// T7 (m143-m145) — Cadde yüzey sistemi sözleşmesi: tek yarıçap, iki gölge, kontrast tabanı.
//
// NEDEN METİN TESTİ: bu üç kural sessizce bozulur. Biri `rounded-2xl` yazar, biri
// `text-slate-400` kullanır; build patlamaz, lint susar, hiçbir test kırılmaz —
// yalnız yüzey dili yeniden dağılır. Denetimin kök şikâyeti zaten buydu:
// "her kart aynı seviyede yüzüyor, derinlik hiyerarşisi yok".
//
// Ölçüm (09.09.2026, uygulamadan önce): Cadde yüzeylerinde DOKUZ farklı yarıçap
// değeri vardı (rounded-2xl 48, xl 17, [24px] 4, md 3, lg 3, [20px] 2, [28px] 1,
// [22px] 1, full 31). Uygulamadan sonra: yalnız `rounded-lg` ve `rounded-full`.

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

const SURFACE_FILES = SURFACE_DIRS.flatMap(collectFiles);
const SURFACE_SOURCE = SURFACE_FILES.map((file) => ({ file, source: readFileSync(file, "utf8") }));
const CSS = readFileSync("src/index.css", "utf8");

describe("Cadde yüzey sözleşmesi", () => {
  it("taranacak dosya bulur (aksi halde test sessizce boşa geçerdi)", () => {
    expect(SURFACE_FILES.length).toBeGreaterThan(10);
  });

  // 1) TEK YARIÇAP
  it("yalnız iki yarıçap sınıfı kullanır: rounded-lg ve rounded-full", () => {
    const offenders = SURFACE_SOURCE.flatMap(({ file, source }) =>
      [...source.matchAll(/rounded-(?!lg\b|full\b)([a-z0-9[\]]+)/g)].map(
        (match) => `${file}: rounded-${match[1]}`,
      ),
    );

    // rounded-full YALNIZ pill buton ve avatar içindir (dokümandaki tek istisna);
    // geri kalan her yüzey var(--radius)'a bağlı rounded-lg kullanır.
    expect(offenders).toEqual([]);
  });

  it("kanonik sınıf rounded-lg'dir çünkü token'a bağlıdır", () => {
    // tailwind.config.ts: borderRadius.lg = var(--radius). `rounded-xl` bugün aynı
    // 12px'i veriyor ama Tailwind'in SABIT varsayılanı — --radius değişirse ayrışır.
    // Bu yüzden xl değil lg kanonik.
    expect(readFileSync("tailwind.config.ts", "utf8")).toMatch(/lg:\s*"var\(--radius\)"/);
  });

  it("CSS tarafında sabit yarıçap yazılmaz, token kullanılır", () => {
    const caddeBlock = CSS.slice(CSS.indexOf(".cadde-shell"));
    // `border-radius: 1rem` gibi sabitler yüzey dilini sessizce böler.
    // (9999px pill/avatar için meşrudur.)
    // Değerleri önce topla, sonra JS'te süz: regex'te negatif ileri-bakış `\s*`
    // geri izlemesi yüzünden meşru değerleri de yakalıyordu (ölçüldü).
    const hardcoded = [...caddeBlock.matchAll(/border-radius:\s*([^;]+);/g)]
      .map((match) => match[1].trim())
      .filter((value) => !value.startsWith("var(") && value !== "9999px");

    expect(hardcoded).toEqual([]);
  });

  // 2) KONTRAST TABANI
  it("AA'yı geçmeyen açık grileri kullanmaz", () => {
    // Ölçüldü: slate-400 beyaz üzerinde 2.56:1, slate-300 1.48:1 — ikisi de AA (4.5)
    // altında. slate-500 4.76:1 ile geçer ve kod tabanının paleti slate.
    const offenders = SURFACE_SOURCE.flatMap(({ file, source }) =>
      [...source.matchAll(/text-(?:slate|gray|zinc|neutral)-(?:300|400)/g)].map(
        (match) => `${file}: ${match[0]}`,
      ),
    );

    expect(offenders).toEqual([]);
  });

  // 3) İKİ GÖLGE SEVİYESİ
  it("kart yüzeyi tek gölge tanımı ve tek yükseltilmiş hâl taşır", () => {
    // Derinlik hiyerarşisi ancak seviye AZ olduğunda okunur. Üçüncü bir ara gölge
    // eklemek "her kart aynı seviyede yüzüyor" şikâyetini geri getirir.
    const cardRule = CSS.match(/\.cadde-panel,\s*\n\s*\.cadde-card\s*\{[^}]+\}/);
    const hoverRule = CSS.match(/\.cadde-panel:hover,\s*\n\s*\.cadde-card:hover\s*\{[^}]+\}/);

    expect(cardRule).not.toBeNull();
    expect(hoverRule).not.toBeNull();
    expect(cardRule?.[0]).toContain("box-shadow");
    expect(hoverRule?.[0]).toContain("box-shadow");
  });
});

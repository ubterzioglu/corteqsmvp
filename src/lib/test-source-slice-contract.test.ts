// Sözleşme testi — gevşetme, çağrı yerini düzelt.
//
// Kaynak metni dilimleyen testlerde ÇIPLAK `indexOf` + `slice` YASAKTIR.
// `indexOf` çıpayı bulamazsa **-1** döner ve `slice(-1)` hata vermez — son karakteri
// döndürür. Ardından gelen iddia çöp bir metinde çalışır ve polaritenin iki yönü de
// sessizce geçebilir:
//   • negatif iddia (`not.toContain`) → aranan şey zaten yok, GEÇER
//   • `slice(0, -1)` → dilim "dosyanın tamamına yakını" olur, `toContain` da GEÇER
//
// Ölçüldü (28.09, S04b): `ai-knowledge-search-index.test.ts` içindeki çıpa bilerek
// bozulduğunda dosyanın 5 testi de yeşil kaldı — üstelik o test aynı gün yapılan
// HNSW indeks düzeltmesini koruyan testti.
//
// Doğru araç: `@/test/source-slice` (`sliceFrom` · `sliceUntil` · `sliceBetween`).
// Çıpa kaybolursa test AÇIKÇA düşer ve hangi çıpanın kaybolduğunu söyler.
//
// Bu test S04b/S04c'de sıfırlanan sayacı kilitler; önceki hâli geçici bir tarama
// script'iydi ve her oturumda yeniden yazılması gerekiyordu.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const TEST_FILE = /\.test\.tsx?$/;

function collectTestFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectTestFiles(path);
    return TEST_FILE.test(entry.name) ? [path] : [];
  });
}

/** `indexOf` sonucunun -1 olamayacağını kanıtlayan ifadeler. */
const GUARD =
  /toBeGreaterThan\(\s*-1\s*\)|toBeGreaterThanOrEqual\(\s*0\s*\)|!==?\s*-1|===?\s*-1|>\s*-1|>=\s*0/;

type Offender = { file: string; line: number; text: string };

function findBareSliceIndexOf(files: string[]): Offender[] {
  const offenders: Offender[] = [];

  for (const file of files) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);

    lines.forEach((line, index) => {
      let from = 0;
      for (;;) {
        const at = line.indexOf(".indexOf(", from);
        if (at === -1) break;
        from = at + 1;

        const before = line.slice(0, at);
        // (a) Aynı satırda indexOf'tan ÖNCE açılmış bir slice/substring.
        const inlineSlice = /\.(slice|substring)\([^;]*$/.test(before);
        // (b) Değişkene atanıp sonraki satırlarda dilimlenmiş.
        //     ⚠️ (a) ile (b) ayrı ölçülmeli: satır içi kullanımda yakalanan değişken
        //     DİLİMİN SONUCU olur, indeksin kendisi değil — ilk ölçüm aracı tam bu
        //     yüzden kusur sayısını 16 yerine 3 göstermişti.
        const assigned = before.match(/(?:const|let)\s+(\w+)\s*=\s*[^=]*$/)?.[1];
        const window = lines.slice(index, index + 12).join("\n");
        const usedLater =
          !inlineSlice && assigned
            ? new RegExp(`\\.(slice|substring)\\([^)]*\\b${assigned}\\b`).test(window)
            : false;

        if (!inlineSlice && !usedLater) continue; // dilime girmiyor: -1 zaten anlamlı
        if (GUARD.test(lines.slice(index, index + 6).join("\n"))) continue;

        offenders.push({ file, line: index + 1, text: line.trim().slice(0, 100) });
      }
    });
  }

  return offenders;
}

describe("kaynak dilimleyen testlerde çıpa sözleşmesi", () => {
  const files = collectTestFiles(join(process.cwd(), "src"));

  it("test ağacını gerçekten tarıyor (tarama boşa düşmesin)", () => {
    // Bu koruma olmadan aşağıdaki iddia negatif ve çıpasız olurdu: yürüyüş bozulunca
    // "hiç ihlal yok" der. S04a'da tam olarak bu sınıf ölçüldü.
    expect(files.length, "test dosyası bulunamadı").toBeGreaterThan(300);
    expect(files.some((file) => file.includes("source-slice"))).toBe(true);
  });

  it("çıplak indexOf + slice kullanan test yoktur", () => {
    const offenders = findBareSliceIndexOf(files).map(
      ({ file, line, text }) => `${file.replace(process.cwd(), "").replace(/\\/g, "/")}:${line} → ${text}`,
    );

    expect(offenders, "@/test/source-slice yardımcılarını kullanın").toEqual([]);
  });
});

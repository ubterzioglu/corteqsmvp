// Sözleşme testi — Profil Workshop WS1 madde 10 (T19, 3 Eylül 2026):
// "Ülke bilgisi telefon alan kodundan TÜRETİLMEYECEK; +90 numaralı üye Berlin'de
// yaşıyor olabilir." CLAUDE.md'deki kural da aynı (Cadde bölümü). Kural bir kez
// yazılıp unutulmasın diye kaynak ağacı taranır: telefon önekinden ülke çıkaran
// bir yardımcı ya da libphonenumber bağımlılığı `src/` altına girerse test kırılır.
//
// Tek geçerli telefon işlemi biçim doğrulamadır (src/lib/profile-phone.ts) —
// o dosya ülke bilgisi ÜRETMEZ, yalnız E.164'e indirger.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC_ROOT = path.resolve(__dirname, "..");

const FORBIDDEN_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "countryFromPhone", pattern: /countryFromPhone/ },
  { label: "dialCode / dialingCode / diallingCode", pattern: /\bdial(?:l?ing)?_?[Cc]ode\b/ },
  { label: "callingCode", pattern: /\bcalling_?[Cc]ode\b/ },
  { label: "phonePrefix → country", pattern: /phone_?[Pp]refix/ },
  { label: "libphonenumber", pattern: /libphonenumber/ },
];

const SKIP_DIRS = new Set(["node_modules", "__snapshots__"]);

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  // `withFileTypes` dizin/dosya ayrımını readdir'in kendi sonucundan okur.
  // Eskiden her girdi için ayrı bir `statSync` çağrılıyordu (~1100 fazladan
  // sistem çağrısı); tam test paketi paralel koşarken bu tarama 15 sn'lik
  // süreyi aşıp SAHTE kırılma üretiyordu. Taranan küme ve desenler AYNI.
  for (const dirent of readdirSync(dir, { withFileTypes: true })) {
    const entry = dirent.name;
    if (SKIP_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    if (dirent.isDirectory()) {
      collectSourceFiles(full, out);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) continue;
    // Testler ve bu dosyanın kendisi kural metnini içerir; taranmaz.
    if (/\.test\.(ts|tsx|js|mjs)$/.test(entry) || /\.spec\.(ts|tsx)$/.test(entry)) continue;
    out.push(full);
  }
  return out;
}

describe("telefon alan kodundan ülke türetme yasağı (WS1-10)", () => {
  const files = collectSourceFiles(SRC_ROOT);

  it("kaynak ağacı boş değil (tarama gerçekten çalışıyor)", () => {
    expect(files.length).toBeGreaterThan(500);
  });

  it("src/ altında telefon önekinden ülke çıkaran kod ya da libphonenumber yok", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const { label, pattern } of FORBIDDEN_PATTERNS) {
        if (pattern.test(text)) {
          offenders.push(`${path.relative(SRC_ROOT, file)} → ${label}`);
        }
      }
    }
    expect(offenders).toEqual([]);
    // Süre AÇIKÇA uzatıldı: bu test ~1100 kaynak dosyayı okur ve kaynak ağacı
    // her oturumda büyüyor. Yüklü paketin disk rekabetinde 15 sn'lik varsayılan
    // yetmiyordu. Uzatılan yalnız SÜRE — taranan küme ve yasak desenler aynen
    // duruyor, sözleşme gevşetilmedi.
  }, 60_000);

  it("profile-phone yalnız biçim doğrular; ülke/diaspora üretmez", () => {
    const text = readFileSync(path.join(SRC_ROOT, "lib", "profile-phone.ts"), "utf8");
    expect(text).not.toMatch(/country|diaspora_key|geo_countries/i);
  });
});

// Yapılandırmalarda ADIYLA geçen yolların gerçekten var olduğunu denetler (plan W0, 2026-11-07).
//
// Bu yollar dosya taşınınca hata VERMEZ, yalnız kapsamdan düşer:
//  - tsconfig.strict-pilot.json `include`: tsc yok olan dosyayı sessizce atlar → sıkı denetim kalkar.
//  - eslint.config.js `files` listeleri: ESLint eşleşmeyen deseni sessizce yok sayar → kural kalkar.
//  - check-drift.mjs `preload`: okunamayan dosya ayrıca script içinde hata verir (çift kilit).
//  - check-dead-code.mjs `KNOWN_DEAD_FILES`: script zaten "bayat baseline" hatası verir.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const tracked = new Set(
  execFileSync("git", ["-c", "core.quotepath=false", "ls-files"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    .split(String.fromCharCode(10))
    .filter(Boolean),
);
const trackedDirs = new Set();
for (const f of tracked) {
  const parts = f.split("/");
  for (let i = 1; i < parts.length; i++) trackedDirs.add(parts.slice(0, i).join("/"));
}

const isGlob = (p) => /[*?{}[\]]/.test(p);
/** Glob ise, glob'dan ÖNCEKİ sabit dizin var mı; değilse dosya/dizin var mı. */
function exists(p) {
  if (!isGlob(p)) return tracked.has(p) || trackedDirs.has(p);
  const fixed = p.slice(0, p.search(/[*?{}[\]]/)).replace(/\/[^/]*$/, "");
  return fixed === "" || trackedDirs.has(fixed);
}

describe("yapılandırmadaki sabit yollar var", () => {
  it("tsconfig.strict-pilot.json include'daki her dosya izleniyor", () => {
    const { include } = JSON.parse(readFileSync("tsconfig.strict-pilot.json", "utf8"));
    expect(include.length).toBeGreaterThan(3);
    const missing = include.filter((p) => !exists(p));
    expect(missing, "strict-pilot listesinde var olmayan yol").toEqual([]);
  });

  it("eslint.config.js files listelerindeki her yol/desen gerçek bir yeri gösteriyor", () => {
    const src = readFileSync("eslint.config.js", "utf8");
    const paths = [];
    for (const block of src.matchAll(/files:\s*\[([^\]]*)\]/g)) {
      for (const m of block[1].matchAll(/"([^"]+)"/g)) paths.push(m[1]);
    }
    expect(paths.length, "eslint files listesi okunamadı").toBeGreaterThan(5);
    const missing = paths.filter((p) => !p.startsWith("**") && !p.startsWith("*.") && !exists(p));
    expect(missing, "eslint files listesinde var olmayan yol").toEqual([]);
  });

  it("check-drift preload listesindeki her dosya izleniyor", () => {
    const src = readFileSync("scripts/check/check-drift.mjs", "utf8");
    const list = /const preload = \[([^\]]*)\]/.exec(src);
    expect(list, "preload listesi bulunamadı").not.toBeNull();
    const paths = [...list[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(paths.length).toBeGreaterThan(3);
    expect(paths.filter((p) => !tracked.has(p))).toEqual([]);
  });
});

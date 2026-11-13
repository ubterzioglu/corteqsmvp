// SG1 sözleşmesi: veritabanı dökümleri (kişisel veri + auth hash'leri) git'te İZLENMEZ.
//
// Önceki `scripts/check-no-backups-tracked.ps1` aynı kontrolü yapıyordu ama hiçbir npm
// script'ine, CI'a ya da kancaya bağlı değildi — yani hiç koşmuyordu (2026-11-07). Test
// olarak `npm run test` / CI içinde koşar. Repo PUBLIC'tir: buraya giren döküm herkese açılır.

import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

function tracked(...paths) {
  return execFileSync("git", ["-c", "core.quotepath=false", "ls-files", "--", ...paths], { encoding: "utf8" })
    .split(String.fromCharCode(10))
    .filter(Boolean);
}

describe("SG1 · veritabanı dökümleri git'te izlenmez", () => {
  it("docs/archive/backups/ altında izlenen dosya yoktur", () => {
    expect(tracked("docs/archive/backups"), "Çözüm: git rm --cached -r docs/archive/backups/").toEqual([]);
  });

  it("hiçbir yerde .dump / .backup / pg_dump çıktısı izlenmez", () => {
    expect(tracked("*.dump", "*.backup", "**/*.dump", "**/*.backup")).toEqual([]);
  });
});

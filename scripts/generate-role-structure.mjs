#!/usr/bin/env node
/**
 * A5 · Excel'den rol yapısı veri modülü üretici.
 *
 * Kaynak: CorteQS_Rol_Tablosu_v2.xlsx (repo kökü)
 * Çıktı: src/lib/role-structure.ts
 *
 * Kullanım: node scripts/generate-role-structure.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { read, utils } from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const excelPath = resolve(repoRoot, "CorteQS_Rol_Tablosu_v2.xlsx");
const outputPath = resolve(repoRoot, "src/lib/role-structure.ts");

// Excel'i oku
const workbook = read(excelPath);
const sheetName = workbook.SheetNames[0]; // İlk sayfa
const sheet = workbook.Sheets[sheetName];

if (!sheet) {
  console.error(`Sheet "${sheetName}" bulunamadı!`);
  process.exit(1);
}

// JSON'a çevir
const rows = utils.sheet_to_json(sheet, { defval: "" });

// Rol yapısı tipi
const roleStructure = [];

for (const row of rows) {
  // Başlık satırını atla
  if (row["Ana Rol"] === "Ana Rol" || !row["Ana Rol"]) continue;

  const anaRol = String(row["Ana Rol"] || "").trim();
  const altRol = String(row["Alt Rol"] || "").trim();
  const uzmanlik = String(row["Uzmanlık"] || "").trim();
  const yeniKod = String(row["Yeni Admin Rol Kodu"] || "").trim();
  const eskiKod = String(row["Eski Dropdown (77)"] || "").trim();
  const durum = String(row["Durum"] || "").trim();

  if (!yeniKod) continue;

  // Durum: "ÖNERİ – onay bekliyor" → "oneri", aksi halde "onaylandi"
  const durumNormalized = durum.toLowerCase().includes("öneri") ? "oneri" : "onaylandi";

  roleStructure.push({
    anaRol,
    altRol,
    uzmanlik,
    yeniKod,
    eskiKod,
    durum: durumNormalized,
  });
}

// TypeScript dosyası üret
const output = `// A5 · Rol yapısı veri modülü (Excel'den üretildi — ELLE DEĞİŞTİRİLMEZ)
//
// Kaynak: CorteQS_Rol_Tablosu_v2.xlsx → "Yeni Rol Yapısı" sayfası
// Üretim betiği: scripts/generate-role-structure.mjs
//
// ⚠️ Bu dosyayı ELLE düzenleme. Excel değiştiğinde betiği yeniden çalıştır:
//   node scripts/generate-role-structure.mjs

export type RoleDurum = "onaylandi" | "oneri";

export interface RoleStructureEntry {
  anaRol: string;
  altRol: string;
  uzmanlik: string;
  yeniKod: string;
  eskiKod: string;
  durum: RoleDurum;
}

/**
 * Rol yapısı: 7 ana rol, 52 alt rol (Bireysel dahil), 19 ÖNERİ.
 * Excel'den üretildi — elle değiştirilmez.
 */
export const ROLE_STRUCTURE: readonly RoleStructureEntry[] = ${JSON.stringify(roleStructure, null, 2)};

/** Ana rol listesi (benzersiz, sıralı). */
export const ANA_ROLLER: readonly string[] = [
  ...new Set(ROLE_STRUCTURE.map((r) => r.anaRol)),
].sort();

/** Yalnız onaylanmış roller (durum !== "oneri"). */
export const ONAYLANMIS_ROLLER: readonly RoleStructureEntry[] = ROLE_STRUCTURE.filter(
  (r) => r.durum === "onaylandi"
);

/** Yalnız ÖNERİ roller (yayına alınmaz). */
export const ONERI_ROLLER: readonly RoleStructureEntry[] = ROLE_STRUCTURE.filter(
  (r) => r.durum === "oneri"
);

/** Yeni kod → entry eşlemesi. */
export const ROLE_BY_YENI_KOD: Readonly<Record<string, RoleStructureEntry>> = Object.fromEntries(
  ROLE_STRUCTURE.map((r) => [r.yeniKod, r])
);

/** Eski dropdown → yeni kod eşlemesi (boş olmayanlar). */
export const ESKI_YENI_ESLEME: Readonly<Record<string, string>> = Object.fromEntries(
  ROLE_STRUCTURE.filter((r) => r.eskiKod).map((r) => [r.eskiKod, r.yeniKod])
);
`;

writeFileSync(outputPath, output, "utf-8");

console.log(`✅ Rol yapısı üretildi: ${outputPath}`);
console.log(`   Toplam: ${roleStructure.length} satır`);
console.log(`   Ana rol: ${new Set(roleStructure.map((r) => r.anaRol)).size}`);
console.log(`   ÖNERİ: ${roleStructure.filter((r) => r.durum === "oneri").length}`);
console.log(`   Eski dropdown eşleme: ${roleStructure.filter((r) => r.eskiKod).length}`);

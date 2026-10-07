#!/usr/bin/env python3
"""Generate role-structure.ts from Excel (openpyxl fallback)."""
import sys
import json
sys.stdout.reconfigure(encoding='utf-8')
from openpyxl import load_workbook

wb = load_workbook('C:\\temp_private\\corteqs\\corteqs_fin\\CorteQS_Rol_Tablosu_v2.xlsx', data_only=True)
ws = wb['Yeni Rol Yapısı']

rows = []
for row in ws.iter_rows(min_row=2, values_only=True):
    if not row[1]:  # Ana Rol boşsa atla
        continue
    rows.append({
        'anaRol': str(row[1] or '').strip(),
        'altRol': str(row[3] or '').strip(),
        'uzmanlik': str(row[5] or '').strip(),
        'yeniKod': str(row[6] or '').strip(),
        'eskiKod': str(row[7] or '').strip() if row[7] and str(row[7]).strip() not in ('—', '-', '') else '',
        'durum': 'onaylandi' if str(row[9] or '').strip().lower() == 'onaylandı' else 'oneri'
    })

# TypeScript dosyası üret
ana_rol_count = len(set(r['anaRol'] for r in rows))
alt_rol_count = len(set(r['altRol'] for r in rows))
oneri_count = sum(1 for r in rows if r['durum'] == 'oneri')
etiket_count = sum(1 for r in rows if r['uzmanlik'])

output = f'''// A5 · Rol yapısı veri modülü (Excel'den üretildi — ELLE DEĞİŞTİRİLMEZ)
//
// Kaynak: CorteQS_Rol_Tablosu_v2.xlsx → "Yeni Rol Yapısı" sayfası
// Üretim betiği: scripts/generate-role-structure.mjs
//
// ⚠️ Bu dosyayı ELLE düzenleme. Excel değiştiğinde betiği yeniden çalıştır:
//   node scripts/generate-role-structure.mjs

export type RoleDurum = "onaylandi" | "oneri";

export interface RoleStructureEntry {{
  anaRol: string;
  altRol: string;
  uzmanlik: string;
  yeniKod: string;
  eskiKod: string;
  durum: RoleDurum;
}}

/**
 * Rol yapısı: {ana_rol_count} ana rol, {alt_rol_count} alt rol, {oneri_count} ÖNERİ.
 * Excel'den üretildi — elle değiştirilmez.
 */
export const ROLE_STRUCTURE: readonly RoleStructureEntry[] = {json.dumps(rows, ensure_ascii=False, indent=2)};

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
'''

with open('C:\\temp_private\\corteqs\\corteqs_fin\\src\\lib\\role-structure.ts', 'w', encoding='utf-8') as f:
    f.write(output)

print(f'✅ Rol yapısı üretildi')
print(f'   Toplam: {len(rows)} satır')
print(f'   Ana rol: {ana_rol_count}')
print(f'   Alt rol: {alt_rol_count}')
print(f'   ÖNERİ: {oneri_count}')
print(f'   Etiketli: {etiket_count}')

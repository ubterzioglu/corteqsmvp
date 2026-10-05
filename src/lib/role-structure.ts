// A5 · Rol yapısı veri modülü (Excel'den üretildi — ELLE DEĞİŞTİRİLMEZ)
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
export const ROLE_STRUCTURE: readonly RoleStructureEntry[] = [];

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

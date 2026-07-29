// Cafe tema kataloğu ve korumalı marka listesi.
// İkisi de DB'de tutulur (kod içinde sabit liste YOK) — ürün kararı SQL/panel işidir.

import { isSupabaseConfigured } from "@/integrations/supabase/client";

import { db, reportCaddeApiError } from "./cadde-internal";
import type { CaddeProtectedBrand } from "./cadde-rules";

export type CaddeCafeTheme = {
  key: string;
  labelTr: string;
  iconKey: string | null;
  sortOrder: number;
};

export async function listCaddeCafeThemes(): Promise<CaddeCafeTheme[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await db
      .from("cadde_cafe_themes")
      .select("key, label_tr, icon_key, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as Array<{ key: string; label_tr: string; icon_key: string | null; sort_order: number }>).map(
      (row) => ({ key: row.key, labelTr: row.label_tr, iconKey: row.icon_key, sortOrder: row.sort_order }),
    );
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeCafeThemes", error);
    return [];
  }
}

/** Form'un anında uyarı verebilmesi için marka listesi; gerçek enforce RPC'de. */
export async function listCaddeProtectedBrands(): Promise<CaddeProtectedBrand[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await db
      .from("cadde_protected_brands")
      .select("brand_name, match_pattern")
      .eq("is_active", true);
    if (error) throw error;
    return ((data ?? []) as Array<{ brand_name: string; match_pattern: string }>).map((row) => ({
      brandName: row.brand_name,
      matchPattern: row.match_pattern,
    }));
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeProtectedBrands", error);
    return [];
  }
}

// ── Admin: marka yönetimi ───────────────────────────────────────────────────

export type CaddeProtectedBrandRow = CaddeProtectedBrand & {
  id: string;
  isActive: boolean;
  note: string | null;
};

export async function listCaddeProtectedBrandsForAdmin(): Promise<CaddeProtectedBrandRow[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await db
      .from("cadde_protected_brands")
      .select("id, brand_name, match_pattern, is_active, note")
      .order("brand_name", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as Array<{ id: string; brand_name: string; match_pattern: string; is_active: boolean; note: string | null }>).map(
      (row) => ({
        id: row.id,
        brandName: row.brand_name,
        matchPattern: row.match_pattern,
        isActive: row.is_active,
        note: row.note,
      }),
    );
  } catch (error: unknown) {
    reportCaddeApiError("listCaddeProtectedBrandsForAdmin", error);
    return [];
  }
}

export async function createCaddeProtectedBrand(input: { brandName: string; matchPattern: string; note?: string }): Promise<void> {
  const brandName = input.brandName.trim();
  const matchPattern = input.matchPattern.trim().toLowerCase();
  if (brandName.length < 2) throw new Error("Marka adı en az 2 karakter olmalı.");
  if (matchPattern.length < 2) throw new Error("Eşleşme anahtarı en az 2 karakter olmalı.");

  const { error } = await db
    .from("cadde_protected_brands")
    .insert({ brand_name: brandName, match_pattern: matchPattern, note: input.note?.trim() || null });
  if (error) {
    throw new Error(error.code === "23505" ? "Bu eşleşme anahtarı zaten kayıtlı." : "Marka eklenemedi.");
  }
}

export async function setCaddeProtectedBrandActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await db.from("cadde_protected_brands").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error("Marka güncellenemedi.");
}

export async function deleteCaddeProtectedBrand(id: string): Promise<void> {
  const { error } = await db.from("cadde_protected_brands").delete().eq("id", id);
  if (error) throw new Error("Marka silinemedi.");
}

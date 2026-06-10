// Admin Panel V2 — Roller AFS Matrisi veri katmanı (masterplan §17/Faz 8).
// Rol seçenekleri buradan; katalog satırları @/lib/role-catalog, rol bundle'ı
// @/lib/admin getRoleManagementBundle'dan gelir (hook bunları query'ye bağlar).

import { supabase } from "@/integrations/supabase/client";
import type { RoleOption } from "@/components/admin/RoleSearchSelect";

export async function fetchAdminRoleOptions(): Promise<RoleOption[]> {
  const { data, error } = await supabase
    .from("roles")
    .select("key, label")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;

  return ((data ?? []) as Array<{ key: string; label: string }>).map((role) => ({
    value: role.key,
    label: role.label,
    hint: role.key,
  }));
}

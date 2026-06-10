// Admin Panel V2 — Roller AFS Matrisi React Query hook'u (masterplan §17/Faz 8).
// Üç sorgu: rol seçenekleri, AFS katalog satırları, seçili rolün bundle'ı
// (roleKey boşken bundle sorgusu kapalıdır). Bundle düzenlemesi sayfada lokal
// state'te yapılır; bu hook yalnızca okuma katmanıdır.

import { useQuery } from "@tanstack/react-query";

import { fetchAdminRoleOptions } from "@/lib/admin-shell/admin-role-matrix-api";
import { adminQueryKeys } from "@/lib/admin-shell/admin-query-keys";
import { getRoleManagementBundle } from "@/lib/admin";
import { fetchCatalogRows } from "@/lib/role-catalog";

export function useAdminRoleMatrix(roleKey: string) {
  const rolesQuery = useQuery({
    queryKey: adminQueryKeys.roleMatrixRoles(),
    queryFn: fetchAdminRoleOptions,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const catalogQuery = useQuery({
    queryKey: adminQueryKeys.roleMatrixCatalog(),
    queryFn: fetchCatalogRows,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const bundleQuery = useQuery({
    queryKey: adminQueryKeys.roleMatrixBundle(roleKey),
    queryFn: () => getRoleManagementBundle(roleKey),
    enabled: roleKey.length > 0,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return { rolesQuery, catalogQuery, bundleQuery };
}

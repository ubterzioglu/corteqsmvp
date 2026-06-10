// Admin Panel V2 — dashboard özeti React Query hook'u.

import { useQuery } from "@tanstack/react-query";

import { fetchAdminDashboardSummary } from "@/lib/admin-shell/admin-dashboard-api";
import { adminQueryKeys } from "@/lib/admin-shell/admin-query-keys";

export function useAdminDashboardSummary() {
  return useQuery({
    queryKey: adminQueryKeys.dashboard(),
    queryFn: fetchAdminDashboardSummary,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

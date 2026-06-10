// Admin Panel V2 — Audit Logs React Query hook'u (masterplan §17/Faz 8).

import { useQuery } from "@tanstack/react-query";

import { fetchAdminAuditLogsBundle } from "@/lib/admin-shell/admin-audit-logs-api";
import { adminQueryKeys } from "@/lib/admin-shell/admin-query-keys";

export function useAdminAuditLogs() {
  return useQuery({
    queryKey: adminQueryKeys.auditLogs(),
    queryFn: fetchAdminAuditLogsBundle,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

// Admin — İstemci Hataları React Query hook'u (client_error_reports).

import { useQuery } from "@tanstack/react-query";

import { fetchClientErrorReportsBundle } from "@/lib/admin-shell/admin-client-errors-api";
import { adminQueryKeys } from "@/lib/admin-shell/admin-query-keys";

export function useAdminClientErrors() {
  return useQuery({
    queryKey: adminQueryKeys.clientErrors(),
    queryFn: fetchClientErrorReportsBundle,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

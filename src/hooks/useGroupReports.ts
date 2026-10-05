// G14 · grup şikayeti React Query hook'ları (muhasebe deseni: api modülü + hook).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchGroupReportState,
  submitGroupReport,
  GroupReportError,
  type GroupReportInput,
  type GroupReportState,
  type SubmitGroupReportResult,
} from "@/lib/group-reports-api";

export const groupReportKeys = {
  all: ["group-reports"] as const,
  state: (landingDbId: string) => [...groupReportKeys.all, "state", landingDbId] as const,
};

/** Girişli kullanıcının bu grup için şikayet durumu. Girişsizken sorgu ATILMAZ. */
export function useGroupReportState(landingDbId: string | undefined, enabled: boolean) {
  return useQuery<GroupReportState>({
    queryKey: groupReportKeys.state(landingDbId ?? ""),
    queryFn: () => fetchGroupReportState(landingDbId as string),
    enabled: enabled && Boolean(landingDbId),
    retry: false,
  });
}

export function useSubmitGroupReport(landingDbId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<SubmitGroupReportResult, GroupReportError, GroupReportInput>({
    mutationFn: (input) => submitGroupReport(input),
    onSuccess: () => {
      if (landingDbId) void queryClient.invalidateQueries({ queryKey: groupReportKeys.state(landingDbId) });
    },
  });
}

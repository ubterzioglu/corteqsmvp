// Admin Panel V2 — Approval Queue React Query hook'u (masterplan §17/Faz 8).
// Karar sonrası cache anında güncellenir (eski sayfadaki optimistic davranışla aynı),
// ardından §13.3 gereği approvals + dashboard (bekleyen approval KPI'ı) invalidate edilir.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchAdminApprovalsBundle,
  type AdminApprovalsBundle,
} from "@/lib/admin-shell/admin-approvals-api";
import { adminQueryKeys } from "@/lib/admin-shell/admin-query-keys";
import { reviewApprovalRequestAsAdmin } from "@/lib/admin";

export type ApprovalDecisionInput = {
  requestId: string;
  decision: "approved" | "rejected";
  note: string | null;
};

export function useAdminApprovals() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: adminQueryKeys.approvals(),
    queryFn: fetchAdminApprovalsBundle,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ requestId, decision, note }: ApprovalDecisionInput) =>
      reviewApprovalRequestAsAdmin(requestId, decision, note),
    onSuccess: (_data, { requestId, decision, note }) => {
      queryClient.setQueryData<AdminApprovalsBundle>(adminQueryKeys.approvals(), (current) =>
        current
          ? {
              ...current,
              requests: current.requests.map((request) =>
                request.id === requestId
                  ? { ...request, status: decision, admin_note: note }
                  : request,
              ),
            }
          : current,
      );
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.approvals() });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard() });
    },
  });

  return { ...query, reviewMutation };
}

// Admin Panel V2 — Approval Queue veri katmanı (masterplan §17/Faz 8).
// Liste sorgusu buradadır; karar mutation'ı admin_review_approval_request RPC'sini
// saran @/lib/admin reviewApprovalRequestAsAdmin üzerinden verilir.

import { supabase } from "@/integrations/supabase/client";
import {
  fetchAdminUserLabels,
  type AdminUserLabel,
} from "./admin-user-labels";

export type AdminApprovalRequest = {
  id: string;
  request_type: string;
  user_id: string;
  target_role_key: string | null;
  target_feature_key: string | null;
  target_entity_type: string | null;
  payload: Record<string, unknown> | null;
  status: string;
  admin_note: string | null;
  created_at: string;
};

export type AdminApprovalsBundle = {
  requests: AdminApprovalRequest[];
  users: AdminUserLabel[];
};

export async function fetchAdminApprovalsBundle(): Promise<AdminApprovalsBundle> {
  const [requestsResult, users] = await Promise.all([
    supabase
      .from("approval_requests")
      .select(
        "id, request_type, user_id, target_role_key, target_feature_key, target_entity_type, payload, status, admin_note, created_at",
      )
      .order("created_at", { ascending: false }),
    fetchAdminUserLabels(),
  ]);

  if (requestsResult.error) throw requestsResult.error;

  return {
    requests: (requestsResult.data ?? []) as AdminApprovalRequest[],
    users,
  };
}

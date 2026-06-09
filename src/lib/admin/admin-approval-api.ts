import { supabase } from "@/integrations/supabase/client";

export async function reviewApprovalRequestAsAdmin(requestId: string, decision: "approved" | "rejected", note: string | null) {
  const { error } = await supabase.rpc("admin_review_approval_request", {
    request_id: requestId,
    decision,
    note,
  });

  if (error) throw error;
}

// Admin Panel V2 — Audit Logs veri katmanı (masterplan §17/Faz 8).
// Son 200 admin işlemi + actor/target etiketleri için kullanıcı listesi.

import { supabase } from "@/integrations/supabase/client";
import {
  fetchAdminUserLabels,
  type AdminUserLabel,
} from "./admin-user-labels";

export type AdminAuditLogRow = {
  id: string;
  actor_user_id: string | null;
  action: string;
  target_user_id: string | null;
  target_entity_type: string | null;
  target_entity_id: string | null;
  before_value: unknown;
  after_value: unknown;
  created_at: string;
};

export type AdminAuditLogsBundle = {
  logs: AdminAuditLogRow[];
  users: AdminUserLabel[];
};

export async function fetchAdminAuditLogsBundle(): Promise<AdminAuditLogsBundle> {
  const [logsResult, users] = await Promise.all([
    supabase
      .from("admin_audit_logs")
      .select(
        "id, actor_user_id, action, target_user_id, target_entity_type, target_entity_id, before_value, after_value, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    fetchAdminUserLabels(),
  ]);

  if (logsResult.error) throw logsResult.error;

  return {
    logs: (logsResult.data ?? []) as AdminAuditLogRow[],
    users,
  };
}

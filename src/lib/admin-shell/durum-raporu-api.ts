// S8 (13 Eylül, B6): AdminDurumRaporuPage.tsx doğrudan
// supabase.rpc("get_rebuild_status_report") çağırıyordu.

import { supabase } from "@/integrations/supabase/client";

export interface StatusReport {
  generated_at: string;
  roles_total: number;
  roles_active: number;
  legacy_roles: number;
  afs_attributes: number;
  afs_features: number;
  afs_sections: number;
  role_attributes: number;
  role_features: number;
  role_sections: number;
  catalog_items_total: number;
  placeholders: number;
  item_role_links: number;
  items_without_primary_role: number;
  legacy_tables_remaining: number;
  family_columns_remaining: number;
  old_table_names_remaining: number;
}

export async function getRebuildStatusReport(): Promise<StatusReport> {
  const { data, error } = await supabase.rpc("get_rebuild_status_report");
  if (error) throw error;
  return data as unknown as StatusReport;
}

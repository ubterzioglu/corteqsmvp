import { supabase } from "@/integrations/supabase/client";
import type { RoleManagementBundle } from "./admin-types";

export async function setUserRoleAsAdmin(userId: string, roleKey: string) {
  const { error } = await supabase.rpc("admin_set_user_role", {
    target_user_id: userId,
    role_key: roleKey,
  });

  if (error) throw error;
}

export async function getRoleManagementBundle(roleKey: string): Promise<RoleManagementBundle> {
  const { data, error } = await (supabase as any).rpc("get_role_management_bundle", {
    p_role_key: roleKey,
  });

  if (error) throw error;
  return data as RoleManagementBundle;
}

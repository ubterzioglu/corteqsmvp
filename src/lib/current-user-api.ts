import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type CurrentUserDashboardFeature = {
  feature_key: string;
  label: string;
  description: string | null;
  scope: string;
  feature_type: string;
  is_enabled: boolean;
  source: string;
  sort_order: number;
};

export type CurrentUserFeatureRow = { feature_key: string; is_enabled: boolean; source: string };

async function callCurrentUserRpc<T>(name: string): Promise<T> {
  const { data, error } = await supabase.rpc(name as never);
  if (error) throw error;
  return data as T;
}

export const getCurrentUserProfile = () => callCurrentUserRpc<Json>("get_current_user_profile");
export const getCurrentUserDashboard = () => callCurrentUserRpc<CurrentUserDashboardFeature[]>("get_current_user_dashboard");
export const getCurrentUserFeatures = () => callCurrentUserRpc<CurrentUserFeatureRow[]>("get_current_user_features");

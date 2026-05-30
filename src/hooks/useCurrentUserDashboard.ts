import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";

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

export const useCurrentUserDashboard = (enabled = true) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [items, setItems] = useState<CurrentUserDashboardFeature[]>([]);

  const loadDashboard = useCallback(async () => {
    if (!enabled || !user) {
      setItems([]);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await (supabase as any).rpc("get_current_user_dashboard");

    if (error) {
      setItems([]);
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setItems(((data ?? []) as CurrentUserDashboardFeature[]).filter((item) => item.is_enabled));
    setIsLoading(false);
  }, [enabled, user]);

  useEffect(() => {
    if (isAuthLoading) return;
    void loadDashboard();
  }, [isAuthLoading, loadDashboard]);

  return {
    isLoading: isLoading || isAuthLoading,
    errorMessage,
    items,
    refreshDashboard: loadDashboard,
  };
};

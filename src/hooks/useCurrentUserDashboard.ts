import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/useAuth";
import { getCurrentUserDashboard, type CurrentUserDashboardFeature } from "@/lib/current-user-api";

export type { CurrentUserDashboardFeature } from "@/lib/current-user-api";

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

    try {
      const data = await getCurrentUserDashboard();
      setItems((data ?? []).filter((item) => item.is_enabled));
    } catch (error) {
      setItems([]);
      setErrorMessage(error instanceof Error ? error.message : "Panel yüklenemedi");
    }
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

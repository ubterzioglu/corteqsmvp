// Admin Panel V2 — User Feature Overrides React Query hook'u (masterplan §17/Faz 8).
// Kaydet/kaldır sonrası cache, eski sayfadaki optimistic davranışla birebir güncellenir;
// ardından §13.3 gereği overrides + dashboard (override KPI'ı) invalidate edilir.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchAdminOverridesBundle,
  type AdminOverrideRow,
  type AdminOverridesBundle,
} from "@/lib/admin-shell/admin-overrides-api";
import { adminQueryKeys } from "@/lib/admin-shell/admin-query-keys";
import {
  clearUserFeatureOverrideAsAdmin,
  setUserFeatureOverrideDetailedAsAdmin,
} from "@/lib/admin";

export type SaveOverrideInput = {
  userId: string;
  featureKey: string;
  isEnabled: boolean;
  reason: string | null;
};

export type ClearOverrideInput = {
  userId: string;
  featureKey: string;
};

export function useAdminUserOverrides() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: adminQueryKeys.overrides(),
    queryFn: fetchAdminOverridesBundle,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: adminQueryKeys.overrides() });
    void queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard() });
  };

  const saveMutation = useMutation({
    mutationFn: ({ userId, featureKey, isEnabled, reason }: SaveOverrideInput) =>
      setUserFeatureOverrideDetailedAsAdmin(userId, featureKey, isEnabled, reason),
    onSuccess: (_data, { userId, featureKey, isEnabled, reason }) => {
      const nextOverride: AdminOverrideRow = {
        user_id: userId,
        feature_key: featureKey,
        is_enabled: isEnabled,
        reason,
        updated_at: new Date().toISOString(),
      };
      queryClient.setQueryData<AdminOverridesBundle>(adminQueryKeys.overrides(), (current) =>
        current
          ? {
              ...current,
              overrides: [
                nextOverride,
                ...current.overrides.filter(
                  (override) =>
                    !(override.user_id === userId && override.feature_key === featureKey),
                ),
              ],
            }
          : current,
      );
      invalidate();
    },
  });

  const clearMutation = useMutation({
    mutationFn: ({ userId, featureKey }: ClearOverrideInput) =>
      clearUserFeatureOverrideAsAdmin(userId, featureKey),
    onSuccess: (_data, { userId, featureKey }) => {
      queryClient.setQueryData<AdminOverridesBundle>(adminQueryKeys.overrides(), (current) =>
        current
          ? {
              ...current,
              overrides: current.overrides.filter(
                (override) =>
                  !(override.user_id === userId && override.feature_key === featureKey),
              ),
            }
          : current,
      );
      invalidate();
    },
  });

  return { ...query, saveMutation, clearMutation };
}

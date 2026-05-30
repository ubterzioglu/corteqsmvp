import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  APP_FEATURE_KEY_LIST,
  INDIVIDUAL_FEATURE_KEY_LIST,
  type AppFeatureKey,
  type FeatureSource,
  type GenericFeatureKey,
  type IndividualFeatureKey,
} from "@/lib/features";

type FeatureRow = {
  feature_key: string;
  is_enabled: boolean;
  source: string;
};

type FeatureState = {
  isEnabled: boolean;
  source: FeatureSource;
};

type FeatureStateMap = Partial<Record<AppFeatureKey, FeatureState>>;

export const useFeatureFlags = (enabled = true) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [featureMap, setFeatureMap] = useState<FeatureStateMap>({});

  const loadFeatures = useCallback(async () => {
    if (!enabled || !user) {
      setFeatureMap({});
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase.rpc("get_current_user_features");

    if (error) {
      setFeatureMap({});
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    const nextMap: FeatureStateMap = {};
    const rows = (data ?? []) as FeatureRow[];

    for (const row of rows) {
      if (!APP_FEATURE_KEY_LIST.includes(row.feature_key as AppFeatureKey)) {
        continue;
      }

      const source: FeatureSource =
        row.source === "override" || row.source === "role_default" || row.source === "fallback"
          ? row.source
          : "fallback";

      nextMap[row.feature_key as AppFeatureKey] = {
        isEnabled: Boolean(row.is_enabled),
        source,
      };
    }

    setFeatureMap(nextMap);
    setIsLoading(false);
  }, [enabled, user]);

  useEffect(() => {
    if (isAuthLoading) return;
    void loadFeatures();
  }, [isAuthLoading, loadFeatures]);

  const isFeatureEnabled = useCallback(
    (featureKey: AppFeatureKey) => {
      return featureMap[featureKey]?.isEnabled ?? false;
    },
    [featureMap],
  );

  const getFeatureSource = useCallback(
    (featureKey: AppFeatureKey) => {
      return featureMap[featureKey]?.source ?? "fallback";
    },
    [featureMap],
  );

  const featureSources = useMemo(() => {
    const map: Partial<Record<IndividualFeatureKey, FeatureSource>> = {};
    for (const key of INDIVIDUAL_FEATURE_KEY_LIST) {
      map[key] = featureMap[key]?.source ?? "fallback";
    }
    return map;
  }, [featureMap]);

  const genericFeatureSources = useMemo(() => {
    const map: Partial<Record<GenericFeatureKey, FeatureSource>> = {};
    for (const key of APP_FEATURE_KEY_LIST) {
      if (INDIVIDUAL_FEATURE_KEY_LIST.includes(key as IndividualFeatureKey)) continue;
      map[key as GenericFeatureKey] = featureMap[key]?.source ?? "fallback";
    }
    return map;
  }, [featureMap]);

  return {
    isLoading: isLoading || isAuthLoading,
    errorMessage,
    isFeatureEnabled,
    getFeatureSource,
    featureMap,
    featureSources,
    genericFeatureSources,
    refreshFeatures: loadFeatures,
  };
};

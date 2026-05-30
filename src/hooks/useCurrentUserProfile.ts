import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { mapCurrentUserProfilePayload, type CurrentUserProfilePayload } from "@/lib/member-profile";

export const useCurrentUserProfile = (enabled = true) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<CurrentUserProfilePayload | null>(null);

  const loadProfile = useCallback(async () => {
    if (!enabled || !user) {
      setProfile(null);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase.rpc("get_current_user_profile");

    if (error) {
      setProfile(null);
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setProfile(mapCurrentUserProfilePayload(data));
    setIsLoading(false);
  }, [enabled, user]);

  useEffect(() => {
    if (isAuthLoading) return;
    void loadProfile();
  }, [isAuthLoading, loadProfile]);

  return {
    isLoading: isLoading || isAuthLoading,
    errorMessage,
    profile,
    refreshProfile: loadProfile,
  };
};

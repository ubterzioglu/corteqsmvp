import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/useAuth";
import { mapCurrentUserProfilePayload, type CurrentUserProfilePayload } from "@/lib/member-profile";
import { getCurrentUserProfile } from "@/lib/current-user-api";

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

    try {
      const data = await getCurrentUserProfile();
      setProfile(mapCurrentUserProfilePayload(data));
    } catch (error) {
      setProfile(null);
      setErrorMessage(error instanceof Error ? error.message : "Profil yüklenemedi");
    }
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

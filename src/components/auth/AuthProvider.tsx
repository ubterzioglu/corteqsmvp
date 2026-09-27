import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { AuthContext, type AuthContextValue, type Profile } from "@/components/auth/auth-context";
import { fetchAuthProfile } from "@/lib/auth-api";
import { supabase } from "@/integrations/supabase/client";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Tablo sorguları `@/lib/auth-api` içindedir; burası yalnız durumu tutar.
  const fetchProfile = useCallback(async (userId: string) => {
    setProfile(await fetchAuthProfile(userId));
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setIsLoading(false);
      if (nextSession?.user) {
        // setTimeout avoids Supabase client deadlock inside auth state change callback
        setTimeout(() => fetchProfile(nextSession.user.id), 0);
      } else {
        setProfile(null);
      }
    });

    void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      setIsLoading(false);
      if (initialSession?.user) {
        void fetchProfile(initialSession.user.id);
      }
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await fetchProfile(session.user.id);
  }, [session, fetchProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      profile,
      accountType: profile?.account_type ?? null,
      onboardingCompleted: profile?.onboarding_completed ?? false,
      signOut,
      refreshProfile,
    }),
    [session, isLoading, profile, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

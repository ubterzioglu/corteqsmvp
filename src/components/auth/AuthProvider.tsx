import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

  // Açılışta hem `getSession()` hem `onAuthStateChange(INITIAL_SESSION)` aynı kullanıcıyı
  // bildirir; ikisi de profil çekince 4 sorgu + 4 CORS preflight gidiyordu (Lighthouse
  // 2026-10-13). Aynı kullanıcı için ikinci açılış çağrısı atlanır; `refreshProfile` ve
  // gerçek kullanıcı değişimi bu korumadan geçmez.
  const lastBootstrapUserId = useRef<string | null>(null);
  const bootstrapProfile = useCallback(
    (userId: string) => {
      if (lastBootstrapUserId.current === userId) return;
      lastBootstrapUserId.current = userId;
      void fetchProfile(userId);
    },
    [fetchProfile],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    lastBootstrapUserId.current = null;
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
        setTimeout(() => bootstrapProfile(nextSession.user.id), 0);
      } else {
        lastBootstrapUserId.current = null;
        setProfile(null);
      }
    });

    void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      setIsLoading(false);
      if (initialSession?.user) {
        bootstrapProfile(initialSession.user.id);
      }
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [bootstrapProfile]);

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

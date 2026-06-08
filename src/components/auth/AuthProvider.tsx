import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { AuthContext, type AuthContextValue, type Profile } from "@/components/auth/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const [attrsResult, roleResult] = await Promise.all([
      supabase
        .from("user_profile_attributes")
        .select("value_text, attribute_catalog!inner(key)")
        .eq("user_id", userId)
        .in("attribute_catalog.key", ["full_name", "avatar_url", "phone"]),
      supabase
        .from("user_role_assignments")
        .select("roles!inner(key)")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const attrs = attrsResult.data ?? [];
    const getValue = (key: string) =>
      (attrs.find((a: any) => a.attribute_catalog?.key === key)?.value_text ?? null);

    const roleKey = (roleResult.data as any)?.roles?.key ?? null;
    const onboardingCompleted = Boolean(getValue("full_name"));

    setProfile({
      full_name: getValue("full_name"),
      avatar_url: getValue("avatar_url"),
      phone: getValue("phone"),
      account_type: roleKey,
      onboarding_completed: onboardingCompleted,
    });
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

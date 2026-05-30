import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  phone_verified: boolean;
  country: string | null;
  city: string | null;
  account_type: string | null;
  onboarding_completed: boolean;
  business_description: string | null;
  business_name: string | null;
  mentor_topics: string | null;
  profession: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  accountType: string | null;
  onboardingCompleted: boolean;
  profileComplete: boolean;
  isGlobalDiaspora: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  accountType: null,
  onboardingCompleted: false,
  profileComplete: false,
  isGlobalDiaspora: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, phone, phone_verified, country, city, account_type, onboarding_completed, business_description, business_name, mentor_topics, profession")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data as Profile);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          // Defer profile fetch to avoid Supabase client deadlock
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const phone = profile?.phone ?? null;
  const isGlobalDiaspora = !!phone && !phone.replace(/\s|-/g, "").startsWith("+90") && !phone.replace(/\s|-/g, "").startsWith("0090");
  const profileComplete = !!(profile?.onboarding_completed && profile?.country && profile?.city && profile?.phone_verified);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      profile,
      accountType: profile?.account_type ?? null,
      onboardingCompleted: profile?.onboarding_completed ?? false,
      profileComplete,
      isGlobalDiaspora,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

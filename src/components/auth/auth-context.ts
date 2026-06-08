import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type Profile = {
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  account_type: string | null;
  onboarding_completed: boolean;
};

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  profile: Profile | null;
  accountType: string | null;
  onboardingCompleted: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

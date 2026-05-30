import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

type UntypedSupabaseClient = typeof supabase & {
  from: (table: string) => ReturnType<typeof supabase.from>;
};

export function getSupabaseBrowserClient(): UntypedSupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  return supabase as unknown as UntypedSupabaseClient;
}

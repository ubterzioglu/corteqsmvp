import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

/**
 * m89: Cadde feed için realtime dinleme — yeni paylaşım geldiğinde "Yeni paylaşımlar var" bildirimi göster.
 * Kullanıcı butona tıkladığında feedQuery.refetch() çağrılır.
 */
export function useCaddeFeedRealtime(enabled: boolean): { hasNewPosts: boolean; reset: () => void } {
  const [hasNewPosts, setHasNewPosts] = useState(false);

  useEffect(() => {
    if (!enabled || !supabase) return;

    const channel = supabase
      .channel("cadde-feed-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cadde_posts" },
        () => setHasNewPosts(true),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled]);

  const reset = () => setHasNewPosts(false);

  return { hasNewPosts, reset };
}

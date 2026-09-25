import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

/**
 * m90: Cadde yorumları için realtime dinleme — yeni yorum geldiğinde "Yeni yorumlar var" bildirimi göster.
 * Kullanıcı butona tıkladığında yorum listesi yenilenir.
 */
export function useCaddeCommentsRealtime(postId: string | null, enabled: boolean): {
  hasNewComments: boolean;
  reset: () => void;
} {
  const [hasNewComments, setHasNewComments] = useState(false);

  useEffect(() => {
    if (!enabled || !postId || !supabase) return;

    const channel = supabase
      .channel(`cadde-comments-realtime-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "cadde_post_comments",
          filter: `post_id=eq.${postId}`,
        },
        () => setHasNewComments(true),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [postId, enabled]);

  const reset = () => setHasNewComments(false);

  return { hasNewComments, reset };
}

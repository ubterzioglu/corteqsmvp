import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUnreadNotifications() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setCount(0);
        return;
      }
      const { count: c } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (mounted) setCount(c ?? 0);
    };
    load();
    const channel = supabase
      .channel("notifications-unread-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => load())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  return count;
}

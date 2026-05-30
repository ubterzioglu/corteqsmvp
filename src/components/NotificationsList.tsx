import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, UserPlus, Calendar, MessageSquare, Briefcase, Inbox, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean | null;
  created_at: string;
  related_id: string | null;
}

const iconFor = (type: string) => {
  if (type.includes("service_request") || type.includes("rfq") || type.includes("welcome_pack"))
    return { Icon: Briefcase, cls: "bg-primary/10 text-primary" };
  if (type.includes("event")) return { Icon: Calendar, cls: "bg-turquoise/10 text-turquoise" };
  if (type.includes("follow") || type.includes("user")) return { Icon: UserPlus, cls: "bg-gold/10 text-gold" };
  if (type.includes("whatsapp") || type.includes("join")) return { Icon: Inbox, cls: "bg-success/10 text-success" };
  return { Icon: MessageSquare, cls: "bg-muted text-muted-foreground" };
};

const NotificationsList = ({ accent = "primary" }: { accent?: "primary" | "gold" }) => {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data || []) as NotificationRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel("notifications-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    fetch();
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
        Yükleniyor...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className={`h-10 w-10 mx-auto mb-3 ${accent === "gold" ? "text-gold/40" : "text-primary/40"}`} />
        <p className="text-sm font-semibold text-foreground">Henüz bildiriminiz yok</p>
        <p className="text-xs text-muted-foreground mt-1">
          Yeni teklif talepleri, etkinlik güncellemeleri ve takip bildirimleri burada görünecek.
        </p>
      </div>
    );
  }

  const unread = items.filter((i) => !i.is_read).length;

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={markAllRead}>
            <CheckCheck className="h-3.5 w-3.5" /> Tümünü okundu işaretle
          </Button>
        </div>
      )}
      {items.map((n) => {
        const { Icon, cls } = iconFor(n.type);
        const time = formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: tr });
        return (
          <div
            key={n.id}
            className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
              n.is_read ? "bg-muted/30" : "bg-primary/5 border border-primary/20"
            } hover:bg-muted`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cls}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">{time}</p>
            </div>
            {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
          </div>
        );
      })}
    </div>
  );
};

export default NotificationsList;

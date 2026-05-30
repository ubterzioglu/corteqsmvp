import { useEffect, useState } from "react";
import { Bell, Check, X, Shield, Inbox, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useConnections } from "@/hooks/useConnections";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BlockUserDialog from "./BlockUserDialog";

interface NotifRow {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean | null;
  created_at: string;
  related_id: string | null;
}

interface RequesterProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const NotificationsPanel = () => {
  const { user } = useAuth();
  const { incomingPending, decide, refresh } = useConnections();
  const [notifs, setNotifs] = useState<NotifRow[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, RequesterProfile>>({});
  const [blockTarget, setBlockTarget] = useState<{ id: string; name: string } | null>(null);

  const loadNotifs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, message, is_read, created_at, related_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setNotifs(data as NotifRow[]);
  };

  useEffect(() => {
    loadNotifs();
  }, [user]);

  // Resolve requester profiles for incoming pending list
  useEffect(() => {
    const ids = Array.from(new Set(incomingPending.map((r) => r.requester_id)));
    if (!ids.length) return;
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", ids)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, RequesterProfile> = {};
        for (const p of data) map[p.id] = p as RequesterProfile;
        setProfilesById(map);
      });
  }, [incomingPending]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    loadNotifs();
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    loadNotifs();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary" /> Bağlantı İstekleri
            {incomingPending.length > 0 && (
              <Badge variant="secondary">{incomingPending.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {incomingPending.length === 0 ? (
            <p className="text-sm text-muted-foreground">Şu anda bekleyen bağlantı isteğin yok.</p>
          ) : (
            incomingPending.map((req) => {
              const p = profilesById[req.requester_id];
              return (
                <div key={req.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="h-10 w-10 rounded-full bg-muted overflow-hidden shrink-0">
                    {p?.avatar_url ? (
                      <img src={p.avatar_url} alt={p.full_name ?? "user"} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{p?.full_name ?? "Kullanıcı"}</p>
                    <p className="text-xs text-muted-foreground">Bağlantı isteği gönderdi · {new Date(req.created_at).toLocaleDateString("tr-TR")}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="default" className="gap-1" onClick={() => decide(req.id, "accepted")}>
                      <Check className="h-4 w-4" /> Kabul
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => decide(req.id, "declined")}>
                      <X className="h-4 w-4" /> Reddet
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-destructive"
                      onClick={() => setBlockTarget({ id: req.requester_id, name: p?.full_name ?? "Kullanıcı" })}
                    >
                      <Shield className="h-4 w-4" /> Blokla
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Bildirimler
          </CardTitle>
          {notifs.some((n) => !n.is_read) && (
            <Button size="sm" variant="outline" onClick={markAllRead}>Tümünü okundu işaretle</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {notifs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz bildirim yok.</p>
          ) : (
            notifs.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl border p-3 cursor-pointer transition ${n.is_read ? "border-border bg-card" : "border-primary/40 bg-primary/5"}`}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(n.created_at).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {blockTarget && (
        <BlockUserDialog
          open={!!blockTarget}
          onOpenChange={(o) => !o && setBlockTarget(null)}
          otherUserId={blockTarget.id}
          otherName={blockTarget.name}
          onBlocked={() => { setBlockTarget(null); refresh(); }}
        />
      )}
    </div>
  );
};

export default NotificationsPanel;

import { useEffect, useState } from "react";
import { Check, X, Shield, Inbox as InboxIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useConnections } from "@/hooks/useConnections";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BlockUserDialog from "./BlockUserDialog";

interface RequesterProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const ConnectionRequestsInline = () => {
  const { incomingPending, decide, refresh } = useConnections();
  const [profilesById, setProfilesById] = useState<Record<string, RequesterProfile>>({});
  const [blockTarget, setBlockTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const ids = Array.from(new Set(incomingPending.map((r) => r.requester_id)));
    if (!ids.length) {
      setProfilesById({});
      return;
    }
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

  if (incomingPending.length === 0) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <InboxIcon className="h-5 w-5 text-primary" /> Bağlantı İstekleri
          <Badge variant="secondary">{incomingPending.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {incomingPending.map((req) => {
          const p = profilesById[req.requester_id];
          const name = p?.full_name ?? "Kullanıcı";
          return (
            <div key={req.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="h-10 w-10 rounded-full bg-muted overflow-hidden shrink-0">
                {p?.avatar_url ? <img src={p.avatar_url} alt={name} className="h-full w-full object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{name}</p>
                <p className="text-xs text-muted-foreground">
                  Bağlantı isteği · {new Date(req.created_at).toLocaleDateString("tr-TR")}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Kabul edersen mesaj atabilir.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 shrink-0 justify-end">
                <Button size="sm" className="gap-1" onClick={() => decide(req.id, "accepted")}>
                  <Check className="h-4 w-4" /> Kabul
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => decide(req.id, "declined")}>
                  <X className="h-4 w-4" /> Reddet
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-destructive hover:text-destructive"
                  onClick={() => setBlockTarget({ id: req.requester_id, name })}
                >
                  <Shield className="h-4 w-4" /> Blokla
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
      {blockTarget && (
        <BlockUserDialog
          open={!!blockTarget}
          onOpenChange={(o) => !o && setBlockTarget(null)}
          otherUserId={blockTarget.id}
          otherName={blockTarget.name}
          onBlocked={() => { setBlockTarget(null); refresh(); }}
        />
      )}
    </Card>
  );
};

export default ConnectionRequestsInline;

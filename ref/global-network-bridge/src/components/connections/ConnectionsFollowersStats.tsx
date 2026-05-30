import { useEffect, useState } from "react";
import { Users, Heart, Shield, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useConnections } from "@/hooks/useConnections";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ConnectionsFollowersStats = () => {
  const { user } = useAuth();
  const { rows, acceptedConnections, unblock } = useConnections();
  const [followerCount, setFollowerCount] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", user.id)
      .then(({ count }) => setFollowerCount(count ?? 0));
  }, [user]);

  const blocked = rows.filter((r) => r.status === "blocked");

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
            <Users className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold leading-none">{acceptedConnections.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Bağlantı</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
            <Heart className="h-5 w-5 mx-auto text-rose-500 mb-1" />
            <p className="text-2xl font-bold leading-none">{followerCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Takipçi</p>
          </div>
        </div>

        {blocked.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-destructive" /> Bloklananlar ({blocked.length})
            </p>
            <div className="space-y-1.5">
              {blocked.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="truncate">
                      {b.recipient_id === user?.id ? "İstek gönderen" : "Bloklanan"} kullanıcı
                    </p>
                    {b.block_reason && (
                      <p className="text-muted-foreground truncate">Sebep: {b.block_reason}</p>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => unblock(b.id)}>
                    <X className="h-3 w-3" /> Bloku kaldır
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionsFollowersStats;

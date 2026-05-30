import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, ExternalLink, MessageSquare, MapPin, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  listAllSubmissions,
  setLandingStatus,
  deleteLanding,
  type LandingStatus,
  type WhatsAppLanding,
} from "@/lib/whatsappLandings";

type Row = WhatsAppLanding & { dbId: string };

const statusBadge: Record<LandingStatus, { label: string; cls: string }> = {
  pending: { label: "Bekliyor", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  approved: { label: "Onaylandı", cls: "bg-success/15 text-success border-success/30" },
  rejected: { label: "Reddedildi", cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

const WhatsAppLandingsModeration = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<LandingStatus>("pending");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (s: LandingStatus) => {
    setLoading(true);
    setRows(await listAllSubmissions(s));
    setLoading(false);
  };

  useEffect(() => { void load(tab); }, [tab]);

  const act = async (dbId: string, status: LandingStatus) => {
    try {
      await setLandingStatus(dbId, status);
      toast({ title: status === "approved" ? "Onaylandı" : "Reddedildi" });
      await load(tab);
    } catch (e) {
      toast({ title: "İşlem başarısız", description: String(e), variant: "destructive" });
    }
  };

  const remove = async (dbId: string) => {
    if (!confirm("Bu başvuruyu silmek istediğinden emin misin?")) return;
    try {
      await deleteLanding(dbId);
      toast({ title: "Silindi" });
      await load(tab);
    } catch (e) {
      toast({ title: "Silinemedi", description: String(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#25D366]" /> WhatsApp Grup Başvuruları
          </h2>
          <p className="text-sm text-muted-foreground">Kullanıcıların gönderdiği grup ve landing sayfalarını onayla.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(tab)} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Yenile
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as LandingStatus)}>
        <TabsList>
          <TabsTrigger value="pending">Bekleyen</TabsTrigger>
          <TabsTrigger value="approved">Onaylı</TabsTrigger>
          <TabsTrigger value="rejected">Reddedilen</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Yükleniyor...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Bu durumda kayıt yok.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rows.map((r) => (
                <div key={r.dbId} className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold leading-tight">{r.groupName}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {r.city}, {r.country}
                      </p>
                    </div>
                    <Badge className={statusBadge[r.status ?? "pending"].cls + " border"}>
                      {statusBadge[r.status ?? "pending"].label}
                    </Badge>
                  </div>

                  {r.tagline && <p className="text-sm text-foreground/80">{r.tagline}</p>}
                  {r.callToActionText && (
                    <p className="text-xs text-muted-foreground line-clamp-3">{r.callToActionText}</p>
                  )}

                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span className="px-2 py-0.5 rounded-full bg-muted">Kategori: {r.category}</span>
                    <span className="px-2 py-0.5 rounded-full bg-muted">Mod: {r.mode}</span>
                    {r.adminName && <span className="px-2 py-0.5 rounded-full bg-muted">Yönetici: {r.adminName}</span>}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                    <a href={r.whatsappLink} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" /> WhatsApp Linki
                      </Button>
                    </a>
                    <Link to={`/whatsapp-groups/${r.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" /> Landing Önizle
                      </Button>
                    </Link>
                    {r.status !== "approved" && (
                      <Button size="sm" className="gap-1.5 bg-success hover:bg-success/90 text-white" onClick={() => act(r.dbId, "approved")}>
                        <Check className="h-3.5 w-3.5" /> Onayla
                      </Button>
                    )}
                    {r.status !== "rejected" && (
                      <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => act(r.dbId, "rejected")}>
                        <X className="h-3.5 w-3.5" /> Reddet
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => remove(r.dbId)}>
                      <Trash2 className="h-3.5 w-3.5" /> Sil
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsAppLandingsModeration;

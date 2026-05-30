import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, X, Globe2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EmptyDashboardState from "@/components/EmptyDashboardState";

interface Appointment {
  id: string;
  client_name: string | null;
  client_email: string | null;
  client_timezone: string;
  scheduled_at: string;
  duration_minutes: number;
  topic: string | null;
  notes: string | null;
  status: string;
}

const statusStyles: Record<string, string> = {
  pending: "bg-gold/15 text-gold border-gold/30",
  confirmed: "bg-turquoise/15 text-turquoise border-turquoise/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  completed: "bg-success/15 text-success border-success/30",
};

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylı",
  cancelled: "İptal",
  completed: "Tamamlandı",
};

const AppointmentManagePanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("id,client_name,client_email,client_timezone,scheduled_at,duration_minutes,topic,notes,status")
      .eq("provider_id", user.id)
      .order("scheduled_at", { ascending: true });
    setItems((data as Appointment[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Güncellenemedi", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: status === "confirmed" ? "Randevu onaylandı" : "Randevu güncellendi" });
    load();
  };

  const myTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (loading) return <div className="text-sm text-muted-foreground">Yükleniyor...</div>;

  if (items.length === 0) {
    return (
      <EmptyDashboardState
        icon={Calendar}
        title="Henüz randevu talebi yok"
        description="Müşteriler profil kartınızdaki 'Randevu Talep Et' düğmesinden kendi saat dilimlerine göre randevu oluşturabilir. Talepler burada görünür ve onayladığınızda 'Seanslar' sekmesine düşer."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Globe2 className="h-3.5 w-3.5" /> Saatler kendi saat diliminize ({myTz}) göre gösterilir.
      </div>
      {items.map((a) => {
        const localDt = new Date(a.scheduled_at);
        const dateStr = localDt.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
        const timeStr = localDt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
        return (
          <div key={a.id} className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-center shrink-0 w-16">
              <div className="text-lg font-bold text-primary">{localDt.getDate()}</div>
              <div className="text-[11px] text-muted-foreground">{localDt.toLocaleDateString("tr-TR", { month: "short" })}</div>
              <div className="text-xs text-foreground font-semibold">{timeStr}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium text-foreground text-sm">{a.client_name || a.client_email || "Müşteri"}</span>
                <Badge className={`text-[10px] ${statusStyles[a.status] || ""}`}>{statusLabels[a.status] || a.status}</Badge>
                <span className="text-[11px] text-muted-foreground">· {a.duration_minutes} dk</span>
              </div>
              {a.topic && <p className="text-sm text-foreground mt-1">{a.topic}</p>}
              {a.notes && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.notes}</p>}
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <Globe2 className="h-3 w-3" /> Müşterinin saat dilimi: {a.client_timezone}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {a.status === "pending" && (
                <>
                  <Button size="sm" className="h-8 gap-1" onClick={() => updateStatus(a.id, "confirmed")}>
                    <CheckCircle className="h-3.5 w-3.5" /> Onayla
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 gap-1 text-destructive" onClick={() => updateStatus(a.id, "cancelled")}>
                    <X className="h-3.5 w-3.5" /> Reddet
                  </Button>
                </>
              )}
              {a.status === "confirmed" && (
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => updateStatus(a.id, "completed")}>
                  <Clock className="h-3.5 w-3.5" /> Tamamlandı
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AppointmentManagePanel;

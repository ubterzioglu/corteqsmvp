import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, PenLine, Video, Calendar, Inbox } from "lucide-react";
import { getDiasporaBlogLinksByAuthor } from "@/lib/diasporaBlogLinks";

interface Props {
  authorName: string;
}

const BloggerAnalytics = ({ authorName }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    blogLinks: 0,
    appointments: 0,
    confirmed: 0,
    events: 0,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const links = getDiasporaBlogLinksByAuthor(authorName);
      let appts = 0;
      let confirmed = 0;
      let events = 0;
      if (user) {
        const { count: a } = await supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", user.id);
        appts = a || 0;
        const { count: c } = await supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", user.id)
          .eq("status", "confirmed");
        confirmed = c || 0;
        const { count: e } = await supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        events = e || 0;
      }
      setStats({ blogLinks: links.length, appointments: appts, confirmed, events });
      setLoading(false);
    })();
  }, [user?.id, authorName]);

  const kpis = [
    { label: "Yayınlanan Blog Linki", value: stats.blogLinks, icon: PenLine, color: "text-primary" },
    { label: "Toplam Randevu Talebi", value: stats.appointments, icon: Video, color: "text-turquoise" },
    { label: "Onaylanan Randevu", value: stats.confirmed, icon: Video, color: "text-success" },
    { label: "Düzenlediğim Etkinlik", value: stats.events, icon: Calendar, color: "text-pink-500" },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
      <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" /> Performans Özeti
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Yüklediğiniz içerikler ve aldığınız randevular gerçek zamanlı olarak burada gösterilir.
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="border border-border rounded-xl p-4 text-center">
              <k.icon className={`h-4 w-4 ${k.color} mx-auto mb-1`} />
              <p className="text-2xl font-bold text-foreground">{k.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      )}
      {!loading && stats.blogLinks === 0 && stats.appointments === 0 && stats.events === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
          <Inbox className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Henüz veri yok</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            İçerik yükledikçe ve randevu aldıkça istatistikleriniz burada görünecek.
          </p>
        </div>
      )}
    </div>
  );
};

export default BloggerAnalytics;

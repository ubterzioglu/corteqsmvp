import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, Inbox } from "lucide-react";

interface Row { category: string; count: number; pct: number; }

const CategoryPerformance = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: cats } = await supabase
        .from("consultant_categories")
        .select("category")
        .eq("user_id", user.id);
      const categories = (cats || []).map((c) => c.category);
      if (categories.length === 0) { setRows([]); setLoading(false); return; }
      // Count open service_requests per category in the last 30 days
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const counts: Record<string, number> = {};
      for (const cat of categories) {
        const { count } = await supabase
          .from("service_requests")
          .select("id", { count: "exact", head: true })
          .eq("category", cat)
          .gte("created_at", since);
        counts[cat] = count || 0;
      }
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const rowsArr: Row[] = categories.map((cat) => ({
        category: cat,
        count: counts[cat],
        pct: total > 0 ? Math.round((counts[cat] / total) * 100) : 0,
      })).sort((a, b) => b.count - a.count);
      setRows(rowsArr);
      setLoading(false);
    })();
  }, [user?.id]);

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
      <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" /> Kategori Performansı
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Son 30 günde uzmanlık kategorilerinizde platforma düşen teklif talepleri.
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
          <Inbox className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Henüz kategori eklenmemiş</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Profil Ayarları → Uzmanlık Kategorileri'nden ekleyin. Talep geldikçe burada gerçek veri görünecek.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground font-medium">{r.category}</span>
                <span className="text-muted-foreground">{r.count} talep ({r.pct}%)</span>
              </div>
              <div className="bg-muted rounded-full h-2">
                <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${Math.max(r.pct, r.count > 0 ? 4 : 0)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPerformance;

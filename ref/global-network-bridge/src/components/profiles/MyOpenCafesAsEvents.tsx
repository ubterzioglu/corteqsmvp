import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Coffee, Clock, MapPin, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CafeRow {
  id: string;
  name: string;
  theme: string;
  city: string | null;
  country: string | null;
  opens_at: string;
  closes_at: string;
  member_count: number;
}

const MyOpenCafesAsEvents = () => {
  const { user } = useAuth();
  const [cafes, setCafes] = useState<CafeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("cafes")
        .select("id, name, theme, city, country, opens_at, closes_at, member_count")
        .eq("created_by", user.id)
        .gt("closes_at", new Date().toISOString())
        .order("opens_at", { ascending: false });
      if (!cancelled) {
        setCafes((data as any) || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (loading || cafes.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Coffee className="h-5 w-5 text-amber-600" />
        <h3 className="font-bold text-foreground">Cadde'de Açtığım Cafe'ler</h3>
        <Badge variant="outline" className="ml-auto text-[10px]">Etkinlik olarak sayılır</Badge>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {cafes.map((c) => (
          <Link
            key={c.id}
            to={`/cadde/${c.id}`}
            className="rounded-xl border border-border bg-card p-3 hover:border-amber-500/50 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start gap-2">
              <div className="text-2xl">☕</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate group-hover:text-amber-700">{c.name}</div>
                <div className="text-[11px] text-muted-foreground">{c.theme}</div>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                  {(c.city || c.country) && (
                    <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{[c.city, c.country].filter(Boolean).join(", ")}</span>
                  )}
                  <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{new Date(c.closes_at).toLocaleString("tr-TR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}'a kadar</span>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-amber-600 shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MyOpenCafesAsEvents;

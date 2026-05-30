import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Users } from "lucide-react";

interface CityCount {
  city: string;
  country: string;
  count: number;
}

/**
 * Şehir sayaçları — interest_registrations'tan canlı veri.
 * Diaspora Pasaportu kayıtları arttıkça otomatik dönmeye başlayacak.
 */
const HeroCityCounters = () => {
  const [cities, setCities] = useState<CityCount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("interest_registrations")
        .select("city, country")
        .not("city", "is", null);
      if (!active) return;
      if (error || !data) {
        setLoading(false);
        return;
      }
      const map = new Map<string, CityCount>();
      data.forEach((r: any) => {
        const city = (r.city || "").trim();
        const country = (r.country || "").trim();
        if (!city) return;
        const key = `${city}|${country}`;
        const cur = map.get(key);
        if (cur) cur.count++;
        else map.set(key, { city, country, count: 1 });
      });
      const arr = Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 6);
      setCities(arr);
      setTotal(data.length);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Demo placeholder when no data yet
  const display: CityCount[] = cities.length > 0
    ? cities
    : [
        { city: "Berlin", country: "Almanya", count: 0 },
        { city: "Londra", country: "İngiltere", count: 0 },
        { city: "Dubai", country: "BAE", count: 0 },
        { city: "New York", country: "ABD", count: 0 },
        { city: "Amsterdam", country: "Hollanda", count: 0 },
        { city: "Viyana", country: "Avusturya", count: 0 },
      ];

  return (
    <div className="mt-8 animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-turquoise" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Diaspora Pasaportu Sayaçları
        </span>
        {!loading && total > 0 && (
          <span className="text-[11px] text-muted-foreground">
            · {total} kayıt · {cities.length} şehir
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {display.map((c) => (
          <div
            key={`${c.city}-${c.country}`}
            className="bg-card/70 backdrop-blur-sm border border-border rounded-xl px-2.5 py-2 text-center hover:border-turquoise/40 transition-colors"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground truncate">
              <MapPin className="h-2.5 w-2.5 text-turquoise shrink-0" />
              <span className="truncate">{c.city}</span>
            </div>
            <div className="text-base font-bold text-foreground">{c.count}</div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 italic">
        Kayıtlar arttıkça şehirler ve sayaçlar gerçek zamanlı güncellenir.
      </p>
    </div>
  );
};

export default HeroCityCounters;

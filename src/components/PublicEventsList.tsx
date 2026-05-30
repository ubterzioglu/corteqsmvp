import { useEffect, useState } from "react";
import { Calendar, MapPin, ExternalLink, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import DemoTabPlaceholder from "@/components/DemoTabPlaceholder";

interface PublicEventsListProps {
  /** If provided, only events from this user_id are shown. Otherwise, all upcoming published events. */
  userId?: string;
  emptyLabel?: string;
}

interface EventRow {
  id: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string | null;
  city: string | null;
  country: string | null;
  location: string | null;
  online_url: string | null;
  type: string;
  category: string;
  cover_image: string | null;
  registration_url: string | null;
  price: number | null;
  max_attendees: number | null;
}

const PublicEventsList = ({ userId, emptyLabel = "Henüz yayınlanmış etkinlik yok." }: PublicEventsListProps) => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let q = supabase
        .from("events")
        .select("id,title,description,event_date,start_time,city,country,location,online_url,type,category,cover_image,registration_url,price,max_attendees")
        .eq("status", "published")
        .gte("event_date", new Date().toISOString().slice(0, 10))
        .order("event_date", { ascending: true })
        .limit(20);
      if (userId) q = q.eq("user_id", userId);
      const { data, error } = await q;
      if (!cancelled && !error && data) setEvents(data as EventRow[]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Yükleniyor…</p>;
  }
  if (events.length === 0) {
    return <DemoTabPlaceholder label={emptyLabel} />;
  }

  return (
    <div className="space-y-3">
      {events.map((ev) => {
        const dt = new Date(ev.event_date);
        const day = String(dt.getDate()).padStart(2, "0");
        const mon = dt.toLocaleString("tr-TR", { month: "short" });
        return (
          <div key={ev.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
            <div className="flex sm:flex-col items-center gap-3 sm:w-16 shrink-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary leading-none">{day}</div>
                <div className="text-xs text-muted-foreground uppercase">{mon}</div>
              </div>
              {ev.start_time && (
                <Badge variant="outline" className="text-[10px] gap-1 sm:mt-1">
                  <Clock className="h-2.5 w-2.5" /> {ev.start_time.slice(0, 5)}
                </Badge>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">{ev.title}</h3>
                <Badge variant="secondary" className="text-[10px]">{ev.category}</Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{ev.description}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                {(ev.city || ev.country) && (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{[ev.city, ev.country].filter(Boolean).join(", ")}</span>
                )}
                {ev.max_attendees && (
                  <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{ev.max_attendees} kişi</span>
                )}
                {ev.price ? <span className="font-medium text-foreground">€{ev.price}</span> : <span className="text-success font-medium">Ücretsiz</span>}
              </div>
            </div>
            <div className="flex sm:flex-col gap-2 shrink-0">
              {ev.registration_url ? (
                <a href={ev.registration_url} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
                  <Button size="sm" className="w-full gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Kayıt Ol</Button>
                </a>
              ) : ev.online_url ? (
                <a href={ev.online_url} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
                  <Button size="sm" variant="outline" className="w-full gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Katıl</Button>
                </a>
              ) : (
                <Button size="sm" variant="outline" disabled className="gap-1.5"><Calendar className="h-3.5 w-3.5" /> RSVP yok</Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PublicEventsList;

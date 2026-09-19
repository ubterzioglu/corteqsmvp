import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Monitor, Users, Search, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePublishedEvents } from "@/hooks/use-events";
import { useSeo } from "@/lib/seo";
import { useAuth } from "@/components/auth/useAuth";
import { GENERIC_FEATURE_KEYS } from "@/lib/features";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { EventsHero } from "@/components/events/EventsHero";
import { CreateEventFormSection } from "@/components/events/CreateEventFormSection";

const CATEGORIES = [
  { value: "all", label: "Tüm Kategoriler" },
  { value: "networking", label: "Networking" },
  { value: "eğitim", label: "Eğitim" },
  { value: "kültür", label: "Kültür & Sanat" },
  { value: "iş", label: "İş & Kariyer" },
  { value: "sosyal", label: "Sosyal" },
  { value: "spor", label: "Spor" },
];

const EVENT_TYPES = [
  { value: "all", label: "Tüm Türler" },
  { value: "yüz yüze", label: "Fiziksel" },
  { value: "online", label: "Dijital" },
  { value: "hybrid", label: "Hibrit" },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function typeBadgeVariant(type: string): "default" | "secondary" | "outline" {
  if (type === "online") return "secondary";
  if (type === "hybrid") return "outline";
  return "default";
}

function typeLabel(type: string): string {
  if (type === "online") return "Dijital";
  if (type === "hybrid") return "Hibrit";
  return "Fiziksel";
}

export default function EventsPage() {
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatureFlags(true);
  const canCreate = isFeatureEnabled(GENERIC_FEATURE_KEYS.eventsCreate);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [eventFormOpen, setEventFormOpen] = useState(false);

  const filters = useMemo(() => ({
    type: typeFilter !== "all" ? typeFilter : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    search: search || undefined,
  }), [typeFilter, categoryFilter, search]);

  const { data: events, isLoading, error } = usePublishedEvents(filters);

  useSeo({
    title: "Etkinlikler | CorteQS",
    description: "Diaspora topluluğunun fiziksel ve dijital etkinliklerini keşfedin.",
    canonicalPath: "/events",
  });

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdf9_0%,#f9fafb_100%)]">
      <main className="container mx-auto px-4 pb-16 pt-6">
        <EventsHero />

        {canCreate && (
          <CreateEventFormSection
            open={eventFormOpen}
            onOpenChange={setEventFormOpen}
          />
        )}

        <section className="mt-8">
          <div className="mt-5">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Etkinlikler</h2>
            </div>
          </div>

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Etkinlik ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Tür" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && <p className="text-sm text-slate-600">Yükleniyor...</p>}
        {error && <p className="text-sm text-red-600">Etkinlikler yüklenemedi.</p>}

        {!isLoading && !error && events && events.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-700">Henüz etkinlik yok</h3>
            <p className="mt-1 text-sm text-slate-500">
              Filtreleri değiştirmeyi deneyin veya ilk etkinliği oluşturun.
            </p>
          </div>
        )}

        {events && events.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} to={`/events/${event.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  {event.cover_image && (
                    <div className="h-40 w-full overflow-hidden rounded-t-lg">
                      <img
                        src={event.cover_image}
                        alt={event.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className={event.cover_image ? "p-4" : "p-4 pt-4"}>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant={typeBadgeVariant(event.type)}>{typeLabel(event.type)}</Badge>
                      {event.featured && (
                        <Badge variant="outline" className="border-amber-400 text-amber-600">
                          Öne Çıkan
                        </Badge>
                      )}
                    </div>
                    <h3 className="mb-1 text-lg font-semibold leading-tight text-slate-900 line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="mb-3 text-sm text-slate-600 line-clamp-2">{event.description}</p>
                    <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(event.event_date)}</span>
                        {event.start_time && (
                          <span className="text-slate-400">• {event.start_time.slice(0, 5)}</span>
                        )}
                      </div>
                      {(event.type === "yüz yüze" || event.type === "hybrid") && event.city && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{event.city}{event.country ? `, ${event.country}` : ""}</span>
                        </div>
                      )}
                      {(event.type === "online" || event.type === "hybrid") && (
                        <div className="flex items-center gap-1.5">
                          <Monitor className="h-3.5 w-3.5" />
                          <span>Online katılım mevcut</span>
                        </div>
                      )}
                      {event.max_attendees && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          <span>Maks. {event.max_attendees} katılımcı</span>
                        </div>
                      )}
                      {event.tags && event.tags.length > 0 && (
                        <div className="mt-1 flex items-center gap-1 flex-wrap">
                          <Tag className="h-3 w-3" />
                          {event.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  </div>
);
}

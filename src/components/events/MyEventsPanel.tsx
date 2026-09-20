import { Link } from "react-router-dom";
import { Calendar, CalendarPlus, Clock, MapPin, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/auth/useAuth";
import { useMyEvents } from "@/hooks/use-events";
import type { EventRow } from "@/lib/events-api";
import {
  eventStatusHint,
  eventStatusLabel,
  eventStatusTone,
  eventTypeLabel,
  isOnlineEventType,
  isPhysicalEventType,
} from "@/lib/events-vocabulary";
import { describeEventSchedule, formatEventDate, resolveViewerTimezone } from "@/lib/events-timezone";
import { buildEventShareUrl } from "@/lib/event-share";
import { EventShareButtons } from "@/components/events/EventShareButtons";

/**
 * Üyenin KENDİ oluşturduğu etkinlikler.
 *
 * NEDEN VAR: `useMyEvents` hook'u aylardır yazılıydı ama HİÇBİR YERDEN
 * çağrılmıyordu — ölü koddu. Sonuç: üye etkinliğini gönderiyor, kayıt
 * `status: "pending"` olarak düşüyor ve o andan sonra üye kendi etkinliğini
 * hiçbir ekranda göremiyor, onaylandı mı reddedildi mi bilemiyordu. Panelin
 * asıl işi listelemek değil, DURUMU göstermektir.
 *
 * RLS tarafı hazırdı: `events` üzerinde "Users can view own events"
 * (`auth.uid() = user_id`) politikası zaten vardı, bu yüzden onay bekleyen
 * kayıtlar da okunur ve sahibi kendi detay sayfasını açabilir.
 */
function MyEventCard({ event, viewerTimezone }: { event: EventRow; viewerTimezone: string }) {
  const schedule = describeEventSchedule({
    eventDate: event.event_date,
    startTime: event.start_time,
    endTime: event.end_time,
    eventTimezone: event.timezone,
    viewerTimezone,
  });

  const shareUrl = typeof window !== "undefined" ? buildEventShareUrl(event.id, window.location.origin) : "";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/events/${event.id}`}
              className="text-base font-semibold leading-tight text-slate-900 hover:underline"
            >
              {event.title}
            </Link>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${eventStatusTone(event.status)}`}
              >
                {eventStatusLabel(event.status)}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {eventTypeLabel(event.type)}
              </span>
            </div>
          </div>
          {/* Onay beklerken paylaşmak anlamsız: bağlantıyı açan başkası
              "Etkinlik bulunamadı" görür (RLS yalnız sahibine gösterir). */}
          {event.status === "published" && (
            <EventShareButtons
              variant="compact"
              share={{ title: event.title, description: event.description, url: shareUrl }}
            />
          )}
        </div>

        <p className="mt-2 text-xs text-slate-500">{eventStatusHint(event.status)}</p>

        <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatEventDate(event.event_date, { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          {schedule && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                {schedule.sourceRange}
                {schedule.sourceLabel ? ` · ${schedule.sourceLabel} saatiyle` : ""}
              </span>
            </div>
          )}
          {isPhysicalEventType(event.type) && event.city && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>
                {event.city}
                {event.country ? `, ${event.country}` : ""}
              </span>
            </div>
          )}
          {isOnlineEventType(event.type) && (
            <div className="flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5 shrink-0" />
              <span>Online katılım</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MyEventsPanel() {
  const { user } = useAuth();
  const { data: events, isLoading, error } = useMyEvents(user?.id);
  const viewerTimezone = resolveViewerTimezone();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">Etkinliklerim</h3>
          <p className="text-sm text-muted-foreground">
            Oluşturduğun etkinlikler ve yayın durumları.
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0 gap-1.5">
          <Link to="/events">
            <CalendarPlus className="h-4 w-4" /> Yeni Etkinlik
          </Link>
        </Button>
      </div>

      {isLoading && <p className="text-sm text-slate-600">Yükleniyor...</p>}
      {error && <p className="text-sm text-red-600">Etkinliklerin yüklenemedi.</p>}

      {!isLoading && !error && events && events.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <h4 className="text-base font-semibold text-slate-700">Henüz etkinlik oluşturmadın</h4>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Etkinlikler sayfasından bir etkinlik ekleyebilirsin. Gönderdiğin etkinlik yönetici
            onayından sonra listede yayınlanır; onay sürecini buradan takip edersin.
          </p>
          <Button asChild className="mt-4 gap-1.5">
            <Link to="/events">
              <CalendarPlus className="h-4 w-4" /> Etkinlik Oluştur
            </Link>
          </Button>
        </div>
      )}

      {events && events.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {events.map((event) => (
            <MyEventCard key={event.id} event={event} viewerTimezone={viewerTimezone} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyEventsPanel;

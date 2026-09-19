import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, MapPin, Monitor, Users, Globe, ExternalLink, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEvent } from "@/hooks/use-events";
import { useSeo } from "@/lib/seo";
import { useToast } from "@/hooks/use-toast";
import { eventTypeLabel, isOnlineEventType, isPhysicalEventType } from "@/lib/events-vocabulary";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
}

function typeBadgeVariant(type: string): "default" | "secondary" | "outline" {
  if (type === "online") return "secondary";
  if (type === "hybrid") return "outline";
  return "default";
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading, error } = useEvent(id ?? "");
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const eventUrl = typeof window !== "undefined" ? window.location.href : "";
  const eventTitle = event ? event.title : "";
  const eventDescription = event ? event.description.slice(0, 200) : "";

  useSeo(
    event
      ? {
          title: `${event.title} | CorteQS Etkinlikler`,
          description: event.description.slice(0, 160),
          canonicalPath: `/events/${event.id}`,
          ogImage: event.cover_image || undefined,
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "Event",
            name: event.title,
            description: event.description,
            startDate: event.event_date,
            eventAttendanceMode: event.type === "online" ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
            location: event.location ? {
              "@type": "Place",
              name: event.location,
              address: {
                "@type": "PostalAddress",
                addressLocality: event.city,
                addressCountry: event.country,
              },
            } : undefined,
            organizer: event.organizer_name ? {
              "@type": "Organization",
              name: event.organizer_name,
            } : undefined,
          },
        }
      : { canonicalPath: `/events/${id}`, robots: "noindex, follow" },
    [event?.id],
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      toast({ title: "Bağlantı kopyalandı" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Kopyalanamadı", variant: "destructive" });
    }
  };

  const shareText = `${eventTitle}\n${eventDescription}`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(eventUrl);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-slate-600">Yükleniyor...</p>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-3xl pt-24 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Etkinlik bulunamadı</h1>
          <Link to="/events" className="text-primary hover:underline">← Etkinliklere dön</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf9_0%,#f8fafc_100%)] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link to="/events" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Etkinliklere dön
        </Link>

        {event.cover_image && (
          <div className="mb-6 h-56 w-full overflow-hidden rounded-xl md:h-72">
            <img src={event.cover_image} alt={event.title} className="h-full w-full object-cover" />
          </div>
        )}

        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant={typeBadgeVariant(event.type)}>{eventTypeLabel(event.type)}</Badge>
              {event.featured && (
                <Badge variant="outline" className="border-amber-400 text-amber-600">Öne Çıkan</Badge>
              )}
              <Badge variant="outline">{event.category}</Badge>
            </div>

            <h1 className="mb-2 text-2xl font-black text-slate-900 md:text-3xl">{event.title}</h1>

            {event.organizer_name && (
              <p className="mb-4 text-sm text-slate-500">
                Düzenleyen: <span className="font-medium text-slate-700">{event.organizer_name}</span>
                {event.organizer_type && <span className="text-slate-400"> · {event.organizer_type}</span>}
              </p>
            )}

            <div className="mb-6 space-y-3 rounded-lg bg-slate-50 p-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{formatDate(event.event_date)}</span>
              </div>
              {(event.start_time || event.end_time) && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>
                    {formatTime(event.start_time)}
                    {event.end_time ? ` – ${formatTime(event.end_time)}` : ""}
                  </span>
                </div>
              )}
              {isPhysicalEventType(event.type) && event.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>
                    {event.location}
                    {event.city ? `, ${event.city}` : ""}
                    {event.country ? `, ${event.country}` : ""}
                  </span>
                </div>
              )}
              {isOnlineEventType(event.type) && event.online_url && (
                <div className="flex items-center gap-3 text-sm">
                  <Monitor className="h-4 w-4 text-slate-400" />
                  <a
                    href={event.online_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Online katılım bağlantısı <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {event.max_attendees && (
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>Maks. {event.max_attendees} katılımcı</span>
                </div>
              )}
              {event.price != null && event.price > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium">{event.price} EUR</span>
                </div>
              )}
              {event.registration_url && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Kayıt sayfası <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold text-slate-800">Açıklama</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{event.description}</p>
            </div>

            {event.tags && event.tags.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Share2 className="h-4 w-4" /> Paylaş
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, "_blank")}
                >
                  X / Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`, "_blank")}
                >
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, "_blank")}
                >
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`, "_blank")}
                >
                  WhatsApp
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                  {copied ? "Kopyalandı" : "Bağlantı Kopyala"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

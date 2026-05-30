import { useFollow } from "@/hooks/useFollow";
import { useParams, Link } from "react-router-dom";
import {
  Calendar, MapPin, Users, Clock, ArrowLeft, Globe,
  Share2, Ticket, User, MessageSquare, ExternalLink, UserPlus, Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import EventBoostDialog from "@/components/EventBoostDialog";
import { events } from "@/data/mock";
import { useToast } from "@/hooks/use-toast";

const categoryColors: Record<string, string> = {
  networking: "bg-turquoise/10 text-turquoise",
  eğitim: "bg-primary/10 text-primary",
  kültür: "bg-purple-500/10 text-purple-600",
  iş: "bg-gold/10 text-gold",
  sosyal: "bg-pink-500/10 text-pink-600",
  spor: "bg-success/10 text-success",
};

const categoryLabels: Record<string, string> = {
  networking: "Networking", eğitim: "Eğitim", kültür: "Kültür",
  iş: "İş & Kariyer", sosyal: "Sosyal", spor: "Spor",
};

const typeLabels: Record<string, string> = {
  online: "🌐 Online", "yüz yüze": "📍 Yüz yüze", hybrid: "🔄 Hybrid",
};

const EventDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { isFollowed, toggle } = useFollow();
  const event = events.find((e) => e.id === id);
  const isFollowing = event ? isFollowed("organizer", event.id) : false;
  const isEventFollowed = event ? isFollowed("event", event.id) : false;
  const isJoined = event ? isFollowed("event-joined", event.id) : false;

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center py-20">
            <p className="text-muted-foreground">Etkinlik bulunamadı.</p>
            <Link to="/events"><Button variant="outline" className="mt-4">← Etkinliklere Dön</Button></Link>
          </div>
        </main>
      </div>
    );
  }

  const capacityPercent = Math.round((event.attendees / event.maxAttendees) * 100);

  const handleJoin = () => {
    if (!isJoined) toggle("event-joined", event.id, event.title);
    toast({ title: "Katılım onaylandı! 🎉", description: `${event.title} takvimine eklendi.` });
  };

  const similarEvents = events
    .filter((e) => e.id !== event.id && e.tags.some((t) => event.tags.includes(t)))
    .slice(0, 3);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link kopyalandı!", description: "Etkinlik linkini paylaşabilirsiniz." });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Etkinlikler
          </Link>

          {/* Hero Image */}
          <div className="relative rounded-2xl overflow-hidden mb-8 h-64 md:h-80">
            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute top-4 left-4 flex gap-2">
              {event.featured && <Badge className="bg-gold/90 text-white border-0">⭐ Featured</Badge>}
              <Badge className={`border-0 ${categoryColors[event.category]}`}>{categoryLabels[event.category]}</Badge>
              <Badge variant="outline" className="bg-white/10 text-white border-white/20">{typeLabels[event.type]}</Badge>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {event.date}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {event.time} - {event.endTime}</span>
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.location}, {event.city}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-4">Etkinlik Hakkında</h2>
                <p className="text-muted-foreground font-body leading-relaxed">{event.description}</p>
                <div className="flex flex-wrap gap-2 mt-6">
                  {event.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>

              {/* Organizer */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-4">Organizatör</h2>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {event.organizerAvatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{event.organizer}</h3>
                    <p className="text-sm text-muted-foreground font-body capitalize">{event.organizerType === "consultant" ? "Danışman" : event.organizerType === "association" ? "Dernek / Vakıf" : "Platform Üyesi"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={isFollowing ? "secondary" : "default"}
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        toggle("organizer", event.id, event.organizer);
                      }}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      {isFollowing ? "Takipte" : "Takip Et"}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> Mesaj
                    </Button>
                  </div>
                </div>
              </div>

              {/* Similar Events */}
              {similarEvents.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <h2 className="text-xl font-bold text-foreground mb-4">Benzer Etkinlikler</h2>
                  <div className="space-y-3">
                    {similarEvents.map((se) => (
                      <Link
                        key={se.id}
                        to={`/events/${se.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors"
                      >
                        <img src={se.image} alt={se.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground text-sm truncate">{se.title}</p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-2 mt-0.5">
                            <Calendar className="h-3 w-3" /> {se.date} · {se.city}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {se.tags.filter((t) => event.tags.includes(t)).slice(0, 2).map((t) => (
                              <Badge key={t} variant="secondary" className="text-[10px] h-4 px-1.5">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-6">
              {/* Join card */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card sticky top-24">
                <div className="text-center mb-6">
                  {event.price === 0 ? (
                    <p className="text-3xl font-bold text-success">Ücretsiz</p>
                  ) : (
                    <p className="text-3xl font-bold text-foreground">€{event.price}</p>
                  )}
                  <p className="text-sm text-muted-foreground font-body mt-1">kişi başı</p>
                </div>

                <Button className="w-full gap-2 mb-3" size="lg" onClick={handleJoin}>
                  <Ticket className="h-5 w-5" /> Etkinliğe Katıl
                </Button>

                <Button
                  variant={isEventFollowed ? "secondary" : "outline"}
                  className="w-full gap-2 mb-3"
                  onClick={() => toggle("event", event.id, event.title)}
                >
                  <UserPlus className="h-4 w-4" />
                  {isEventFollowed ? "Etkinlik Takipte" : "Etkinliği Takip Et"}
                </Button>

                <EventBoostDialog eventTitle={event.title} eventCategory={event.category} eventCountry={event.country} />

                <Button variant="outline" className="w-full gap-2 mb-6 mt-3" onClick={handleShare}>
                  <Share2 className="h-4 w-4" /> Paylaş
                </Button>

                {/* Capacity */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground font-body flex items-center gap-1"><Users className="h-4 w-4" /> Katılımcı</span>
                    <span className="font-semibold text-foreground">{event.attendees}/{event.maxAttendees}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${capacityPercent > 80 ? "bg-destructive" : "bg-turquoise"}`}
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </div>
                  {capacityPercent > 80 && (
                    <p className="text-xs text-destructive mt-1">Son birkaç yer kaldı!</p>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{event.date}</p>
                      <p className="text-muted-foreground font-body">{event.time} - {event.endTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{event.location}</p>
                      <p className="text-muted-foreground font-body">{event.city}, {event.country}</p>
                    </div>
                  </div>
                  {event.type !== "online" && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location + ', ' + event.city + ', ' + event.country)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="w-full gap-1.5 mt-1">
                        <MapPin className="h-3.5 w-3.5" /> Haritada Göster
                      </Button>
                    </a>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-4 w-4 text-primary shrink-0" />
                    <p className="font-medium text-foreground">{typeLabels[event.type]}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventDetail;

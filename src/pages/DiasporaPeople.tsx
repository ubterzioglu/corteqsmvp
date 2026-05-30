import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Users, Sparkles, MapPin, Coffee, Calendar, MessageSquare, ShieldCheck, Plane, Briefcase, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DiasporaPeopleSearch from "@/components/feed/DiasporaPeopleSearch";

interface MockUser {
  id: string;
  name: string;
  initials: string;
  photo: string;
  tagline: string;
  worldMessage: string;
  city: string;
  country: string;
  followers: number;
  following: number;
  passport: boolean;
  inCadde: boolean;
  cafeName?: string;
  jobSeeking?: boolean;
  relocating?: { city: string; country: string };
  recentEvents: Array<{ title: string; date: string; type: "joined" | "followed" }>;
}

const MOCK_USERS: MockUser[] = [
  {
    id: "u1",
    name: "Berk Kural",
    initials: "BK",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    tagline: "Berlin'de fullstack geliştirici, açık kaynağa katkı",
    worldMessage: "Diasporadaki yazılımcılarla bağ kuralım — birlikte daha güçlüyüz.",
    city: "Berlin",
    country: "Almanya",
    followers: 142,
    following: 87,
    passport: true,
    inCadde: true,
    cafeName: "Berlin IT Cafe",
    jobSeeking: false,
    recentEvents: [
      { title: "Berlin Türk Devs Meetup", date: "8 May", type: "joined" },
    ],
  },
  {
    id: "u2",
    name: "Ayşe Demir",
    initials: "AD",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    tagline: "Londra'da pazarlama uzmanı, yeni fırsatlara açık",
    worldMessage: "Kariyer geçişimde mentor arıyorum 💪",
    city: "Londra",
    country: "İngiltere",
    followers: 98,
    following: 132,
    passport: true,
    inCadde: false,
    jobSeeking: true,
    recentEvents: [
      { title: "Londra Diaspora Brunch", date: "29 Nis", type: "joined" },
    ],
  },
  {
    id: "u3",
    name: "Mehmet Yıldız",
    initials: "MY",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    tagline: "Yakında Amsterdam'a taşınıyorum 🇳🇱",
    worldMessage: "Amsterdam'da daire ve okul önerilerine açığım, teşekkürler!",
    city: "İstanbul",
    country: "Türkiye",
    followers: 54,
    following: 67,
    passport: false,
    inCadde: true,
    cafeName: "Relocation Amsterdam",
    relocating: { city: "Amsterdam", country: "Hollanda" },
    recentEvents: [
      { title: "Hollanda Vize Webinar", date: "5 May", type: "joined" },
    ],
  },
  {
    id: "u4",
    name: "Selin Aktaş",
    initials: "SA",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    tagline: "New York'ta sanat tarihçisi & blogger",
    worldMessage: "Galeri açılışı için NY'deki Türklerle buluşmak isterim.",
    city: "New York",
    country: "ABD",
    followers: 312,
    following: 201,
    passport: true,
    inCadde: false,
    recentEvents: [
      { title: "NY Sanat Türk Buluşma", date: "30 Nis", type: "joined" },
    ],
  },
];

const UserCard = ({ u }: { u: MockUser }) => (
  <div className="bg-card rounded-xl border border-border p-3 shadow-card hover:shadow-card-hover transition-shadow">
    <div className="flex items-start gap-2.5">
      <div className="relative shrink-0">
        <img src={u.photo} alt={u.name} className="w-12 h-12 rounded-xl object-cover" />
        {u.inCadde && (
          <span
            title="Şu an Cadde'de"
            className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <h3 className="text-sm font-bold truncate">{u.name}</h3>
          {u.passport && (
            <Badge className="gap-0.5 bg-amber-500/15 text-amber-700 border-amber-500/30 text-[9px] px-1 py-0">
              <ShieldCheck className="h-2.5 w-2.5" /> Pasaport
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground italic line-clamp-1 mt-0.5">"{u.tagline}"</p>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" /> <strong className="text-foreground">{u.followers}</strong></span>
          <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" /> <strong className="text-foreground">{u.following}</strong></span>
          <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> {u.city}</span>
        </div>
      </div>
    </div>

    <div className="flex flex-wrap gap-1 mt-2">
      {u.inCadde && (
        <Badge className="gap-1 bg-emerald-500 text-white border-emerald-600 text-[9px] px-1.5 py-0">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Şu an Cadde'de
        </Badge>
      )}
      {u.jobSeeking && (
        <Badge className="gap-0.5 bg-turquoise/15 text-turquoise border-turquoise/30 text-[9px] px-1 py-0">
          <Briefcase className="h-2.5 w-2.5" /> İş Arıyor
        </Badge>
      )}
      {u.relocating && (
        <Badge className="gap-0.5 bg-amber-500/15 text-amber-700 border-amber-500/30 text-[9px] px-1 py-0">
          <Plane className="h-2.5 w-2.5" /> {u.relocating.city}
        </Badge>
      )}
    </div>

    <div className="mt-2 rounded-md border border-border bg-muted/30 px-2 py-1.5 text-[11px] line-clamp-2">
      {u.worldMessage}
    </div>

    <div className="mt-2 border-t border-border pt-2">
      <ul className="space-y-0.5">
        {u.recentEvents.map((e, i) => (
          <li key={i} className="text-[10px] flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5 text-primary" />
            <span className="truncate">{e.title}</span>
            <span className="text-muted-foreground ml-auto">{e.date}</span>
          </li>
        ))}
      </ul>
    </div>

    <div className="flex gap-1.5 mt-2">
      <Button variant="outline" size="sm" className="flex-1 gap-1 h-7 text-[11px]">
        <MessageSquare className="h-3 w-3" /> Mesaj
      </Button>
      <Button variant="default" size="sm" className="flex-1 h-7 text-[11px]">Profili Gör</Button>
    </div>
  </div>
);

const DiasporaPeople = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="h-2 w-full bg-gradient-to-r from-sky-500 via-violet-500 to-rose-500" />
      </div>

      <main className="pt-6 pb-16">
        <div className="container mx-auto px-4">
          {/* Search panel — moved to top */}
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-5 shadow-card mb-6">
            <DiasporaPeopleSearch />
          </div>

          {/* Hero */}
          <header className="mb-6 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 text-xs font-semibold mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Diaspora Topluluğu
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center justify-center gap-2">
              <Users className="h-7 w-7 text-sky-500" /> Diasporada İnsanlar
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Dünyanın her yerindeki diaspora üyelerini keşfet — filtrele, mesaj at, takip et.
            </p>
          </header>

          {/* Featured mock individual cards */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3 max-w-5xl mx-auto">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" /> Öne Çıkan Üyeler
              </h2>
              <Link to="/cadde" className="text-xs text-primary font-semibold hover:underline">
                Cadde akışında gör →
              </Link>
            </div>
            <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {MOCK_USERS.map((u) => <UserCard key={u.id} u={u} />)}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DiasporaPeople;

import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import {
  Users, Sparkles, MapPin, Coffee, Calendar,
  MessageSquare, ShieldCheck, Plane, Briefcase, Heart, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DiasporaPeopleSearch from "@/components/feed/DiasporaPeopleSearch";
import { useIndividualDirectory, type DirectoryProfile } from "@/hooks/useIndividualDirectory";

const ProfileCard = ({ p }: { p: DirectoryProfile }) => {
  const initials = p.displayName.slice(0, 2).toUpperCase();
  const city = p.activeCity !== "-" ? p.activeCity : null;
  const country = p.activeCountry !== "-" ? p.activeCountry : null;

  return (
    <div className="bg-card rounded-xl border border-border p-3 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start gap-2.5">
        <div className="shrink-0">
          {p.profileImageUrl ? (
            <img
              src={p.profileImageUrl}
              alt={p.displayName}
              className="w-12 h-12 rounded-xl object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
              {initials}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <h3 className="text-sm font-bold truncate">{p.displayName}</h3>
            {p.corteqsPassport && (
              <Badge className="gap-0.5 bg-amber-500/15 text-amber-700 border-amber-500/30 text-[9px] px-1 py-0">
                <ShieldCheck className="h-2.5 w-2.5" /> Pasaport
              </Badge>
            )}
          </div>
          {p.tagline && (
            <p className="text-[11px] text-muted-foreground italic line-clamp-1 mt-0.5">"{p.tagline}"</p>
          )}
          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Users className="h-2.5 w-2.5" />
              <strong className="text-foreground">{p.followerCount}</strong>
            </span>
            <span className="flex items-center gap-0.5">
              <Heart className="h-2.5 w-2.5" />
              <strong className="text-foreground">{p.followingCount}</strong>
            </span>
            {(city || country) && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5" /> {[city, country].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mt-2">
        {p.jobSeeking && (
          <Badge className="gap-0.5 bg-turquoise/15 text-turquoise border-turquoise/30 text-[9px] px-1 py-0">
            <Briefcase className="h-2.5 w-2.5" /> İş Arıyor
          </Badge>
        )}
        {p.relocation && (p.relocation.city || p.relocation.country) && (
          <Badge className="gap-0.5 bg-amber-500/15 text-amber-700 border-amber-500/30 text-[9px] px-1 py-0">
            <Plane className="h-2.5 w-2.5" /> {p.relocation.city || p.relocation.country}
          </Badge>
        )}
      </div>

      {p.worldMessage && (
        <div className="mt-2 rounded-md border border-border bg-muted/30 px-2 py-1.5 text-[11px] line-clamp-2">
          {p.worldMessage}
        </div>
      )}

      {p.recentEvents.length > 0 && (
        <div className="mt-2 border-t border-border pt-2">
          <ul className="space-y-0.5">
            {p.recentEvents.slice(0, 2).map((e) => (
              <li key={`${e.title}-${e.date}`} className="text-[10px] flex items-center gap-1">
                <Calendar className="h-2.5 w-2.5 text-primary" />
                <span className="truncate">{e.title}</span>
                {e.date && <span className="text-muted-foreground ml-auto">{e.date}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-1.5 mt-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1 h-7 text-[11px]" disabled>
          <MessageSquare className="h-3 w-3" /> Mesaj
        </Button>
        <Button asChild variant="default" size="sm" className="flex-1 h-7 text-[11px]">
          <Link to={`/directory/profile/${p.userId}`}>Profili Gör</Link>
        </Button>
      </div>
    </div>
  );
};

const DiasporaPeople = () => {
  const { profiles, isLoading, errorMessage } = useIndividualDirectory(20);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="h-2 w-full bg-gradient-to-r from-sky-500 via-violet-500 to-rose-500" />
      </div>

      <main className="pt-6 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-5 shadow-card mb-6">
            <DiasporaPeopleSearch />
          </div>

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

          <section className="mb-6">
            <div className="flex items-center justify-between mb-3 max-w-5xl mx-auto">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" /> Öne Çıkan Üyeler
              </h2>
              <Link to="/cadde" className="text-xs text-primary font-semibold hover:underline">
                Cadde akışında gör →
              </Link>
            </div>

            {isLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {errorMessage && (
              <p className="text-sm text-destructive text-center py-8">{errorMessage}</p>
            )}

            {!isLoading && !errorMessage && profiles.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Henüz görünür bireysel profil yok.
              </p>
            )}

            {!isLoading && profiles.length > 0 && (
              <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {profiles.map((p) => <ProfileCard key={p.userId} p={p} />)}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default DiasporaPeople;

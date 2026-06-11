import { Users, MapPin, Calendar as CalendarIcon, UserPlus, UserCheck, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { associations } from "@/data/mock";
import { useFollow } from "@/hooks/useFollow";
import DemoBadge from "@/components/DemoBadge";

const AssociationsSection = () => {
  const featured = [
    associations[0],
    associations[1],
    associations.find((a) => a.id === "bae-turk-dernegi")!,
  ];
  const { isFollowed: isFollowedFn, toggle } = useFollow();

  const toggleFollow = (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle("association", id, name);
  };

  return (
    <section id="dernekler" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Topluluk</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            Kuruluşlar & Örgütler
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto font-body">
            Bulunduğun ülkedeki Türk topluluklarına katıl
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {featured.map((a) => {
            const isFollowed = isFollowedFn("association", a.id);
            return (
              <Link
                to={`/association/${a.id}`}
                key={a.id}
                className="relative bg-card rounded-2xl p-6 pt-9 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border hover:-translate-y-1 block overflow-hidden"
              >
                <DemoBadge variant="card" />
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {a.type}
                  </span>
                  <button
                    onClick={(e) => toggleFollow(a.id, a.name, e)}
                    className={`p-2 rounded-full transition-colors ${isFollowed ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-primary"}`}
                  >
                    {isFollowed ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  </button>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{a.name}</h3>
                <p className="text-sm text-muted-foreground font-body flex items-center gap-1 mb-4">
                  <MapPin className="h-4 w-4" /> {a.city}, {a.country}
                </p>

                <div className="flex items-center gap-4 mb-5">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="font-body">{a.members.toLocaleString()} üye</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="font-body">{a.events} etkinlik</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link to={`/association/${a.id}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="default" size="sm" className="w-full">Üye Ol</Button>
                  </Link>
                  <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    <Heart className="h-3 w-3" /> Bağış / Aidat
                  </Button>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link to="/associations">
            <Button variant="outline" size="lg">Tüm Kuruluşları Gör →</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AssociationsSection;

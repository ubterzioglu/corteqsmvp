import { MapPin, Users, Briefcase, UserPlus, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { businesses } from "@/data/mock";
import { useFollow } from "@/hooks/useFollow";
import DemoBadge from "@/components/DemoBadge";

const offeringColors: Record<string, string> = {
  "iş ilanı": "bg-turquoise/10 text-turquoise border-turquoise/20",
  "franchise": "bg-gold/10 text-gold border-gold/20",
  "iş fırsatı": "bg-primary/10 text-primary border-primary/20",
};

const BusinessesSection = () => {
  const featured = businesses.slice(0, 2);
  const { isFollowed: isFollowedFn, toggle } = useFollow();

  const toggleFollow = (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle("business", id, name);
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-turquoise uppercase tracking-wider">İş Dünyası</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            Türk İşletmeleri & Şirketleri
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto font-body">
            İş ilanları, franchise fırsatları ve iş ortaklıkları
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {featured.map((b) => {
            const isFollowed = isFollowedFn("business", b.id);
            return (
              <Link
                to={`/business/${b.id}`}
                key={b.id}
                className="relative bg-card rounded-2xl p-6 pt-9 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border hover:-translate-y-1 block overflow-hidden"
              >
                <DemoBadge variant="card" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm shrink-0">
                      {b.logo}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{b.name}</h3>
                      <p className="text-xs text-muted-foreground">{b.sector}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => toggleFollow(b.id, b.name, e)}
                    className={`p-2 rounded-full transition-colors ${isFollowed ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-primary"}`}
                  >
                    {isFollowed ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  </button>
                </div>

                <p className="text-sm text-muted-foreground font-body flex items-center gap-1 mb-3">
                  <MapPin className="h-4 w-4" /> {b.city}, {b.country}
                </p>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="font-body">{b.employees} çalışan</span>
                  </div>
                  {b.openPositions > 0 && (
                    <div className="flex items-center gap-1 text-sm text-turquoise">
                      <Briefcase className="h-4 w-4" />
                      <span className="font-body font-semibold">{b.openPositions} pozisyon</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {b.offerings.map((o) => (
                    <Badge key={o} variant="outline" className={`text-xs ${offeringColors[o] || ""}`}>
                      {o === "iş ilanı" ? "💼 İş İlanı" : o === "franchise" ? "🏪 Franchise" : "🤝 İş Fırsatı"}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Link to={`/business/${b.id}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="default" size="sm" className="w-full">Detay</Button>
                  </Link>
                  <Link to={`/business/${b.id}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" className="w-full gap-1 border-gold/30 text-gold hover:bg-gold/10">
                      🏷️ Kupon Al
                    </Button>
                  </Link>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link to="/businesses">
            <Button variant="outline" size="lg">Tüm İşletmeleri Gör →</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BusinessesSection;

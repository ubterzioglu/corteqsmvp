import { Home, MapPin, BedDouble, Bath, Maximize, MessageSquare, Crown, Plus, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  city?: string;
  country?: string;
}

const RealEstateListingsPanel = ({ city = "—", country = "—" }: Props) => {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" /> Emlak İlanlarım
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-primary/10 text-primary rounded-full px-3 py-1 font-semibold">Freemium: 1 ilan</span>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Yeni İlan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active listing */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="h-36 bg-muted relative">
            <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=200&fit=crop" alt="Property" className="w-full h-full object-cover" />
            <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">Satılık</span>
          </div>
          <div className="p-3">
            <h3 className="font-bold text-foreground text-sm">Modern 2+1 Daire — {city}</h3>
            <p className="text-muted-foreground text-xs font-body mt-0.5 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {city}, {country}
            </p>
            <p className="text-lg font-bold text-primary mt-1.5">€285.000</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" /> 2</span>
              <span className="flex items-center gap-1"><Bath className="h-3 w-3" /> 1</span>
              <span className="flex items-center gap-1"><Maximize className="h-3 w-3" /> 85m²</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2.5">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <Edit3 className="h-3 w-3" /> Düzenle
              </Button>
              <Button size="sm" className="gap-1.5 text-xs">
                <MessageSquare className="h-3 w-3" /> Talepler
              </Button>
            </div>
          </div>
        </div>

        {/* Premium upsell - 2 blurred cards */}
        <div className="lg:col-span-2 relative">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 rounded-xl flex flex-col items-center justify-center gap-2">
            <div className="bg-gold/10 p-2.5 rounded-full">
              <Crown className="h-5 w-5 text-gold" />
            </div>
            <p className="font-bold text-foreground text-sm text-center">Premium ile 3 ilan yayınlayın</p>
            <p className="text-xs text-muted-foreground text-center max-w-xs">Premium abonelikle 3'e kadar gayrimenkul ilanı yayınlayabilirsiniz.</p>
            <Button variant="default" size="sm" className="gap-1.5 bg-gold hover:bg-gold/90 text-primary-foreground text-xs mt-1">
              <Crown className="h-3.5 w-3.5" /> Premium'a Geç
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 opacity-40">
            {[
              { title: "Lüks 3+1 Villa", price: "€520.000", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=200&fit=crop" },
              { title: "Yatırımlık Studio", price: "€165.000", img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop" },
            ].map((p, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden">
                <div className="h-36 bg-muted">
                  <img src={p.img} alt={p.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-foreground text-sm">{p.title}</h3>
                  <p className="text-base font-bold text-primary mt-1">{p.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealEstateListingsPanel;

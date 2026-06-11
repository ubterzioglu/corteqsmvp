import { MapPin, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const MapAddressBanner = () => {
  return (
    <div className="rounded-2xl border-2 border-orange-500/40 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-orange-500/10 p-4 md:p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
        <MapPin className="h-5 w-5 text-orange-600" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <h3 className="font-bold text-foreground text-sm md:text-base">
            Haritada görünmek için adres kaydını tamamla
          </h3>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground font-body">
          <span className="font-semibold text-foreground">Profilinden adresini girerek</span> ve yanındaki <span className="font-semibold text-orange-700">"Haritada yer almak istiyorum"</span> kutucuğunu işaretleyerek haritada görünebilirsin. Bu kutucuk işaretli olmayan profiller Diaspora Haritası'nda görünmez.
        </p>
      </div>
      <Link to="/map" className="shrink-0">
        <Button variant="outline" size="sm" className="border-orange-500/40 text-orange-700 hover:bg-orange-500/10">
          Haritayı Gör
        </Button>
      </Link>
    </div>
  );
};

export default MapAddressBanner;

import { Link } from "react-router-dom";
import { MapPin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface MapShareButtonsProps {
  name: string;
  city: string;
  country: string;
  /** Optional address for events */
  address?: string;
  className?: string;
  size?: "sm" | "icon";
}

const MapShareButtons = ({ name, city, country, address, className = "", size = "sm" }: MapShareButtonsProps) => {
  const { toast } = useToast();

  const handleMapClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const query = encodeURIComponent(address ? `${address}, ${city}, ${country}` : `${name}, ${city}, ${country}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareData = {
      title: name,
      text: `${name} — ${city}, ${country}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${name} — ${city}, ${country}\n${window.location.href}`);
        toast({ title: "Bağlantı kopyalandı! 📋", description: "Paylaşmak için yapıştırabilirsiniz." });
      }
    } catch {
      await navigator.clipboard.writeText(`${name} — ${city}, ${country}\n${window.location.href}`);
      toast({ title: "Bağlantı kopyalandı! 📋" });
    }
  };

  if (size === "icon") {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <button
          onClick={handleMapClick}
          className="p-1.5 rounded-full bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
          title="Haritada Göster"
        >
          <MapPin className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleShare}
          className="p-1.5 rounded-full bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
          title="Paylaş"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex gap-1.5 ${className}`}>
      <Button variant="outline" size="sm" className="gap-1 text-xs flex-1" onClick={handleMapClick}>
        <MapPin className="h-3 w-3" /> Haritada Göster
      </Button>
      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleShare}>
        <Share2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default MapShareButtons;

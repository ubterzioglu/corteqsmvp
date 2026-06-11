import { Sparkles, Crown, UserPlus, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface DemoPageBannerProps {
  categoryLabel: string;
  listingHref: string;
  /** Founders 1000 CTA'sını gizle (ücretsiz kategoriler için) */
  hideFounders?: boolean;
  /** Kayıt CTA metnini özelleştir */
  registerCtaLabel?: string;
}

const DemoPageBanner = ({ categoryLabel, listingHref, hideFounders = false, registerCtaLabel }: DemoPageBannerProps) => {
  const ctaLabel = registerCtaLabel ?? "Kayıt Ol";
  return (
    <div className="container mx-auto px-4 mt-4 mb-6">
      <div className="rounded-2xl border-2 border-dashed border-gold/50 bg-gradient-to-br from-gold/15 via-orange-50 to-turquoise/10 px-6 py-8 md:py-10 flex flex-col items-center gap-4 text-center shadow-sm">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-gold shrink-0" />
          <span className="font-extrabold uppercase tracking-[0.25em] text-2xl md:text-4xl text-foreground">
            DEMO Hesap Görünümü
          </span>
          <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-gold shrink-0" />
        </div>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
          Bu profil örnek içeriktir. {categoryLabel} kategorimize başvurular değerlendirildikçe gerçek profiller yayına alınır.
        </p>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {!hideFounders && (
            <Link to="/founders-1000">
              <Button size="sm" variant="default" className="gap-1 bg-gold text-foreground hover:bg-gold/90">
                <Crown className="h-4 w-4" /> Founders 1000
              </Button>
            </Link>
          )}
          <Link to={`${listingHref}#kayit-form`}>
            <Button size="sm" variant="default" className="gap-1 bg-turquoise text-white hover:bg-turquoise/90">
              {hideFounders ? <Rocket className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />} {ctaLabel}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DemoPageBanner;

import { Link } from "react-router-dom";
import { Crown, ArrowRight, Sparkles, Gift } from "lucide-react";

interface CategoryListingBannerProps {
  /** Kategori adı (ör. "Danışmanlık", "İşletmeler", "Kuruluşlar") */
  categoryLabel: string;
  /** (Geriye dönük uyumluluk — artık kullanılmıyor) */
  formAnchorId?: string;
}

/**
 * Kayıt formunun ÜZERİNE konulan Founding 1000 şeridi.
 * Tıklanınca /founders-1000 sayfasına yönlendirir.
 */
const CategoryListingBanner = ({ categoryLabel }: CategoryListingBannerProps) => {
  return (
    <Link
      to="/founders-1000"
      className="group block rounded-2xl border-2 border-gold/40 bg-gradient-to-r from-gold/10 via-orange-50/60 to-turquoise/10 hover:from-gold/15 hover:via-orange-50 hover:to-turquoise/15 transition-all px-6 py-7 md:py-9 mb-6"
    >
      <div className="flex flex-col items-center text-center gap-2 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
            <Crown className="h-5 w-5 text-gold" />
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-turquoise" />
            <span className="text-xs font-bold uppercase tracking-wider text-turquoise">
              Founding 1000 — Sınırlı Kontenjan
            </span>
          </div>
        </div>

        <p className="text-base md:text-lg font-semibold text-foreground leading-snug">
          {categoryLabel} kategorisinde{" "}
          <span className="text-gold">Founding Partner</span> olmak ister misiniz?
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm md:text-base">
          <span className="line-through text-muted-foreground">120€</span>
          <span className="font-extrabold text-foreground">yerine yalnızca 99€</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs md:text-sm font-semibold">
          <Gift className="h-3.5 w-3.5" />
          399€ değerinde global görünürlük paketi ücretsiz
        </div>

        <span className="inline-flex items-center gap-1.5 mt-1 text-sm font-bold text-foreground group-hover:text-gold transition-colors">
          Detayları gör
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  );
};

export default CategoryListingBanner;

// Workshop m41 + m44 — sağ kolonun tepesindeki "öne çıkan içerik" yuvası.
//
// Statik "CorteQS Panosu / Bugün caddede öne çıkanlar" kartının yerine geçer:
// içerik artık admin panelinden Featured anahtarıyla seçilen billboard kaydıdır
// (m42 kararı: seçim MANUEL, otomatik skor yok).
//
// Kartın tamamı tıklanabilir ve hedefe (cta_url) gider — pratikte bir profil/katalog
// sayfası, ör. "/directory/profile/<id>" ya da "/commercial/<slug>". Bilinçli olarak
// yeni bir profil FK'sı eklenmedi; cta_url zaten NOT NULL ve admin formunda mevcut.
//
// Featured kayıt yoksa bileşen hiçbir şey çizmez — o boşluğu m43'ün tanıtım
// placeholder'ı dolduracak (F14).

import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isInternalCaddeLink } from "@/lib/cadde-links";
import type { CaddeBillboardCard } from "@/lib/cadde-types";

export interface CaddeFeaturedSpotlightProps {
  card: CaddeBillboardCard | null;
}

const CaddeFeaturedSpotlight = ({ card }: CaddeFeaturedSpotlightProps) => {
  if (!card) return null;

  const body = (
    <>
      {card.imageUrl ? (
        <img src={card.imageUrl} alt="" className="h-28 w-full rounded-2xl object-cover" loading="lazy" />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-orange-100 text-orange-900 hover:bg-orange-100">Öne Çıkan</Badge>
        <Badge variant="outline">{card.type}</Badge>
        {card.badgeText ? <Badge variant="secondary">{card.badgeText}</Badge> : null}
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
        {card.subtitle ? <p className="mt-0.5 text-sm font-medium text-slate-500">{card.subtitle}</p> : null}
      </div>
      <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{card.description}</p>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700">
        {card.ctaLabel}
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </>
  );

  const bodyClassName = "flex flex-col gap-3 rounded-2xl p-3 transition hover:bg-orange-50/60";

  return (
    <Card
      className="cadde-featured overflow-hidden"
      data-testid="cadde-featured-spotlight"
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-display text-base">
          <Sparkles className="h-4 w-4 text-orange-500" />
          Caddede Öne Çıkan
        </CardTitle>
        <CardDescription>Editör seçkisi — panelden belirlenir</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {isInternalCaddeLink(card.ctaUrl) ? (
          <Link to={card.ctaUrl} className={bodyClassName}>
            {body}
          </Link>
        ) : (
          <a href={card.ctaUrl} target="_blank" rel="noreferrer noopener" className={bodyClassName}>
            {body}
          </a>
        )}
      </CardContent>
    </Card>
  );
};

export default CaddeFeaturedSpotlight;

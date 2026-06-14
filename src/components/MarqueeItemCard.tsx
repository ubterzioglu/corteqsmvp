import { Link } from "react-router-dom";
import { Megaphone, Newspaper, TrendingUp } from "lucide-react";

import { marqueeTypeLabels, type MarqueeItemRow, type MarqueeItemType } from "@/lib/marquee";
import { cn } from "@/lib/utils";

const typeStyles: Record<
  MarqueeItemType,
  { className: string; icon: typeof Newspaper; banner: string }
> = {
  news: {
    className: "bg-sky-50 text-sky-800 border-sky-200",
    icon: Newspaper,
    banner: "from-sky-500 to-blue-600",
  },
  stat: {
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: TrendingUp,
    banner: "from-emerald-500 to-teal-600",
  },
  announcement: {
    className: "bg-orange-50 text-orange-800 border-orange-200",
    icon: Megaphone,
    banner: "from-orange-500 to-amber-600",
  },
};

const getType = (type: string): MarqueeItemType =>
  type === "news" || type === "stat" || type === "announcement" ? type : "announcement";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

type MarqueeItemCardProps = {
  item: MarqueeItemRow;
  className?: string;
};

const MarqueeItemCard = ({ item, className }: MarqueeItemCardProps) => {
  const itemType = getType(item.type);
  const typeStyle = typeStyles[itemType];
  const TypeIcon = typeStyle.icon;

  // Tüm kartlar eşit en + boy. Sabit yükseklikli görsel/banner alanı her kartta
  // bulunur: gerçek görsel yoksa tip-temelli gradient + ikon banner gösterilir,
  // böylece hiçbir kart boş görünmez ve yükseklikler birbirini tutar. Başlık ve
  // özet sabit satır sayısına clamp'lenir; "Detay" mt-auto ile alta sabitlenir.
  const hasRealImage = Boolean(item.image_url) && item.image_url !== "/og-image.png";
  const summary = (item.summary ?? "").trim();
  const hasDetail = Boolean(item.link_enabled && item.slug);

  const cardContent = (
    <article
      className={cn(
        "group flex h-[380px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative h-[150px] shrink-0 overflow-hidden bg-muted">
        {hasRealImage ? (
          <img
            src={item.image_url as string}
            alt={item.image_alt || item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-br",
              typeStyle.banner,
            )}
          >
            <TypeIcon className="h-12 w-12 text-white/90" />
          </div>
        )}
        {item.metric_value && (
          <div className="absolute left-3 top-3 rounded-md bg-background/90 px-2.5 py-1 shadow-sm backdrop-blur">
            <span className="block text-base font-extrabold tracking-tight text-foreground">{item.metric_value}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", typeStyle.className)}>
            <TypeIcon className="h-3 w-3" />
            {marqueeTypeLabels[itemType]}
          </span>
          <time className="shrink-0 text-[11px] text-muted-foreground">{formatDate(item.published_at)}</time>
        </div>

        <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground">{item.title}</h3>

        {summary ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{summary}</p>
        ) : null}

        {hasDetail ? (
          <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-primary">Detay</span>
        ) : null}
      </div>
    </article>
  );

  if (item.link_enabled && item.slug) {
    return (
      <Link to={`/diaspora/${item.slug}`} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default MarqueeItemCard;

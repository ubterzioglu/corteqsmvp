import { Link } from "react-router-dom";
import { Megaphone, Newspaper, TrendingUp } from "lucide-react";

import { marqueeTypeLabels, type MarqueeItemRow, type MarqueeItemType } from "@/lib/marquee";
import { cn } from "@/lib/utils";

const typeStyles: Record<MarqueeItemType, { className: string; icon: typeof Newspaper }> = {
  news: {
    className: "bg-sky-50 text-sky-800 border-sky-200",
    icon: Newspaper,
  },
  stat: {
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: TrendingUp,
  },
  announcement: {
    className: "bg-orange-50 text-orange-800 border-orange-200",
    icon: Megaphone,
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
  const imageUrl = item.image_url || "/og-image.png";
  const cardContent = (
    <article
      className={cn(
        "group flex h-[360px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative h-[150px] shrink-0 overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={item.image_alt || item.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {item.metric_value && (
          <div className="absolute left-3 top-3 rounded-md bg-background/90 px-2.5 py-1 shadow-sm backdrop-blur">
            <span className="block text-base font-extrabold tracking-tight text-foreground">{item.metric_value}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", typeStyle.className)}>
            <TypeIcon className="h-3 w-3" />
            {marqueeTypeLabels[itemType]}
          </span>
          <time className="shrink-0 text-[11px] text-muted-foreground">{formatDate(item.published_at)}</time>
        </div>
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground">{item.title}</h3>
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
        {item.link_enabled && item.slug && (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">Detay</span>
        )}
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

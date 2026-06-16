import { useEffect, useMemo, useState } from "react";

import MarqueeItemCard from "@/components/MarqueeItemCard";
import { fallbackMarqueeItems, listPublicMarqueeItems, type MarqueeItemRow } from "@/lib/marquee";

const sortNewestFirst = (items: MarqueeItemRow[]) =>
  [...items].sort((first, second) => new Date(second.published_at).getTime() - new Date(first.published_at).getTime());

/**
 * "Haberler" sekmesi — marquee tabanlı radar akışı.
 * Eski RadarPage içeriğinin yeniden kullanılabilir hâli.
 */
const RadarHaberlerSection = () => {
  const [items, setItems] = useState<MarqueeItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    listPublicMarqueeItems()
      .then((data) => {
        if (mounted) setItems(data);
      })
      .catch((error: unknown) => {
        console.error("Radar items could not be loaded", error);
        if (mounted) setItems(fallbackMarqueeItems);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const sortedItems = useMemo(() => sortNewestFirst(items), [items]);

  if (loading) {
    return <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">Yükleniyor...</div>;
  }

  if (sortedItems.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">
        Henüz yayınlanmış radar kaydı yok.
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {sortedItems.map((item) => (
        <MarqueeItemCard key={item.id} item={item} className="w-full" />
      ))}
    </div>
  );
};

export default RadarHaberlerSection;

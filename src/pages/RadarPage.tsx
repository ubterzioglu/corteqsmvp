import { useEffect, useMemo, useState } from "react";
import { RadioTower } from "lucide-react";

import MarqueeItemCard from "@/components/MarqueeItemCard";
import { fallbackMarqueeItems, listPublicMarqueeItems, type MarqueeItemRow } from "@/lib/marquee";

const sortNewestFirst = (items: MarqueeItemRow[]) =>
  [...items].sort((first, second) => new Date(second.published_at).getTime() - new Date(first.published_at).getTime());

const RadarPage = () => {
  const [items, setItems] = useState<MarqueeItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    listPublicMarqueeItems()
      .then((data) => {
        if (mounted) setItems(data);
      })
      .catch((error) => {
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

  useEffect(() => {
    const previousTitle = document.title;
    const previousDescription = document.querySelector('meta[name="description"]')?.getAttribute("content");
    const description = "CorteQS Radar haberleri, istatistikleri ve platform duyurularını tek sayfada takip edin.";
    let meta = document.querySelector('meta[name="description"]');

    document.title = "CorteQS Radar | Haberler ve Duyurular";
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
    document.dispatchEvent(new Event("render-complete"));

    return () => {
      document.title = previousTitle;
      if (previousDescription) meta?.setAttribute("content", previousDescription);
    };
  }, []);

  const sortedItems = useMemo(() => sortNewestFirst(items), [items]);

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-[linear-gradient(90deg,hsl(var(--background)),hsl(var(--secondary)),hsl(var(--background)))]">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                <RadioTower className="h-4 w-4" />
                CorteQS Radar
              </div>
              <div className="space-y-2">
                <h1 className="truncate text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                  Haberler, İstatistikler ve Duyurular
                </h1>
                <p className="truncate text-sm leading-relaxed text-muted-foreground md:text-base">
                  Dünya genelindeki Türk topluluklarına dair güncel notlar, duyurular ve öne çıkan sayılar.
                </p>
              </div>
            </div>
            <img
              src="/radar-hero.png"
              alt=""
              aria-hidden="true"
              loading="lazy"
              width={1376}
              height={768}
              className="hidden h-28 w-auto shrink-0 rounded-2xl object-cover shadow-[0_18px_45px_-28px_rgba(15,23,42,0.4)] md:block lg:h-32"
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 md:py-14">
        {loading ? (
          <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">Yükleniyor...</div>
        ) : sortedItems.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sortedItems.map((item) => (
              <MarqueeItemCard key={item.id} item={item} className="w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">Henüz yayınlanmış radar kaydı yok.</div>
        )}
      </section>
    </main>
  );
};

export default RadarPage;

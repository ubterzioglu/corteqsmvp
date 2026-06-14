import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MarqueeItemCard from "@/components/MarqueeItemCard";
import { Button } from "@/components/ui/button";
import {
  fallbackMarqueeItems,
  listPublicMarqueeItems,
  type MarqueeItemRow,
} from "@/lib/marquee";

const DiasporaMarqueeSection = () => {
  const [items, setItems] = useState<MarqueeItemRow[]>(fallbackMarqueeItems);

  useEffect(() => {
    let mounted = true;

    listPublicMarqueeItems()
      .then((data) => {
        if (mounted && data.length > 0) setItems(data);
      })
      .catch((error) => {
        console.error("Marquee items could not be loaded", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const marqueeItems = useMemo(() => [...items, ...items], [items]);

  return (
    <section className="overflow-hidden py-5">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <img
              src="/radar-hero.png"
              alt=""
              aria-hidden="true"
              loading="lazy"
              width={1376}
              height={768}
              className="hidden h-16 w-auto shrink-0 rounded-xl object-cover shadow-[0_14px_36px_-24px_rgba(15,23,42,0.4)] sm:block lg:h-20"
            />
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
                CorteQS Radar
              </h2>
              <p className="truncate text-sm leading-relaxed text-muted-foreground">
                Türk topluluklarından sayılar, gelişmeler ve platform duyuruları.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="w-fit shrink-0">
            <Link to="/radar">
              Tüm Radar
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4">
        <div className="diaspora-marquee group overflow-hidden py-2">
          <div className="diaspora-marquee-viewport overflow-hidden px-4 sm:px-8 lg:px-10">
            <div className="diaspora-marquee-track flex min-w-max gap-4">
              {marqueeItems.map((item, index) => (
                <MarqueeItemCard key={`${item.id}-${index}`} item={item} className="w-[300px] sm:w-[360px] lg:w-[400px]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiasporaMarqueeSection;

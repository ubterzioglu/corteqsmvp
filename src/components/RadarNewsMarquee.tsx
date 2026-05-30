import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Newspaper, Radio, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchPublicRadarNews, formatRadarDate, type RadarNewsItem } from "@/lib/radarNews";

const RadarNewsMarquee = () => {
  const [items, setItems] = useState<RadarNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await fetchPublicRadarNews(10);
        if (active) setItems(data);
      } catch (error) {
        console.error("Failed to load radar news", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const marqueeItems = useMemo(() => [...items, ...items], [items]);

  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <section className="relative py-10">
      <div className="container mx-auto px-4">
        <div className="rounded-[2rem] border border-orange-100/70 bg-[linear-gradient(135deg,rgba(255,249,245,0.96),rgba(255,244,236,0.96))] p-5 shadow-[0_30px_80px_-48px_rgba(249,115,22,0.35)] backdrop-blur-xl md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                  <Sparkles className="h-3.5 w-3.5" />
                  Diaspora Haber Akisi
                </div>
                <h2 className="text-2xl font-black tracking-tight text-foreground">CorteQS Radar</h2>
              </div>
            </div>
            <Link
              to="/radar"
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-white"
            >
              Tum haberleri gor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl border border-white/70 bg-white/60"
                />
              ))}
            </div>
          ) : (
            <div className="group relative overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-[linear-gradient(90deg,rgba(255,248,242,1),rgba(255,248,242,0))]" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-[linear-gradient(270deg,rgba(255,248,242,1),rgba(255,248,242,0))]" />
              <div className="flex min-w-max gap-4 py-1 [animation:radar-marquee_38s_linear_infinite] group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
                {marqueeItems.map((item, index) => {
                  const hasDetail = Boolean(item.detailContent && item.slug);

                  const content = (
                    <article className="flex w-[320px] shrink-0 items-start gap-3 rounded-[1.4rem] border border-white/80 bg-white/80 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.22)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_-30px_rgba(15,23,42,0.25)]">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.imageAlt || item.title}
                          className="h-20 w-20 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Newspaper className="h-8 w-8" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/80">
                          <span>{formatRadarDate(item.publishedAt)}</span>
                          {item.metricValue ? (
                            <>
                              <span className="h-1 w-1 rounded-full bg-primary/40" />
                              <span>{item.metricValue}</span>
                            </>
                          ) : null}
                        </div>
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">{item.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.summary}</p>
                        {hasDetail ? (
                          <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                            Detayi oku
                            <ArrowRight className="h-3.5 w-3.5" />
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );

                  return hasDetail ? (
                    <Link key={`${item.id}-${index}`} to={`/radar/${item.slug}`}>
                      {content}
                    </Link>
                  ) : (
                    <div key={`${item.id}-${index}`}>{content}</div>
                  );
                })}
              </div>
              <style>{`
                @keyframes radar-marquee {
                  from { transform: translateX(0); }
                  to { transform: translateX(calc(-50% - 0.5rem)); }
                }
              `}</style>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RadarNewsMarquee;

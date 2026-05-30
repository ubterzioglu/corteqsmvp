import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Newspaper, Radio } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPublicRadarNews, fetchRadarNewsBySlug, formatRadarDate, type RadarNewsItem } from "@/lib/radarNews";

const RadarDetail = () => {
  const { slug } = useParams();
  const [item, setItem] = useState<RadarNewsItem | null>(null);
  const [related, setRelated] = useState<RadarNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        const [detail, allItems] = await Promise.all([
          fetchRadarNewsBySlug(slug),
          fetchPublicRadarNews(8),
        ]);

        if (!active) return;

        setItem(detail && detail.detailContent ? detail : null);
        setRelated(
          allItems
            .filter((entry) => entry.slug !== slug && entry.detailContent && entry.slug)
            .slice(0, 3),
        );
      } catch (error) {
        console.error("Failed to load radar detail", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [slug]);

  const paragraphs = useMemo(
    () => (item?.detailContent || "").split(/\n{2,}/).map((block) => block.trim()).filter(Boolean),
    [item],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="h-[460px] animate-pulse rounded-[2rem] border border-border bg-card" />
          ) : !item ? (
            <div className="rounded-[2rem] border border-border bg-card p-10 text-center shadow-card">
              <Newspaper className="mx-auto mb-4 h-10 w-10 text-primary/60" />
              <h1 className="text-3xl font-black text-foreground">Haber bulunamadi</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Bu haberin detay sayfasi yayinlanmamis olabilir.
              </p>
              <Link to="/radar" className="mt-6 inline-flex">
                <Button className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Tum haberlere don
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <article className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-card">
                {item.imageUrl ? (
                  <div className="h-[320px] overflow-hidden md:h-[420px]">
                    <img src={item.imageUrl} alt={item.imageAlt || item.title} className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div className="p-6 md:p-8 lg:p-10">
                  <Link to="/radar" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    <ArrowLeft className="h-4 w-4" />
                    Tum haberlere don
                  </Link>

                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <Radio className="mr-1 h-3.5 w-3.5" /> CorteQS Radar
                    </Badge>
                    <Badge variant="outline">{formatRadarDate(item.publishedAt)}</Badge>
                    {item.metricValue ? <Badge variant="secondary">{item.metricValue}</Badge> : null}
                  </div>

                  <h1 className="max-w-4xl text-4xl font-black tracking-tight text-foreground md:text-5xl">{item.title}</h1>
                  <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{item.summary}</p>

                  {item.externalUrl ? (
                    <div className="mt-6">
                      <a href={item.externalUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="gap-2">
                          Kaynaga git
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  ) : null}

                  <div className="mt-8 space-y-5 border-t border-border pt-8">
                    {paragraphs.map((paragraph, index) => (
                      <p key={index} className="max-w-4xl text-base leading-8 text-foreground/90">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </article>

              {related.length > 0 ? (
                <section className="mt-10">
                  <div className="mb-4">
                    <h2 className="text-2xl font-black tracking-tight text-foreground">Diger Radar Haberleri</h2>
                    <p className="text-sm text-muted-foreground">Ayni akistaki diger gelismeleri de inceleyin.</p>
                  </div>
                  <div className="grid gap-5 md:grid-cols-3">
                    {related.map((entry) => (
                      <article key={entry.id} className="rounded-[1.6rem] border border-border bg-card p-5 shadow-card">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{formatRadarDate(entry.publishedAt)}</Badge>
                          {entry.metricValue ? <Badge variant="secondary">{entry.metricValue}</Badge> : null}
                        </div>
                        <h3 className="text-lg font-bold leading-snug text-foreground">{entry.title}</h3>
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{entry.summary}</p>
                        <Link to={`/radar/${entry.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                          Detayi oku
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default RadarDetail;

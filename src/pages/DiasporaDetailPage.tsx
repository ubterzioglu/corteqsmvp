import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarDays } from "lucide-react";

import NotFound from "@/pages/NotFound";
import {
  fallbackMarqueeItems,
  getPublicMarqueeItemBySlug,
  marqueeTypeLabels,
  type MarqueeItemRow,
  type MarqueeItemType,
} from "@/lib/marquee";
import {
  applySeo,
  SEO_CANONICAL_ORIGIN,
  SEO_DEFAULT_OG_IMAGE,
  SEO_SITE_NAME,
} from "@/lib/seo";

const getType = (type: string): MarqueeItemType =>
  type === "news" || type === "stat" || type === "announcement" ? type : "announcement";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

const DiasporaDetailPage = () => {
  const { slug = "" } = useParams();
  const [item, setItem] = useState<MarqueeItemRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getPublicMarqueeItemBySlug(slug)
      .then((data) => {
        const fallback = fallbackMarqueeItems.find((fallbackItem) => fallbackItem.slug === slug && fallbackItem.link_enabled) ?? null;
        if (mounted) setItem(data ?? fallback);
      })
      .catch((error) => {
        console.error("Diaspora detail could not be loaded", error);
        const fallback = fallbackMarqueeItems.find((fallbackItem) => fallbackItem.slug === slug && fallbackItem.link_enabled) ?? null;
        if (mounted) setItem(fallback);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!item) return;
    const canonicalPath = `/diaspora/${item.slug}`;
    const description = item.summary.slice(0, 155);
    const ogImage = item.image_url || SEO_DEFAULT_OG_IMAGE;

    // GEO: yapılandırılmış veri — AI cevap motorları NewsArticle şemasından beslenir
    // (BlogPostPage.tsx'teki BlogPosting deseniyle tutarlı).
    const jsonLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": item.type === "news" ? "NewsArticle" : "Article",
      headline: item.title,
      description,
      inLanguage: "tr",
      url: `${SEO_CANONICAL_ORIGIN}${canonicalPath}`,
      mainEntityOfPage: `${SEO_CANONICAL_ORIGIN}${canonicalPath}`,
      image: ogImage,
      datePublished: item.published_at,
      author: { "@type": "Organization", name: SEO_SITE_NAME, url: SEO_CANONICAL_ORIGIN },
      publisher: {
        "@type": "Organization",
        name: SEO_SITE_NAME,
        logo: { "@type": "ImageObject", url: `${SEO_CANONICAL_ORIGIN}/logocorteqsbig.png` },
      },
    };

    return applySeo({
      title: `${item.title} | CorteQS`,
      description,
      canonicalPath,
      ogImage,
      ogType: "article",
      jsonLd,
    });
  }, [item]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background">Yükleniyor...</div>;
  }

  if (!item) return <NotFound />;

  const type = getType(item.type);
  const detailText = item.detail_content || item.summary;

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-secondary/40">
        <div className="container mx-auto px-4 py-8" />
      </section>

      <article className="container mx-auto max-w-5xl px-4 py-10">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="relative aspect-[16/8] min-h-[260px] overflow-hidden bg-muted">
            <img
              src={item.image_url || "/og-image.png"}
              alt={item.image_alt || item.title}
              className="h-full w-full object-cover"
            />
            {item.metric_value && (
              <div className="absolute bottom-4 left-4 rounded-md bg-background/90 px-4 py-3 shadow-sm backdrop-blur">
                <span className="text-3xl font-extrabold text-foreground">{item.metric_value}</span>
              </div>
            )}
          </div>

          <div className="space-y-6 p-6 md:p-10">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-semibold text-primary">
                {marqueeTypeLabels[type]}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {formatDate(item.published_at)}
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">{item.title}</h1>
              <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">{item.summary}</p>
            </div>

            <div className="prose prose-neutral max-w-none whitespace-pre-line text-foreground">
              {detailText}
            </div>
          </div>
        </div>
      </article>
    </main>
  );
};

export default DiasporaDetailPage;

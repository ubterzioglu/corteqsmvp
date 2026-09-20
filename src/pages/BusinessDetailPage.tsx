/**
 * İşletme detayı — DEMO içerik (`/isletme/:slug`).
 *
 * `/businesses` listesindeki demo kartların gittiği yer. Kaynak `src/data/mock.ts`;
 * gerçek işletme kaydı canlıda SIFIR (ölçüm 2026-09-20), gerçek kayıtlar
 * geldiğinde `catalog_items`'tan gelip `/directory/catalog/:slug`'a giderler —
 * bu sayfaya DEĞİL.
 *
 * ⚠️ Bant neden `DEMO_ROUTES` deseniyle değil `DemoPageBanner` ile çiziliyor:
 * `DEMO_ROUTES` LİTERAL yol karşılaştırır (`findDemoRoute` → `normalizePath`
 * eşitliği). `/isletme/:slug` dinamik bir yoldur, hiçbir zaman eşleşmez ve bant
 * sessizce çizilmez. `AssociationDetail` de aynı nedenle `DemoPageBanner`
 * kullanıyor — desen tutarlıdır, unutulmuş değil.
 *
 * SEO: `robots: "noindex, follow"` — uydurma içerik indekslenmemeli.
 */

import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, ExternalLink, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import DemoPageBanner from "@/components/DemoPageBanner";
import { findBusinessDemo } from "@/lib/business-demo-rows";
import { trTitleCasePlace } from "@/lib/public-listing-filter";
import { useSeo } from "@/lib/seo";

const BusinessDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const business = findBusinessDemo(slug);

  useSeo(
    business
      ? {
          title: `${business.name} | CorteQS`,
          description: business.description || `${business.name} — ${business.city}, ${business.country}`,
          canonicalPath: `/isletme/${business.id}`,
          robots: "noindex, follow",
        }
      : {
          title: "İşletme bulunamadı | CorteQS",
          description: "Aradığın işletme kaydı bulunamadı.",
          robots: "noindex, follow",
        },
  );

  if (!business) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pb-16 pt-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-foreground">İşletme bulunamadı</h1>
            <p className="mt-2 font-body text-muted-foreground">
              Bu adreste bir işletme kaydı yok.
            </p>
            <Button asChild className="mt-5 gap-2">
              <Link to="/businesses">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> İşletmeler listesine dön
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20">
        <DemoPageBanner categoryLabel="İşletmeler" listingHref="/businesses" />
      </div>

      <main className="pb-16 pt-8">
        <div className="container mx-auto max-w-3xl px-4">
          <Link
            to="/businesses"
            className="mb-6 inline-flex items-center gap-1.5 font-body text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> İşletmeler
          </Link>

          <header className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-sm font-bold text-secondary-foreground">
              {business.logo}
            </div>
            <div className="min-w-0">
              <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {business.sector}
              </span>
              <h1 className="mt-1.5 text-2xl font-bold text-foreground md:text-3xl">
                {business.name}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 font-body text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                {trTitleCasePlace(business.city)}, {business.country}
              </p>
            </div>
          </header>

          <p className="mt-6 font-body leading-relaxed text-muted-foreground">
            {business.description}
          </p>

          <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <dt className="flex items-center gap-1.5 font-body text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" aria-hidden="true" /> Kuruluş yılı
              </dt>
              <dd className="mt-1 text-lg font-bold text-foreground">{business.founded}</dd>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <dt className="flex items-center gap-1.5 font-body text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" aria-hidden="true" /> Çalışan
              </dt>
              <dd className="mt-1 text-lg font-bold text-foreground">
                {business.employees.toLocaleString("tr-TR")}
              </dd>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <dt className="font-body text-xs text-muted-foreground">Açık pozisyon</dt>
              <dd className="mt-1 text-lg font-bold text-foreground">{business.openPositions}</dd>
            </div>
          </dl>

          {business.offerings.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {business.offerings.map((offering) => (
                <span
                  key={offering}
                  className="rounded-full border border-border bg-card px-3 py-1 font-body text-xs text-foreground"
                >
                  {offering}
                </span>
              ))}
            </div>
          ) : null}

          {business.website ? (
            <Button asChild variant="outline" className="mt-8 gap-2">
              {/* Demo kayıt — dış bağlantı `noopener` ile açılır. */}
              <a href={business.website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> Web sitesi
              </a>
            </Button>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default BusinessDetailPage;

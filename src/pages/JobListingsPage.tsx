// A8 · İş ilanı listesi sayfası (/ilanlar) — herkese açık.
//
// Kaynak: docs/plans/2026-10-05-birlesik-plan-cv-ilan-rol-talepleri.md A8
// useSeo + canonicalPath ile SEO uyumlu.

import { Link } from "react-router-dom";
import { MapPin, Briefcase, Clock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useJobListings } from "@/lib/job-listings-api";
import { useSeo } from "@/lib/seo";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(new Date(value));

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  "Tam Zamanlı": "Tam Zamanlı",
  "Yarı Zamanlı": "Yarı Zamanlı",
  "Sözleşmeli": "Sözleşmeli",
  "Staj": "Staj",
};

const LOCATION_TYPE_LABELS: Record<string, string> = {
  office: "Ofisten",
  remote: "Uzaktan",
  hybrid: "Hibrit",
};

export default function JobListingsPage() {
  useSeo({
    title: "İş İlanları | CorteQS",
    description: "CorteQS topluluğundan iş ilanları. Danışman, işletme ve kuruluş ilanlarını görüntüleyin.",
    canonicalPath: "/ilanlar",
  });

  const { data: listings, isLoading, isError } = useJobListings(20, 0);

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">İş İlanları</h1>
          <p className="mt-2 text-muted-foreground">
            Topluluk üyelerinden güncel iş fırsatları
          </p>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 w-3/4 bg-muted rounded mb-2" />
                  <div className="h-4 w-1/2 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card className="border-destructive/50">
            <CardContent className="p-6 text-center">
              <p className="text-destructive">İlanlar yüklenirken bir sorun oluştu.</p>
            </CardContent>
          </Card>
        ) : !listings || listings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground">Henüz ilan yok</p>
              <p className="mt-2 text-sm text-muted-foreground">
                İlk ilanı vermek için giriş yapın.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <Card
                key={listing.id}
                className="transition hover:border-primary/50 hover:shadow-md"
              >
                <CardContent className="p-6">
                  <Link
                    to={`/ilanlar/${listing.id}`}
                    className="block space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-foreground line-clamp-2">
                          {listing.title}
                        </h2>
                        {listing.business_name && !listing.hide_business_name ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {listing.business_name}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {listing.package === "premium" ? "Premium" : "Standart"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {listing.department ? (
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {listing.department}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {EMPLOYMENT_TYPE_LABELS[listing.employment_type] ?? listing.employment_type}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {LOCATION_TYPE_LABELS[listing.location_type] ?? listing.location_type}
                        {listing.city ? ` · ${listing.city}` : ""}
                      </span>
                      <span className="ml-auto text-xs">
                        {formatDate(listing.created_at)}
                      </span>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

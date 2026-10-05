// A8 · İş ilanı detay sayfası (/ilanlar/:id) — giriş gerekli, kota kontrollü.
//
// Kaynak: docs/plans/2026-10-05-birlesik-plan-cv-ilan-rol-talepleri.md A8
// Giriş yok → /login?next=/ilanlar/:id
// Kota doldu → PremiumLockCard
// RPC hatası → Türkçe mesaj

import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Briefcase, Clock, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PremiumLockCard } from "@/components/common/PremiumLockCard";
import { useAuth } from "@/components/auth/useAuth";
import { useJobListingDetail, useMyListingQuota, resolveJobListingError } from "@/lib/job-listings-api";

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

export default function JobListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: detail, isLoading, isError, error } = useJobListingDetail(id ?? null);
  const { data: quota } = useMyListingQuota();

  // Giriş yok → /login?next=/ilanlar/:id
  if (!user) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg font-semibold text-foreground mb-4">
                İş ilanı detayını görüntülemek için giriş yapın
              </p>
              <Button asChild>
                <Link to={`/login?next=/ilanlar/${id}`}>Giriş Yap</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Kota doldu → PremiumLockCard
  const isLimitReached =
    quota && !quota.has_unlimited && quota.remaining <= 0 && isError;

  if (isLimitReached) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <PremiumLockCard
            title="İş ilanı görüntüleme hakkınız doldu"
            description={`Free planda ${quota.limit_total} ilan görüntüleme hakkınız var. Premium'a geçerek sınırsız erişim kazanabilirsiniz.`}
            ctaLabel="Premium'a geç"
            testId="listing-quota-lock"
          />
        </div>
      </main>
    );
  }

  // Yükleme
  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <Card className="animate-pulse">
            <CardContent className="p-8">
              <div className="h-8 w-3/4 bg-muted rounded mb-4" />
              <div className="h-4 w-1/2 bg-muted rounded mb-2" />
              <div className="h-4 w-2/3 bg-muted rounded" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Hata
  if (isError || !detail) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <Card className="border-destructive/50">
            <CardContent className="p-8 text-center">
              <p className="text-destructive">
                {error ? resolveJobListingError(error) : "İlan bulunamadı veya yüklenemedi."}
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/ilanlar">İlan listesine dön</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Kota bandı (kullanıcıya bilgi)
  const quotaBanner =
    quota && !quota.has_unlimited ? (
      <Card className="mb-6 border-amber-200 bg-amber-50/60">
        <CardContent className="p-4 text-sm text-amber-900">
          <strong>{quota.limit_total}</strong> ilandan <strong>{quota.viewed_count}</strong>'ini
          görüntülediniz. Kalan: <strong>{quota.remaining}</strong>
        </CardContent>
      </Card>
    ) : null;

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-6"
        >
          <Link to="/ilanlar">
            <ArrowLeft className="mr-2 h-4 w-4" />
            İlan listesine dön
          </Link>
        </Button>

        {quotaBanner}

        <Card>
          <CardContent className="p-8 space-y-6">
            {/* Başlık */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {detail.title}
              </h1>
              {detail.business_name && !detail.hide_business_name ? (
                <p className="mt-2 text-lg text-muted-foreground">
                  {detail.business_name}
                </p>
              ) : null}
            </div>

            {/* Meta bilgiler */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {detail.department ? (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  {detail.department}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {EMPLOYMENT_TYPE_LABELS[detail.employment_type] ?? detail.employment_type}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {LOCATION_TYPE_LABELS[detail.location_type] ?? detail.location_type}
                {detail.city ? ` · ${detail.city}` : detail.country ? ` · ${detail.country}` : ""}
              </span>
              {detail.salary_min !== null && detail.salary_max !== null ? (
                <span className="inline-flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  {detail.salary_min} - {detail.salary_max} {detail.currency}
                </span>
              ) : null}
            </div>

            {/* Açıklama */}
            {detail.description ? (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Açıklama
                </h2>
                <p className="text-foreground whitespace-pre-wrap">
                  {detail.description}
                </p>
              </div>
            ) : null}

            {/* Gereksinimler */}
            {detail.requirements ? (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Gereksinimler
                </h2>
                <p className="text-foreground whitespace-pre-wrap">
                  {detail.requirements}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

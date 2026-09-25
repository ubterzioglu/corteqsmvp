import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

import SectionErrorBoundary from "@/components/SectionErrorBoundary";
import { Button } from "@/components/ui/button";
import { recoverFromWhiteScreen } from "@/lib/recoveryReload";

interface RouteErrorBoundaryProps {
  children: ReactNode;
  /** `client_error_reports` bağlamı: `SectionErrorBoundary:<sectionName>`. */
  sectionName: string;
  /** Hata kartındaki "geri dön" bağlantısı. */
  homeHref?: string;
  homeLabel?: string;
}

const RouteErrorFallback = ({ homeHref, homeLabel }: { homeHref: string; homeLabel: string }) => (
  <div className="container mx-auto px-4 py-12">
    <div
      role="alert"
      className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card"
    >
      <h1 className="mb-3 text-xl font-extrabold">Bu sayfa yüklenemedi</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Menüden başka bir sayfaya geçebilir veya sayfayı yenileyerek tekrar deneyebilirsiniz.
      </p>
      <div className="flex flex-col gap-2">
        <Button onClick={() => recoverFromWhiteScreen({ forceReloadOnCooldown: true })} className="w-full">
          Sayfayı Yenile
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link to={homeHref}>{homeLabel}</Link>
        </Button>
      </div>
    </div>
  </div>
);

/**
 * Yalnız `<Outlet />` çevresine konan rota-sınırlı hata sınırı. Bir sayfa çökerse
 * header/menü/sidebar render'da kalır; `location.key` değişince (menüden tıklama,
 * geri tuşu) hata kartı kalkar ve yeni rota çizilir.
 */
export default function RouteErrorBoundary({
  children,
  sectionName,
  homeHref = "/",
  homeLabel = "Ana sayfaya dön",
}: RouteErrorBoundaryProps) {
  const location = useLocation();
  return (
    <SectionErrorBoundary
      resetKey={location.key}
      sectionName={sectionName}
      fallback={<RouteErrorFallback homeHref={homeHref} homeLabel={homeLabel} />}
    >
      {children}
    </SectionErrorBoundary>
  );
}

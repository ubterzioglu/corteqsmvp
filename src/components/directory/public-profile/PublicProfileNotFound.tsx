import { SearchX } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

import PublicProfileBreadcrumb from "./PublicProfileBreadcrumb";

/**
 * Single leak-free screen for missing, private and unpublished profiles —
 * the copy never reveals which case applies.
 */
const PublicProfileNotFound = () => (
  <div className="landing-ambient min-h-screen">
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
      <PublicProfileBreadcrumb />
      <div className="mx-auto flex max-w-md flex-col items-center rounded-[32px] border border-border/60 bg-card/80 px-6 py-14 text-center shadow-sm backdrop-blur-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
          <SearchX className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-lg font-semibold text-foreground">
          Bu profil şu anda görüntülenemiyor
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Profil kaldırılmış, gizlenmiş veya henüz yayınlanmamış olabilir.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/directory">Dizine Dön</Link>
        </Button>
      </div>
    </main>
  </div>
);

export default PublicProfileNotFound;

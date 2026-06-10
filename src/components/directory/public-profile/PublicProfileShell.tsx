import { useMemo } from "react";
import { PenLine } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/components/auth/useAuth";
import { Button } from "@/components/ui/button";
import { useSubmitCatalogClaim } from "@/hooks/useSubmitCatalogClaim";
import type { PublicCatalogProfilePagePayload } from "@/lib/public-catalog-profile-schemas";
import { buildPublicCatalogProfileViewModel } from "@/lib/public-catalog-profile-view-model";

import PublicProfileBreadcrumb from "./PublicProfileBreadcrumb";
import PublicProfileEmptyState from "./PublicProfileEmptyState";
import PublicProfileHero from "./PublicProfileHero";
import PublicProfileQuickActions from "./PublicProfileQuickActions";
import PublicProfileSectionList from "./PublicProfileSectionList";
import PublicProfileSidebar from "./PublicProfileSidebar";

const AmbientOrbs = () => (
  <>
    <div className="landing-ambient-orb landing-ambient-orb-one" aria-hidden="true" />
    <div className="landing-ambient-orb landing-ambient-orb-two" aria-hidden="true" />
    <div className="landing-ambient-orb landing-ambient-orb-five" aria-hidden="true" />
  </>
);

interface PublicProfileShellProps {
  profile: PublicCatalogProfilePagePayload;
}

const PublicProfileShell = ({ profile }: PublicProfileShellProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const claimMutation = useSubmitCatalogClaim();
  const viewModel = useMemo(() => buildPublicCatalogProfileViewModel(profile), [profile]);

  const profilePath = `/directory/catalog/${viewModel.claim.slug}`;
  const loginHref = `/login?mode=signup&next=${encodeURIComponent(profilePath)}`;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${profilePath}` : profilePath;

  const claimCta = (() => {
    if (!viewModel.claim.canClaim || authLoading) return null;
    if (!user) {
      return (
        <Button asChild className="min-h-[44px] rounded-full sm:min-h-9">
          <Link to={loginHref}>
            <PenLine className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Düzenleme Yetkisi Talep Et
          </Link>
        </Button>
      );
    }
    return (
      <Button
        type="button"
        className="min-h-[44px] rounded-full sm:min-h-9"
        disabled={claimMutation.isPending || claimMutation.isSuccess}
        onClick={() =>
          claimMutation.mutate({ itemId: viewModel.claim.itemId, slug: viewModel.claim.slug })
        }
      >
        <PenLine className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        {claimMutation.isSuccess
          ? "Talep Gönderildi"
          : claimMutation.isPending
            ? "Talep Gönderiliyor..."
            : "Düzenleme Yetkisi Talep Et"}
      </Button>
    );
  })();

  const heroActions = (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
      {claimCta}
      <PublicProfileQuickActions
        actions={viewModel.quickActions}
        shareUrl={shareUrl}
        shareTitle={viewModel.hero.title}
      />
    </div>
  );

  const hasAnySection =
    viewModel.mainSections.length > 0 || viewModel.sidebarSections.length > 0;

  return (
    <div className="landing-ambient min-h-screen">
      <AmbientOrbs />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 md:px-5 md:py-10">
        <PublicProfileBreadcrumb />

        <PublicProfileHero hero={viewModel.hero} actions={heroActions} />

        {claimMutation.isError ? (
          <p className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Talep gönderilemedi: {claimMutation.error instanceof Error ? claimMutation.error.message : "Beklenmeyen bir hata oluştu"}
          </p>
        ) : null}
        {claimMutation.isSuccess ? (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
            Düzenleme yetkisi talebiniz admin onayına gönderildi.
          </p>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
          <div className="min-w-0 space-y-5">
            {viewModel.mainSections.length > 0 ? (
              <PublicProfileSectionList
                sections={viewModel.mainSections}
                accent={viewModel.hero.accent}
              />
            ) : !hasAnySection ? (
              <PublicProfileEmptyState />
            ) : null}
          </div>

          {viewModel.sidebarSections.length > 0 ? (
            <PublicProfileSidebar
              sections={viewModel.sidebarSections}
              accent={viewModel.hero.accent}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default PublicProfileShell;

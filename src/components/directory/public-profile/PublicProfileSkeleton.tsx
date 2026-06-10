import PublicProfileBreadcrumb from "./PublicProfileBreadcrumb";

const shimmer = "animate-pulse rounded-2xl bg-muted/50";

const PublicProfileSkeleton = () => (
  <div className="landing-ambient min-h-screen">
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
      <PublicProfileBreadcrumb />

      {/* Hero skeleton — header card with avatar block */}
      <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-5 md:px-7 md:py-6">
          <div className="flex items-start gap-4">
            <div className={`h-20 w-20 shrink-0 rounded-[24px] md:h-24 md:w-24 ${shimmer}`} />
            <div className="min-w-0 flex-1 space-y-3">
              <div className={`h-5 w-40 max-w-full ${shimmer}`} />
              <div className={`h-7 w-2/3 max-w-xs ${shimmer}`} />
              <div className={`h-4 w-1/2 max-w-[220px] ${shimmer}`} />
              <div className={`h-8 w-3/4 max-w-[320px] ${shimmer}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Card grid skeleton */}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className={`h-44 md:col-span-2 ${shimmer} rounded-[22px]`} />
        <div className={`h-36 ${shimmer} rounded-[22px]`} />
        <div className={`h-36 ${shimmer} rounded-[22px]`} />
      </div>
    </main>
  </div>
);

export default PublicProfileSkeleton;

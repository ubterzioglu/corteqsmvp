import PublicProfileBreadcrumb from "./PublicProfileBreadcrumb";

const shimmer = "animate-pulse rounded-2xl bg-muted/50";

const PublicProfileSkeleton = () => (
  <div className="landing-ambient min-h-screen">
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
      <PublicProfileBreadcrumb />

      {/* Hero skeleton */}
      <div className="overflow-hidden rounded-[32px] border border-border/60 bg-card/80 shadow-md">
        <div className={`h-28 w-full md:h-36 ${shimmer} rounded-none`} />
        <div className="relative -mt-12 px-5 pb-6 md:-mt-16 md:px-8 md:pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            <div className={`h-[96px] w-[96px] shrink-0 rounded-[24px] border-4 border-background md:h-[120px] md:w-[120px] ${shimmer}`} />
            <div className="min-w-0 flex-1 space-y-3 pb-1">
              <div className={`h-7 w-2/3 max-w-xs ${shimmer}`} />
              <div className={`h-4 w-1/2 max-w-[220px] ${shimmer}`} />
              <div className={`h-4 w-1/3 max-w-[160px] ${shimmer}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Body skeleton */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
        <div className="space-y-5">
          <div className={`h-44 ${shimmer} rounded-[28px]`} />
          <div className={`h-56 ${shimmer} rounded-[28px]`} />
        </div>
        <div className="space-y-5">
          <div className={`h-40 ${shimmer} rounded-[28px]`} />
          <div className={`h-28 ${shimmer} rounded-[28px]`} />
        </div>
      </div>
    </main>
  </div>
);

export default PublicProfileSkeleton;

import PublicProfileBreadcrumb from "./PublicProfileBreadcrumb";

const shimmer = "animate-pulse rounded-2xl bg-muted/50";

/** Mirrors the final layout (hero card + 8/4 two-column grid) to minimize layout shift. */
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

      {/* Two-column section skeleton (main ~8 / sidebar ~4) */}
      <div className="mt-5 grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className={`h-44 ${shimmer} rounded-[22px]`} />
          <div className={`h-36 ${shimmer} rounded-[22px]`} />
        </div>
        <div className="space-y-4 lg:col-span-4">
          <div className={`h-32 ${shimmer} rounded-[22px]`} />
          <div className={`h-36 ${shimmer} rounded-[22px]`} />
        </div>
      </div>
    </main>
  </div>
);

export default PublicProfileSkeleton;

const RouteLoadingFallback = () => (
  <main
    className="flex min-h-[60vh] items-center justify-center bg-background px-4"
    aria-busy="true"
    aria-live="polite"
  >
    <div role="status" className="flex flex-col items-center gap-3 text-center">
      <span
        aria-hidden="true"
        className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
      />
      <p className="text-sm font-medium text-muted-foreground">Sayfa yükleniyor…</p>
    </div>
  </main>
);

export default RouteLoadingFallback;

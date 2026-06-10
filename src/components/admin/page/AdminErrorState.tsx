// Admin Panel V2 — ortak hata durumu (masterplan §9.2).

import { AlertTriangle, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type AdminErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function AdminErrorState({
  title = "Veri alınamadı",
  description,
  onRetry,
  retryLabel = "Tekrar dene",
  className,
}: AdminErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 px-6 py-10 text-center",
        className,
      )}
    >
      <AlertTriangle aria-hidden="true" className="h-8 w-8 text-destructive" />
      <p className="font-medium text-foreground">{title}</p>
      {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          <RefreshCw aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

// Durum rozetleri — iş, inceleme ve kaynak fetch durumları.
import { cn } from "@/lib/utils";
import {
  FETCH_STATUS_LABELS,
  JOB_STATUS_LABELS,
  JOB_STATUS_VARIANTS,
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_VARIANTS,
} from "@/lib/service-finder-format";
import type {
  ServiceFinderJobStatus,
  ServiceFinderReviewStatus,
} from "@/lib/service-finder-schemas";

interface JobStatusBadgeProps {
  status: ServiceFinderJobStatus;
  className?: string;
}

export function ServiceFinderJobStatusBadge({ status, className }: JobStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        JOB_STATUS_VARIANTS[status] ?? JOB_STATUS_VARIANTS.queued,
        className,
      )}
    >
      {JOB_STATUS_LABELS[status] ?? status}
    </span>
  );
}

interface ReviewStatusBadgeProps {
  status: ServiceFinderReviewStatus;
  className?: string;
}

export function ServiceFinderReviewStatusBadge({ status, className }: ReviewStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        REVIEW_STATUS_VARIANTS[status] ?? REVIEW_STATUS_VARIANTS.pending,
        className,
      )}
    >
      {REVIEW_STATUS_LABELS[status] ?? status}
    </span>
  );
}

interface FetchStatusBadgeProps {
  status: string;
  className?: string;
}

export function ServiceFinderFetchStatusBadge({ status, className }: FetchStatusBadgeProps) {
  const blocked = status === "blocked_robots" || status === "failed";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        blocked
          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        className,
      )}
    >
      {FETCH_STATUS_LABELS[status] ?? status}
    </span>
  );
}

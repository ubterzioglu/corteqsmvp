import type { Dispatch, SetStateAction } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PAGE_SIZE } from "@/lib/admin-catalog-display";

const CatalogPagination = ({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: Dispatch<SetStateAction<number>>;
}) => (
  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
    <div className="text-xs text-slate-600">
      {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} / {totalCount} kayıt
    </div>
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange((page) => Math.max(1, page - 1))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {Array.from({ length: totalPages }, (_, index) => index + 1)
        .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
        .reduce<(number | "ellipsis")[]>((acc, page, index, pages) => {
          if (index > 0) {
            const prev = pages[index - 1];
            if (page - prev > 1) acc.push("ellipsis");
          }
          acc.push(page);
          return acc;
        }, [])
        .map((page, index) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-1 text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                page === currentPage
                  ? "border-slate-900 bg-slate-900 font-medium text-white"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          ),
        )}
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange((page) => Math.min(totalPages, page + 1))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  </div>
);

export default CatalogPagination;

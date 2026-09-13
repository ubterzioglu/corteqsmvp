// Komuta Merkezi — sayfalama çubuğu (aralık metni + sayfa boyutu + gezinme).
// Sayfa boyutu tercihi tarayıcıda saklanır; bkz. `page-size.ts`.

import { PAGE_SIZE_OPTIONS } from './page-size'

interface CommandCenterPaginationProps {
  rangeStart: number
  rangeEnd: number
  totalCount: number
  pageSize: number
  onPageSizeChange: (nextPageSize: number) => void
  currentPage: number
  totalPages: number
  isPageLoading: boolean
  onPreviousPage: () => void
  onNextPage: () => void
}

export default function CommandCenterPagination({
  rangeStart,
  rangeEnd,
  totalCount,
  pageSize,
  onPageSizeChange,
  currentPage,
  totalPages,
  isPageLoading,
  onPreviousPage,
  onNextPage,
}: CommandCenterPaginationProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[rgba(66,133,244,0.08)] bg-white px-4 py-3 text-sm text-gray-600 shadow-[0_10px_20px_rgba(60,64,67,0.04)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <p>
          {rangeStart}-{rangeEnd} / {totalCount} kayıt
        </p>
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500">
          Sayfa boyutu
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="rounded-xl border border-[rgba(66,133,244,0.15)] bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            aria-label="Sayfa boyutu"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPreviousPage}
          disabled={currentPage === 1 || isPageLoading}
          className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
        >
          Önceki
        </button>
        <span className="min-w-[90px] text-center text-xs font-semibold text-gray-500">
          Sayfa {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={onNextPage}
          disabled={currentPage >= totalPages || isPageLoading}
          className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
        >
          Sonraki
        </button>
      </div>
    </div>
  )
}

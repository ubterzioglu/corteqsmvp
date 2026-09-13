'use client'

// Bölüm / alt bölüm / serbest metin filtre şeridi. Filtreleme mantığı burada
// DEĞİL, `@/lib/dashboard/resource-filters` içindedir; bu bileşen saf çizimdir.

import { Search } from 'lucide-react'
import type {
  ResourceSectionFilter,
  ResourceSubsectionFilter,
} from '@/lib/dashboard/resource-items'
import { FILTER_BTN_CLS, INPUT_CLS } from './link-manager-styles'

interface ResourceFilterBarProps {
  sectionFilter: ResourceSectionFilter
  sectionOptions: string[]
  selectedSubsection: ResourceSubsectionFilter
  subsectionFilterOptions: string[]
  searchTerm: string
  hasActiveFilters: boolean
  onSectionFilterChange: (value: ResourceSectionFilter) => void
  onSubsectionFilterChange: (value: ResourceSubsectionFilter) => void
  onSearchTermChange: (value: string) => void
  onClearFilters: () => void
}

export default function ResourceFilterBar({
  sectionFilter,
  sectionOptions,
  selectedSubsection,
  subsectionFilterOptions,
  searchTerm,
  hasActiveFilters,
  onSectionFilterChange,
  onSubsectionFilterChange,
  onSearchTermChange,
  onClearFilters,
}: ResourceFilterBarProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-4">
      <div className="docs-surface p-3 sm:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">
          Bölüm Filtresi
        </p>
        <select
          className={`${INPUT_CLS} mt-2 h-9 py-1.5 text-xs`}
          value={sectionFilter}
          onChange={(event) => onSectionFilterChange(event.target.value as ResourceSectionFilter)}
        >
          <option value="all">Tümü</option>
          {sectionOptions.map((section) => (
            <option key={section} value={section}>
              {section}
            </option>
          ))}
        </select>
      </div>

      <div className="docs-surface p-3 sm:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">
          Alt Bölüm Filtresi
        </p>
        <select
          className={`${INPUT_CLS} mt-2 h-9 py-1.5 text-xs`}
          value={selectedSubsection}
          onChange={(event) =>
            onSubsectionFilterChange(event.target.value as ResourceSubsectionFilter)
          }
        >
          <option value="all">Tümü</option>
          {subsectionFilterOptions.map((subsection) => (
            <option key={subsection} value={subsection}>
              {subsection}
            </option>
          ))}
        </select>
      </div>

      <div className="docs-surface p-3 sm:p-4 lg:col-span-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">
          Arama
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <label className="relative w-full">
            <Search
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              className={`${INPUT_CLS} h-9 py-1.5 pl-8 text-xs`}
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Başlık, açıklama, bölüm, alt bölüm"
            />
          </label>
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className={`${FILTER_BTN_CLS} whitespace-nowrap border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 hover:border-primary-200 hover:text-primary-700`}
          >
            Temizle
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

// Birleşik Kaynak Merkezi'nin filtre durumu: bölüm / alt bölüm / serbest metin
// arama ve bunlardan türeyen seçenek listeleri. CRUD durumundan bilinçli olarak
// ayrıdır — bu hook hiçbir şey yazmaz, yalnız `entries` listesini süzer.
//
// `formSection` / `editingSection` parametreleri: kullanıcının formda yazdığı
// bölüm, listede henüz hiç kayıt olmasa bile açılır listede görünmelidir.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getResourceSectionFromQuery,
  type ResourceEntry,
  type ResourceSectionFilter,
  type ResourceSubsectionFilter,
} from '@/lib/dashboard/resource-items'
import {
  buildSectionOptions,
  buildSubsectionFilterOptions,
  buildSubsectionOptionsBySection,
  matchesResourceFilters,
} from '@/lib/dashboard/resource-filters'

export interface ResourceFiltersController {
  visibleEntries: ResourceEntry[]
  hiddenEntries: ResourceEntry[]
  searchTerm: string
  sectionFilter: ResourceSectionFilter
  selectedSubsection: ResourceSubsectionFilter
  sectionOptions: string[]
  subsectionFilterOptions: string[]
  hasActiveFilters: boolean
  getSubsectionOptionsForSection: (section: string) => string[]
  setSearchTerm: (value: string) => void
  setSectionFilter: (nextFilter: ResourceSectionFilter) => void
  setSelectedSubsection: (value: ResourceSubsectionFilter) => void
  clearAllFilters: () => void
}

export function useResourceFilters(
  entries: ResourceEntry[],
  formSection: string,
  editingSection: string,
): ResourceFiltersController {
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set())
  const [selectedSubsection, setSelectedSubsection] = useState<ResourceSubsectionFilter>('all')

  // /admin/resources?section=insankaynaklari gibi derin linkler ilk açılışta
  // bölüm filtresini kurar.
  useEffect(() => {
    const section = getResourceSectionFromQuery(searchParams.get('section') ?? undefined)
    if (section !== 'all') {
      setSelectedSections(new Set([section]))
    }
  }, [searchParams])

  const sectionFilter: ResourceSectionFilter = useMemo(() => {
    if (selectedSections.size !== 1) return 'all'
    return Array.from(selectedSections)[0] ?? 'all'
  }, [selectedSections])

  const setSectionFilter = useCallback((nextFilter: ResourceSectionFilter) => {
    setSelectedSections(nextFilter === 'all' ? new Set() : new Set([nextFilter]))
    setSelectedSubsection('all')
  }, [])

  const sectionOptions = useMemo(
    () => buildSectionOptions(entries, formSection, editingSection),
    [editingSection, entries, formSection],
  )

  const subsectionOptionsBySection = useMemo(
    () => buildSubsectionOptionsBySection(entries),
    [entries],
  )

  const subsectionFilterOptions = useMemo(
    () => buildSubsectionFilterOptions(sectionFilter, subsectionOptionsBySection),
    [sectionFilter, subsectionOptionsBySection],
  )

  const getSubsectionOptionsForSection = useCallback(
    (section: string) => subsectionOptionsBySection.get(section) ?? [],
    [subsectionOptionsBySection],
  )

  const matchesFilters = useCallback(
    (entry: ResourceEntry) =>
      matchesResourceFilters(entry, { searchTerm, selectedSections, selectedSubsection }),
    [searchTerm, selectedSections, selectedSubsection],
  )

  const visibleEntries = useMemo(
    () => entries.filter((entry) => !entry.isHidden).filter(matchesFilters),
    [entries, matchesFilters],
  )

  const hiddenEntries = useMemo(
    () => entries.filter((entry) => entry.isHidden).filter(matchesFilters),
    [entries, matchesFilters],
  )

  const hasActiveFilters =
    selectedSections.size > 0 || selectedSubsection !== 'all' || searchTerm.trim() !== ''

  const clearAllFilters = useCallback(() => {
    setSelectedSections(new Set())
    setSelectedSubsection('all')
    setSearchTerm('')
  }, [])

  // Seçili alt bölüm, bölüm filtresi değişince listeden düşebilir; bu durumda
  // filtre sessizce boş liste göstermek yerine 'Tümü'ye döner.
  useEffect(() => {
    if (selectedSubsection === 'all') return
    if (subsectionFilterOptions.includes(selectedSubsection)) return
    setSelectedSubsection('all')
  }, [selectedSubsection, subsectionFilterOptions])

  return {
    visibleEntries,
    hiddenEntries,
    searchTerm,
    sectionFilter,
    selectedSubsection,
    sectionOptions,
    subsectionFilterOptions,
    hasActiveFilters,
    getSubsectionOptionsForSection,
    setSearchTerm,
    setSectionFilter,
    setSelectedSubsection,
    clearAllFilters,
  }
}

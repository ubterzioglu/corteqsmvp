// Birleşik Kaynak Merkezi (LinkManager) — bölüm/alt bölüm seçenek türetimi ve
// liste filtreleme. Saf fonksiyonlar; bileşen yalnız state tutar.
//
// Türkçe arama `trIncludes` ile yapılır (aksan-toleranslı): bare
// `toLowerCase().includes()` Türkçe'de yanlıştır — bkz. CLAUDE.md "Türkçe Metin
// Kuralları". Sıralama da `localeCompare(..., 'tr')` ile yapılır.

import { trIncludes } from '@/lib/text-normalization'
import type {
  ResourceEntry,
  ResourceSectionFilter,
  ResourceSubsectionFilter,
} from './resource-items'

export interface ResourceFilterState {
  searchTerm: string
  selectedSections: ReadonlySet<string>
  selectedSubsection: ResourceSubsectionFilter
}

function compareTr(a: string, b: string): number {
  return a.localeCompare(b, 'tr')
}

/**
 * Bölüm açılır listesinin seçenekleri. 'Genel' her zaman vardır; kayıtlardaki
 * bölümler ve (varsa) form durumlarındaki bölümler eklenir, sonra sıralanır.
 */
export function buildSectionOptions(
  entries: readonly ResourceEntry[],
  ...extraSections: readonly string[]
): string[] {
  const options = new Set<string>(['Genel'])
  for (const entry of entries) {
    if (entry.section) options.add(entry.section)
  }
  for (const section of extraSections) {
    if (section) options.add(section)
  }
  return Array.from(options).sort(compareTr)
}

/** Bölüm → o bölümde geçen alt bölümler (sıralı, tekrarsız). */
export function buildSubsectionOptionsBySection(
  entries: readonly ResourceEntry[],
): Map<string, string[]> {
  const map = new Map<string, string[]>()

  for (const entry of entries) {
    if (!entry.section || !entry.subsection) continue
    if (!map.has(entry.section)) map.set(entry.section, [])
    const current = map.get(entry.section) ?? []
    if (!current.includes(entry.subsection)) current.push(entry.subsection)
    map.set(entry.section, current)
  }

  for (const [key, values] of map.entries()) {
    values.sort(compareTr)
    map.set(key, values)
  }

  return map
}

/** Alt bölüm filtresi seçenekleri: 'all' seçiliyken tüm bölümlerin birleşimi. */
export function buildSubsectionFilterOptions(
  sectionFilter: ResourceSectionFilter,
  subsectionOptionsBySection: ReadonlyMap<string, string[]>,
): string[] {
  if (sectionFilter === 'all') {
    const all = new Set<string>()
    for (const list of subsectionOptionsBySection.values()) {
      for (const value of list) all.add(value)
    }
    return Array.from(all).sort(compareTr)
  }

  return subsectionOptionsBySection.get(sectionFilter) ?? []
}

/** Bölüm + alt bölüm + serbest metin aramasının birlikte uygulanması. */
export function matchesResourceFilters(
  entry: ResourceEntry,
  { searchTerm, selectedSections, selectedSubsection }: ResourceFilterState,
): boolean {
  const matchesSection = selectedSections.size === 0 || selectedSections.has(entry.section)
  const matchesSubsection = selectedSubsection === 'all' || entry.subsection === selectedSubsection

  const matchesSearch =
    !searchTerm.trim() ||
    trIncludes(entry.title, searchTerm) ||
    trIncludes(entry.description, searchTerm) ||
    trIncludes(entry.section, searchTerm) ||
    trIncludes(entry.subsection, searchTerm) ||
    trIncludes(entry.fileName, searchTerm) ||
    trIncludes(entry.personFirstName, searchTerm) ||
    trIncludes(entry.personLastName, searchTerm) ||
    trIncludes(entry.personRole, searchTerm)

  return matchesSection && matchesSubsection && matchesSearch
}

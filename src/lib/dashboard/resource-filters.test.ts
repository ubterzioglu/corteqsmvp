// LinkManager.tsx'ten çıkarılan filtre/seçenek mantığının sözleşmesi.
// Özellikle Türkçe arama (aksan-toleranslı `trIncludes`) burada kilitlenir:
// bare toLowerCase().includes() ile değiştirilirse test düşer.

import { describe, expect, it } from 'vitest'
import {
  buildSectionOptions,
  buildSubsectionFilterOptions,
  buildSubsectionOptionsBySection,
  matchesResourceFilters,
} from './resource-filters'
import type { ResourceEntry } from './resource-items'

function entry(overrides: Partial<ResourceEntry> = {}): ResourceEntry {
  return {
    id: overrides.id ?? 'id-1',
    section: 'HR',
    subsection: 'Rehber',
    recordKind: 'Link',
    addedBy: 'UBT',
    title: 'Üsküdar rehberi',
    description: null,
    url: null,
    fileName: null,
    personFirstName: null,
    personLastName: null,
    personRole: null,
    isHidden: false,
    ...overrides,
  } as ResourceEntry
}

const NO_FILTERS = {
  searchTerm: '',
  selectedSections: new Set<string>(),
  selectedSubsection: 'all' as const,
}

describe('buildSectionOptions', () => {
  it("'Genel' her zaman vardır ve sonuç Türkçe sıralanır", () => {
    const options = buildSectionOptions([entry({ section: 'ARGE' }), entry({ section: 'Ürün' })])
    expect(options[0]).toBe('ARGE')
    expect(options).toContain('Genel')
    expect(options).toContain('Ürün')
  })

  it('form durumundaki bölümü de seçeneklere ekler, boşu yok sayar', () => {
    expect(buildSectionOptions([], 'Yeni Bölüm', '')).toEqual(['Genel', 'Yeni Bölüm'])
  })
})

describe('buildSubsectionOptionsBySection', () => {
  it('bölüm başına tekrarsız ve sıralı alt bölüm listesi üretir', () => {
    const map = buildSubsectionOptionsBySection([
      entry({ section: 'HR', subsection: 'Rehber' }),
      entry({ section: 'HR', subsection: 'Adaylar' }),
      entry({ section: 'HR', subsection: 'Rehber' }),
      entry({ section: 'ARGE', subsection: 'Raporlar' }),
      entry({ section: 'ARGE', subsection: '' }),
    ])

    expect(map.get('HR')).toEqual(['Adaylar', 'Rehber'])
    expect(map.get('ARGE')).toEqual(['Raporlar'])
  })
})

describe('buildSubsectionFilterOptions', () => {
  const map = buildSubsectionOptionsBySection([
    entry({ section: 'HR', subsection: 'Rehber' }),
    entry({ section: 'ARGE', subsection: 'Raporlar' }),
  ])

  it("'all' seçiliyken tüm bölümlerin alt bölümlerini birleştirir", () => {
    expect(buildSubsectionFilterOptions('all', map)).toEqual(['Raporlar', 'Rehber'])
  })

  it('tek bölüm seçiliyken yalnız o bölümün listesini döner', () => {
    expect(buildSubsectionFilterOptions('ARGE', map)).toEqual(['Raporlar'])
    expect(buildSubsectionFilterOptions('YOK', map)).toEqual([])
  })
})

describe('matchesResourceFilters', () => {
  it('filtre yokken her kayıt geçer', () => {
    expect(matchesResourceFilters(entry(), NO_FILTERS)).toBe(true)
  })

  it('bölüm ve alt bölüm filtresi uygulanır', () => {
    expect(
      matchesResourceFilters(entry(), { ...NO_FILTERS, selectedSections: new Set(['ARGE']) }),
    ).toBe(false)
    expect(
      matchesResourceFilters(entry(), { ...NO_FILTERS, selectedSubsection: 'Adaylar' }),
    ).toBe(false)
  })

  it('arama Türkçe aksana toleranslıdır', () => {
    expect(matchesResourceFilters(entry(), { ...NO_FILTERS, searchTerm: 'uskudar' })).toBe(true)
    expect(matchesResourceFilters(entry(), { ...NO_FILTERS, searchTerm: 'İSTANBUL' })).toBe(false)
  })

  it('arama başlık dışındaki alanlarda da çalışır', () => {
    const withPerson = entry({ personLastName: 'Çelik', fileName: 'rapor-2026.pdf' })
    expect(matchesResourceFilters(withPerson, { ...NO_FILTERS, searchTerm: 'celik' })).toBe(true)
    expect(matchesResourceFilters(withPerson, { ...NO_FILTERS, searchTerm: 'rapor-2026' })).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import {
  buildCommandCenterCategoryOptions,
  buildCommandCenterDateGroupOptions,
  buildCommandCenterItemCounts,
  buildCommandCenterSourceBreakdown,
  createEmptyCommandCenterFormState,
  getCommandCenterDateGroupInfo,
  validateCommandCenterFormState,
  type CommandCenterFacetRow,
} from './command-center-items'

/**
 * Bu testler panonun facet (özet) katmanını korur. Facet satırları
 * `public.v_command_center_facets` view'ından gelir: her satır bir kombinasyonu ve o kombinasyondaki
 * kayıt sayısını (`item_count`) taşır. Panonun filtreleri, kaynak kartı ve rozetleri bu satırlardan
 * türetilir — tüm tabloyu okumak PostgREST'in 1000 satır sınırına takılıp en yeni partileri gizliyordu.
 */
function facet(overrides: Partial<CommandCenterFacetRow> = {}): CommandCenterFacetRow {
  return {
    item_type: 'meeting_note',
    category_label: '',
    legacy_source_code: null,
    legacy_source_date_label: null,
    legacy_source_category: null,
    assignee: 'Atanmadi',
    item_count: 1,
    ...overrides,
  }
}

function waFacet(dateLabel: string, overrides: Partial<CommandCenterFacetRow> = {}) {
  return facet({
    item_type: 'meeting_note',
    category_label: dateLabel,
    legacy_source_code: 'WA',
    legacy_source_date_label: dateLabel,
    legacy_source_category: 'ekip-ve-isbirligi',
    ...overrides,
  })
}

describe('getCommandCenterDateGroupInfo — WA hafta kovası', () => {
  it('WA parti etiketlerini ayın haftalık kovasına indirir', () => {
    // Panoda görünen etiket ham etiket değil, haftanın pazartesisidir.
    expect(getCommandCenterDateGroupInfo(waFacetShape('7 Temmuz 2026')).label).toBe('WA 6 Temmuz')
    expect(getCommandCenterDateGroupInfo(waFacetShape('2 Ağustos 2026')).label).toBe('WA 3 Ağustos')
    expect(getCommandCenterDateGroupInfo(waFacetShape('13 Nisan WA')).label).toBe('WA 13 Nisan')
    expect(getCommandCenterDateGroupInfo(waFacetShape('15 Nisan WA')).label).toBe('WA 13 Nisan')
  })

  it('Mayıs partileri tek kovada toplanır (özel kural)', () => {
    expect(getCommandCenterDateGroupInfo(waFacetShape('1 Mayıs WA')).label).toBe('WA 8 Mayıs')
    expect(getCommandCenterDateGroupInfo(waFacetShape('8 Mayıs WA')).label).toBe('WA 8 Mayıs')
  })

  it('toplantı kayıtları ham tarih etiketini korur', () => {
    const info = getCommandCenterDateGroupInfo({
      itemType: 'meeting_note',
      categoryLabel: '19 Haziran 2026',
      legacySourceCode: 'T16',
      legacySourceDateLabel: '19 Haziran 2026',
    })

    expect(info.label).toBe('T 19 Haziran 2026')
  })
})

function waFacetShape(dateLabel: string) {
  return {
    itemType: 'meeting_note' as const,
    categoryLabel: dateLabel,
    legacySourceCode: 'WA',
    legacySourceDateLabel: dateLabel,
  }
}

describe('buildCommandCenterSourceBreakdown', () => {
  const facets = [
    waFacet('7 Temmuz 2026', { item_count: 411 }),
    waFacet('2 Ağustos 2026', { item_count: 329 }),
    facet({
      category_label: '19 Haziran 2026',
      legacy_source_code: 'T16',
      legacy_source_date_label: '19 Haziran 2026',
      legacy_source_category: 'mvp-hedefleri',
      item_count: 30,
    }),
    facet({
      item_type: 'todo',
      category_label: 'Strateji, Roadmap & PMO',
      assignee: 'UBT',
      item_count: 12,
    }),
  ]

  it('item_count değerlerini bölümlere göre toplar', () => {
    const breakdown = buildCommandCenterSourceBreakdown(facets)

    expect(breakdown.total).toBe(782)
    expect(breakdown.sections.map((section) => section.kind)).toEqual(['meeting', 'wa', 'todo'])

    const wa = breakdown.sections.find((section) => section.kind === 'wa')
    expect(wa?.total).toBe(740)
    expect(wa?.entries.map((entry) => [entry.label, entry.count])).toEqual([
      ['WA 6 Temmuz', 411],
      ['WA 3 Ağustos', 329],
    ])
  })

  it('en yeni WA partisi tek satırda gelse bile düşmez (1000 satır regresyonu)', () => {
    // Eski kod tüm tabloyu okuduğu için 1000. satırdan sonrası kesiliyordu; facet'te parti tek satır.
    const wide = [
      ...Array.from({ length: 1200 }, (_, index) =>
        facet({
          category_label: `Dolgu ${index}`,
          legacy_source_code: 'T1',
          legacy_source_date_label: `Dolgu ${index}`,
        })
      ),
      waFacet('2 Ağustos 2026', { item_count: 329 }),
    ]

    const wa = buildCommandCenterSourceBreakdown(wide).sections.find(
      (section) => section.kind === 'wa'
    )

    expect(wa?.entries).toEqual([
      expect.objectContaining({ label: 'WA 3 Ağustos', count: 329 }),
    ])
  })
})

describe('buildCommandCenterDateGroupOptions', () => {
  it('aynı kovaya düşen ham etiketleri tek filtre değerinde birleştirir', () => {
    const options = buildCommandCenterDateGroupOptions([
      waFacet('13 Nisan WA', { item_count: 20 }),
      waFacet('15 Nisan WA', { item_count: 1 }),
    ])

    expect(options).toEqual([{ value: 'WA::13 Nisan WA||15 Nisan WA', label: 'WA 13 Nisan' }])
  })

  it('itemType ve topCategory filtrelerini uygular', () => {
    const facets = [
      waFacet('2 Ağustos 2026', { legacy_source_category: 'mvp-hedefleri', item_count: 5 }),
      waFacet('7 Temmuz 2026', { legacy_source_category: 'reklam-modeli', item_count: 7 }),
      facet({ item_type: 'todo', category_label: 'Bot & Otomasyon', item_count: 3 }),
    ]

    expect(buildCommandCenterDateGroupOptions(facets, { itemType: 'todo' })).toEqual([
      { value: 'TODO', label: 'TODO' },
    ])

    expect(
      buildCommandCenterDateGroupOptions(facets, {
        itemType: 'meeting_note',
        topCategory: 'MVP Hedefleri',
      })
    ).toEqual([{ value: 'WA::2 Ağustos 2026', label: 'WA 3 Ağustos' }])
  })
})

describe('buildCommandCenterCategoryOptions', () => {
  it('todo kategorilerini kendi etiketinden, toplantı kayıtlarını kategori kodundan türetir', () => {
    const options = buildCommandCenterCategoryOptions([
      facet({ item_type: 'todo', category_label: 'Bot & Otomasyon', item_count: 4 }),
      waFacet('2 Ağustos 2026', { legacy_source_category: 'mvp-hedefleri' }),
      waFacet('7 Temmuz 2026', { legacy_source_category: 'mvp-hedefleri' }),
    ])

    // Todo kategorileri listenin başında kalır, tekrar eden toplantı kategorisi tekilleşir.
    expect(options.map((option) => option.label)).toEqual(['Bot & Otomasyon', 'MVP Hedefleri'])
  })

  it('itemType filtresi uygulanır', () => {
    const options = buildCommandCenterCategoryOptions(
      [
        facet({ item_type: 'todo', category_label: 'Bot & Otomasyon' }),
        waFacet('2 Ağustos 2026', { legacy_source_category: 'mvp-hedefleri' }),
      ],
      { itemType: 'meeting_note' }
    )

    expect(options.map((option) => option.label)).toEqual(['MVP Hedefleri'])
  })
})

describe('buildCommandCenterItemCounts', () => {
  it('rozet sayılarını facet toplamlarından üretir', () => {
    const counts = buildCommandCenterItemCounts([
      facet({ item_type: 'todo', assignee: 'UBT', item_count: 12 }),
      facet({ item_type: 'todo', assignee: 'Burak', item_count: 7 }),
      facet({ item_type: 'todo', assignee: 'B+B', item_count: 3 }),
      facet({ item_type: 'todo', assignee: 'Atanmadi', item_count: 2 }),
      waFacet('2 Ağustos 2026', { item_count: 329 }),
    ])

    expect(counts).toEqual({
      total: 353,
      todo: 24,
      meetingNote: 329,
      burak: 7,
      ubt: 12,
      bb: 3,
      // Eski sorgu ikilisiyle aynı: "team" de toplantı notlarını sayar.
      team: 329,
    })
  })
})

describe('validateCommandCenterFormState', () => {
  it('B+B ortak atamasını kabul eder', () => {
    const state = createEmptyCommandCenterFormState({
      title: 'Ortak görev',
      detail: 'Barış ve Burak birlikte tamamlayacak.',
      categoryLabel: 'Genel',
      assignee: 'B+B',
    })

    expect(validateCommandCenterFormState(state)).toBeNull()
  })
})

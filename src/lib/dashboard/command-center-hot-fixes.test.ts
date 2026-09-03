import { describe, expect, it } from 'vitest'
import {
  countOpenHotFixItems,
  createEmptyHotFixFormState,
  HOT_FIX_OPEN_LIMIT,
  isHotFixLimitReached,
  sortHotFixItems,
  toHotFixFormState,
  validateHotFixFormState,
  type HotFixItem,
} from './command-center-hot-fixes'

/**
 * TOP 10 HOT FIX'in ana tablodan ayrıldığı iki davranışı kilitler:
 *  1. Tamamlanan madde listeden ÇIKMAZ, listenin altına düşer.
 *  2. Slot sayımı yalnız açık maddeleri sayar — tamamlanan madde 10'luk tavanı doldurmaz.
 * Bu iki kural bozulursa özellik sessizce ana tabloya benzer, testler bu yüzden gevşetilmemeli.
 */
function hotFix(overrides: Partial<HotFixItem> = {}): HotFixItem {
  return {
    id: overrides.id ?? 'hf-1',
    title: 'Hot fix',
    detail: 'Detay',
    categoryLabel: 'Dashboard, Admin & UX',
    assignee: 'Atanmadi',
    status: 'Baslanmadi',
    priority: 5,
    dueDate: null,
    urgent: false,
    sortOrder: 0,
    archivedAt: null,
    deletedAt: null,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

describe('sortHotFixItems', () => {
  it('tamamlanan maddeleri listeden çıkarmaz, sadece en alta indirir', () => {
    const sorted = sortHotFixItems([
      hotFix({ id: 'bitti', title: 'Bitti', status: 'Tamamlandi', priority: 10 }),
      hotFix({ id: 'acik', title: 'Açık', status: 'Devam ediyor', priority: 1 }),
    ])

    expect(sorted.map((item) => item.id)).toEqual(['acik', 'bitti'])
    expect(sorted).toHaveLength(2)
  })

  it('yüksek prio tamamlanmış olsa bile düşük prio açık maddenin altında kalır', () => {
    const sorted = sortHotFixItems([
      hotFix({ id: 'p10-bitti', status: 'Tamamlandi', priority: 10 }),
      hotFix({ id: 'p2-acik', status: 'Beklemede', priority: 2 }),
      hotFix({ id: 'p9-bitti', status: 'Tamamlandi', priority: 9 }),
      hotFix({ id: 'p1-acik', status: 'Baslanmadi', priority: 1 }),
    ])

    expect(sorted.slice(0, 2).every((item) => item.status !== 'Tamamlandi')).toBe(true)
    expect(sorted.slice(2).every((item) => item.status === 'Tamamlandi')).toBe(true)
  })

  it('açık maddeleri prio yüksekten düşüğe, eşitlikte en yeniden eskiye dizer', () => {
    const sorted = sortHotFixItems([
      hotFix({ id: 'eski-p8', priority: 8, createdAt: '2026-09-01T09:00:00.000Z' }),
      hotFix({ id: 'p3', priority: 3, createdAt: '2026-09-02T09:00:00.000Z' }),
      hotFix({ id: 'yeni-p8', priority: 8, createdAt: '2026-09-02T12:00:00.000Z' }),
    ])

    expect(sorted.map((item) => item.id)).toEqual(['yeni-p8', 'eski-p8', 'p3'])
  })

  it('tamamlananları kendi bloğunda en son bitenden eskiye dizer', () => {
    const sorted = sortHotFixItems([
      hotFix({ id: 'onceki', status: 'Tamamlandi', updatedAt: '2026-09-01T08:00:00.000Z' }),
      hotFix({ id: 'sonuncu', status: 'Tamamlandi', updatedAt: '2026-09-03T08:00:00.000Z' }),
    ])

    expect(sorted.map((item) => item.id)).toEqual(['sonuncu', 'onceki'])
  })

  it('girdi dizisini mutasyona uğratmaz', () => {
    const input = [
      hotFix({ id: 'bitti', status: 'Tamamlandi' }),
      hotFix({ id: 'acik' }),
    ]
    sortHotFixItems(input)

    expect(input.map((item) => item.id)).toEqual(['bitti', 'acik'])
  })
})

describe('slot sayımı', () => {
  it('tamamlanan maddeleri slot olarak saymaz', () => {
    const items = [
      hotFix({ id: '1', status: 'Tamamlandi' }),
      hotFix({ id: '2', status: 'Tamamlandi' }),
      hotFix({ id: '3', status: 'Devam ediyor' }),
    ]

    expect(countOpenHotFixItems(items)).toBe(1)
    expect(isHotFixLimitReached(items)).toBe(false)
  })

  it(`${HOT_FIX_OPEN_LIMIT} açık maddede sınır dolar`, () => {
    const open = Array.from({ length: HOT_FIX_OPEN_LIMIT }, (_, index) =>
      hotFix({ id: `open-${index}`, status: 'Beklemede' })
    )

    expect(isHotFixLimitReached(open)).toBe(true)
    // Tamamlanan madde eklemek sınırı değiştirmez, ama bir maddeyi tamamlamak slot açar.
    expect(isHotFixLimitReached([...open, hotFix({ id: 'done', status: 'Tamamlandi' })])).toBe(true)

    const withOneCompleted = open.map((item, index) =>
      index === 0 ? { ...item, status: 'Tamamlandi' as const } : item
    )
    expect(isHotFixLimitReached(withOneCompleted)).toBe(false)
  })
})

describe('validateHotFixFormState', () => {
  it('başlık boşsa detaydan başlık üretir ve kabul eder', () => {
    const state = createEmptyHotFixFormState({ detail: 'Ödeme ekranı 500 dönüyor' })
    expect(validateHotFixFormState(state)).toBeNull()
  })

  it('kategori boşsa reddeder', () => {
    const state = createEmptyHotFixFormState({ detail: 'Detay', categoryLabel: '   ' })
    expect(validateHotFixFormState(state)).toBe('Kategori boş bırakılamaz.')
  })

  it('geçersiz durumu reddeder', () => {
    const state = {
      ...createEmptyHotFixFormState({ detail: 'Detay' }),
      status: 'Yok' as never,
    }
    expect(validateHotFixFormState(state)).toBe('Geçersiz atama veya durum.')
  })

  it('prio aralık dışıysa reddeder', () => {
    const state = {
      ...createEmptyHotFixFormState({ detail: 'Detay' }),
      priority: 11 as never,
    }
    expect(validateHotFixFormState(state)).toBe('Geçersiz prio değeri.')
  })
})

describe('toHotFixFormState', () => {
  it('null termin tarihini boş metne çevirir', () => {
    expect(toHotFixFormState(hotFix({ dueDate: null })).dueDate).toBe('')
    expect(toHotFixFormState(hotFix({ dueDate: '2026-09-10' })).dueDate).toBe('2026-09-10')
  })
})

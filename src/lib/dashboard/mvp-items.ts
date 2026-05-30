export const MVP_LEVELS = ['MVP1', 'MVP2', 'MVP3', 'Atanmadi'] as const
export const MVP_AUTHORS = ['UBT', 'Burak', 'Diğer', 'All'] as const
export type MvpLevel = (typeof MVP_LEVELS)[number]
export type MvpAuthor = (typeof MVP_AUTHORS)[number]

export interface MvpItemRow {
  id: string
  konu: string
  sub: string | null
  ayrinti: string | null
  mvp_level: MvpLevel
  added_by: MvpAuthor
  is_seed: boolean
  created_at: string
  updated_at: string
}

export interface MvpItem {
  id: string
  konu: string
  sub: string | null
  ayrinti: string | null
  mvpLevel: MvpLevel
  addedBy: MvpAuthor
  isSeed: boolean
  createdAt: string
  updatedAt: string
}

export interface MvpFormState {
  konu: string
  sub: string
  ayrinti: string
  mvpLevel: MvpLevel
  addedBy: MvpAuthor
}

export function createEmptyMvpFormState(): MvpFormState {
  return {
    konu: '',
    sub: '',
    ayrinti: '',
    mvpLevel: 'Atanmadi',
    addedBy: 'UBT',
  }
}

export interface MvpLevelCounts {
  MVP1: number
  MVP2: number
  MVP3: number
  Atanmadi: number
}

export interface KonuGroup {
  konu: string
  normalizedKey: string
  items: MvpItem[]
  mvpCounts: MvpLevelCounts
}

export const MVP_LEVEL_ORDER: Record<MvpLevel, number> = {
  MVP1: 0,
  MVP2: 1,
  MVP3: 2,
  Atanmadi: 3,
}

export const MVP_COLORS: Record<MvpLevel, string> = {
  MVP1: '#E53935',
  MVP2: '#FB8C00',
  MVP3: '#1A6DC2',
  Atanmadi: '#888888',
}

export const INPUT_CLS =
  'w-full rounded-xl border border-[rgba(66,133,244,0.15)] bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

export const BTN_CLS =
  'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all disabled:opacity-60'

export function groupItemsByKonu(items: MvpItem[]): KonuGroup[] {
  const map = new Map<string, KonuGroup>()

  for (const item of items) {
    const raw = (item.konu ?? '').trim()
    const normalizedKey = raw ? raw.toLowerCase() : '__diger__'
    const displayKonu = raw || 'Diğer'

    let group = map.get(normalizedKey)
    if (!group) {
      group = {
        konu: displayKonu,
        normalizedKey,
        items: [],
        mvpCounts: { MVP1: 0, MVP2: 0, MVP3: 0, Atanmadi: 0 },
      }
      map.set(normalizedKey, group)
    }
    group.items.push(item)
    group.mvpCounts[item.mvpLevel]++
  }

  const groups = Array.from(map.values())

  for (const group of groups) {
    group.items.sort((a, b) => {
      const levelDiff = MVP_LEVEL_ORDER[a.mvpLevel] - MVP_LEVEL_ORDER[b.mvpLevel]
      if (levelDiff !== 0) return levelDiff
      return b.createdAt.localeCompare(a.createdAt)
    })
  }

  return groups.sort((a, b) => {
    if (a.normalizedKey === '__diger__') return 1
    if (b.normalizedKey === '__diger__') return -1
    return a.konu.localeCompare(b.konu, 'tr')
  })
}

export function mapMvpRow(row: MvpItemRow): MvpItem {
  return {
    id: row.id,
    konu: row.konu,
    sub: row.sub,
    ayrinti: row.ayrinti,
    mvpLevel: row.mvp_level,
    addedBy: row.added_by,
    isSeed: row.is_seed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

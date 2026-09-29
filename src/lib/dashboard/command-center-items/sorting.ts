// Komuta Merkezi — sıralama kuralları.
// Panoda görünen sıra doğrudan buradan gelir; kurallar kullanıcıya yansır,
// karşılaştırma sırasını değiştirme.
//
// A08b: sıralama SUNUCUDA (Postgres `.order()` zinciri) yapılır — istemci
// tarafı sıralama YASAK (A08a ölçümü). `buildCommandCenterSortOrders` seçilen
// anahtarı `.order()` çağrılarına çevirir; `sortCommandCenterItems` yalnız
// VARSAYILAN sıralamada ince ayar (tie-break) için istemcide çalışır.

import { getDateGroupSortToken } from './date-groups'
import { TODO_CATEGORY_SET } from './labels'
import type {
  CommandCenterCategoryOption,
  CommandCenterDateGroupOption,
  CommandCenterItem,
  CommandCenterSortDirection,
  CommandCenterSortKey,
} from './types'

export interface CommandCenterSortOrder {
  column: string
  ascending: boolean
}

/** Bir anahtar ilk kez seçildiğinde kullanılacak yön. */
export const COMMAND_CENTER_SORT_DEFAULT_DIRECTIONS: Record<
  CommandCenterSortKey,
  CommandCenterSortDirection
> = {
  priority: 'desc',
  title: 'asc',
  status: 'asc',
  assignee: 'asc',
  item_type: 'asc',
  due_date: 'asc',
  created_at: 'desc',
}

// Varsayılan zincir (A08a'dan beri canlıdaki sıra) — KORUNMALI.
const DEFAULT_SORT_CHAIN: readonly CommandCenterSortOrder[] = [
  { column: 'priority', ascending: false },
  { column: 'item_type', ascending: true },
  { column: 'sort_order', ascending: true },
  { column: 'created_at', ascending: false },
]

export function isDefaultCommandCenterSort(
  sortKey?: CommandCenterSortKey,
  sortDirection?: CommandCenterSortDirection
): boolean {
  if (!sortKey) {
    return true
  }

  const direction = sortDirection ?? COMMAND_CENTER_SORT_DEFAULT_DIRECTIONS[sortKey]
  return sortKey === 'priority' && direction === 'desc'
}

/**
 * Seçilen anahtarı `.order()` zincirine çevirir. Varsayılan (priority desc)
 * mevcut zinciri birebir döndürür; özel anahtarda sayfalama boyunca kararlı
 * sıra için varsayılan zincir tie-break olarak SONA eklenir (seçilen kolon
 * tekrarlanmaz).
 */
export function buildCommandCenterSortOrders(
  sortKey?: CommandCenterSortKey,
  sortDirection?: CommandCenterSortDirection
): CommandCenterSortOrder[] {
  if (isDefaultCommandCenterSort(sortKey, sortDirection)) {
    return [...DEFAULT_SORT_CHAIN]
  }

  const direction = sortDirection ?? COMMAND_CENTER_SORT_DEFAULT_DIRECTIONS[sortKey!]
  const orders: CommandCenterSortOrder[] = [
    { column: sortKey!, ascending: direction === 'asc' },
  ]
  for (const tieBreaker of DEFAULT_SORT_CHAIN) {
    if (!orders.some((order) => order.column === tieBreaker.column)) {
      orders.push(tieBreaker)
    }
  }

  return orders
}

function getCategorySortRank(option: CommandCenterCategoryOption): number {
  return TODO_CATEGORY_SET.has(option.label) ? 0 : 1
}

export function sortCommandCenterCategoryOptions(
  options: CommandCenterCategoryOption[]
): CommandCenterCategoryOption[] {
  return [...options].sort((left, right) => {
    const rankDiff = getCategorySortRank(left) - getCategorySortRank(right)
    if (rankDiff !== 0) {
      return rankDiff
    }

    return left.label.localeCompare(right.label, 'tr')
  })
}

export function sortCommandCenterDateGroupOptions(
  options: CommandCenterDateGroupOption[]
): CommandCenterDateGroupOption[] {
  return [...options].sort((left, right) => {
    const sortTokenDiff = getDateGroupSortToken(left.label).localeCompare(
      getDateGroupSortToken(right.label),
      'tr'
    )
    if (sortTokenDiff !== 0) {
      return sortTokenDiff
    }

    return left.label.localeCompare(right.label, 'tr')
  })
}

export function sortCommandCenterItems(items: CommandCenterItem[]): CommandCenterItem[] {
  return [...items].sort((left, right) => {
    if (left.priority !== right.priority) {
      return right.priority - left.priority
    }

    if (left.itemType !== right.itemType) {
      return left.itemType.localeCompare(right.itemType, 'tr')
    }

    if (left.itemType === 'meeting_note' && left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder
    }

    const leftCreatedAt = left.createdAt ? Date.parse(left.createdAt) : Number.NEGATIVE_INFINITY
    const rightCreatedAt = right.createdAt ? Date.parse(right.createdAt) : Number.NEGATIVE_INFINITY

    if (leftCreatedAt !== rightCreatedAt) {
      return rightCreatedAt - leftCreatedAt
    }

    if (left.updatedAt && right.updatedAt && left.updatedAt !== right.updatedAt) {
      return Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
    }

    if (left.dueDate && right.dueDate && left.dueDate !== right.dueDate) {
      return right.dueDate.localeCompare(left.dueDate)
    }

    const categoryCompare = left.categoryLabel.localeCompare(right.categoryLabel, 'tr')
    if (categoryCompare !== 0) {
      return categoryCompare
    }

    return left.detail.localeCompare(right.detail, 'tr')
  })
}

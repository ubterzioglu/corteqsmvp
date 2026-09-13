// Komuta Merkezi — sıralama kuralları.
// Panoda görünen sıra doğrudan buradan gelir; kurallar kullanıcıya yansır,
// karşılaştırma sırasını değiştirme.

import { getDateGroupSortToken } from './date-groups'
import { TODO_CATEGORY_SET } from './labels'
import type {
  CommandCenterCategoryOption,
  CommandCenterDateGroupOption,
  CommandCenterItem,
} from './types'

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

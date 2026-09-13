// Komuta Merkezi — facet satırlarından filtre seçeneklerini türetir.
// "Kategori" ve "Tip" açılır listelerinin İÇERİĞİ ve SIRASI buradan gelir;
// sıralama kullanıcıya doğrudan yansır, değiştirme.

import { getCommandCenterDateGroupInfo, getCommandCenterTopCategoryLabel } from './date-groups'
import { matchesFacetFilters, sortFacetRows, toFacetItemShape } from './facets'
import { getMeetingCategoryLabel } from './labels'
import {
  sortCommandCenterCategoryOptions,
  sortCommandCenterDateGroupOptions,
} from './sorting'
import type {
  CommandCenterCategoryOption,
  CommandCenterDateGroupOption,
  CommandCenterFacetRow,
  CommandCenterItemType,
} from './types'

export function buildCommandCenterCategoryOptions(
  facets: CommandCenterFacetRow[],
  options?: { itemType?: CommandCenterItemType; sourceCode?: string }
): CommandCenterCategoryOption[] {
  const uniqueOptions = new Map<string, CommandCenterCategoryOption>()

  for (const facet of sortFacetRows(facets)) {
    if (!matchesFacetFilters(facet, options)) {
      continue
    }

    const label =
      facet.item_type === 'todo'
        ? facet.category_label?.trim()
        : getMeetingCategoryLabel(facet.legacy_source_category)

    if (!label) {
      continue
    }

    if (!uniqueOptions.has(label)) {
      uniqueOptions.set(label, {
        value: label,
        label,
      })
    }
  }

  return sortCommandCenterCategoryOptions(Array.from(uniqueOptions.values()))
}

export function buildCommandCenterDateGroupOptions(
  facets: CommandCenterFacetRow[],
  options?: {
    itemType?: CommandCenterItemType
    sourceCode?: string
    topCategory?: string
  }
): CommandCenterDateGroupOption[] {
  const optionsMap = new Map<string, CommandCenterDateGroupOption>()

  for (const facet of sortFacetRows(facets)) {
    if (!matchesFacetFilters(facet, options)) {
      continue
    }

    const item = toFacetItemShape(facet)

    if (
      options?.topCategory?.trim() &&
      getCommandCenterTopCategoryLabel(item) !== options.topCategory.trim()
    ) {
      continue
    }

    const dateGroup = getCommandCenterDateGroupInfo(item)
    const value =
      item.itemType === 'todo'
        ? 'TODO'
        : dateGroup.label.startsWith('WA ')
          ? `WA::${dateGroup.rawLabel}`
          : `TOP::${dateGroup.rawLabel}`

    if (!optionsMap.has(dateGroup.key)) {
      optionsMap.set(dateGroup.key, {
        value,
        label: dateGroup.label,
      })
    } else if (dateGroup.label.startsWith('WA ')) {
      const current = optionsMap.get(dateGroup.key)
      if (current) {
        const existingRaw = current.value.replace(/^WA::/, '')
        if (!existingRaw.split('||').includes(dateGroup.rawLabel)) {
          current.value = `WA::${[existingRaw, dateGroup.rawLabel].filter(Boolean).join('||')}`
        }
      }
    }
  }

  return sortCommandCenterDateGroupOptions(Array.from(optionsMap.values()))
}

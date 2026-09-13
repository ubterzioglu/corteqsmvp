// Komuta Merkezi — kayıtları üst kategori → tip → tarih grubu ağacına dizer.
// Gruplar İLK GÖRÜLME sırasına göre eklenir (yalnız üst kategori alfabetik
// sıralanır); bu davranış panoda görünür, değiştirme.

import { getCommandCenterDateGroupInfo, getCommandCenterTopCategoryLabel } from './date-groups'
import { getCommandCenterItemLabel } from './labels'
import type { CommandCenterItem, CommandCenterTopCategoryGroup } from './types'

export function groupCommandCenterItems(
  items: CommandCenterItem[]
): CommandCenterTopCategoryGroup[] {
  const topCategoryMap = new Map<string, CommandCenterTopCategoryGroup>()

  for (const item of items) {
    const topCategoryLabel = getCommandCenterTopCategoryLabel(item)
    const itemTypeLabel = getCommandCenterItemLabel(item.itemType)
    const dateGroupInfo = getCommandCenterDateGroupInfo(item)

    let topCategoryGroup = topCategoryMap.get(topCategoryLabel)
    if (!topCategoryGroup) {
      topCategoryGroup = {
        key: topCategoryLabel,
        label: topCategoryLabel,
        items: [],
        itemTypeGroups: [],
      }
      topCategoryMap.set(topCategoryLabel, topCategoryGroup)
    }
    topCategoryGroup.items.push(item)

    let itemTypeGroup = topCategoryGroup.itemTypeGroups.find((group) => group.key === item.itemType)
    if (!itemTypeGroup) {
      itemTypeGroup = {
        key: item.itemType,
        label: itemTypeLabel,
        items: [],
        dateGroups: [],
      }
      topCategoryGroup.itemTypeGroups.push(itemTypeGroup)
    }
    itemTypeGroup.items.push(item)

    let dateGroup = itemTypeGroup.dateGroups.find((group) => group.key === dateGroupInfo.key)
    if (!dateGroup) {
      dateGroup = {
        key: dateGroupInfo.key,
        label: dateGroupInfo.label,
        items: [],
      }
      itemTypeGroup.dateGroups.push(dateGroup)
    }
    dateGroup.items.push(item)
  }

  return Array.from(topCategoryMap.values()).sort((left, right) =>
    left.label.localeCompare(right.label, 'tr')
  )
}

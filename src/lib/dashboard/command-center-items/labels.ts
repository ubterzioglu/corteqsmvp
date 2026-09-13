// Komuta Merkezi — etiket sözlükleri ve kategori çözümleme.
// Durum/atama/tip etiketleri ile toplantı kategorisi id ↔ etiket eşlemesi burada
// tutulur; hem UI etiketleri hem de filtre kurucusu aynı kaynaktan okur.

import { MEETING_CATEGORIES } from '../meeting-notes-data'
import { TODO_CATEGORIES } from '../todo-items'
import type { CommandCenterItemType } from './types'

const STATUS_LABELS: Record<string, string> = {
  Baslanmadi: 'Başlanmadı',
  Beklemede: 'Beklemede',
  'Devam ediyor': 'Devam ediyor',
  Tamamlandi: 'Tamamlandı',
}

const ASSIGNEE_LABELS: Record<string, string> = {
  Atanmadi: 'Atanmadı',
  UBT: 'UBT',
  Burak: 'Burak',
  'B+B': 'Barış + Burak',
}

const ITEM_TYPE_LABELS: Record<CommandCenterItemType, string> = {
  todo: 'Todo',
  meeting_note: 'Toplantı Notu',
}

export const TODO_DATE_GROUP_LABEL = 'TODO'

const MEETING_CATEGORY_LABEL_BY_ID = new Map(
  MEETING_CATEGORIES.map((category) => [category.id, category.label] as const)
)
const MEETING_CATEGORY_ID_BY_LABEL = new Map(
  MEETING_CATEGORIES.map((category) => [category.label, category.id] as const)
)

export const TODO_CATEGORY_SET = new Set<string>(TODO_CATEGORIES)

function humanizeMeetingCategorySlug(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase('tr-TR') + part.slice(1))
    .join(' ')
}

export function getCommandCenterItemLabel(itemType: CommandCenterItemType): string {
  return ITEM_TYPE_LABELS[itemType]
}

export function getCommandCenterStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

export function getCommandCenterAssigneeLabel(assignee: string): string {
  return ASSIGNEE_LABELS[assignee] ?? assignee
}

export function getMeetingCategoryLabel(categoryId: string | null | undefined): string {
  if (!categoryId) {
    return 'Diğer Toplantı Maddeleri'
  }

  return MEETING_CATEGORY_LABEL_BY_ID.get(categoryId) ?? humanizeMeetingCategorySlug(categoryId)
}

export function getMeetingCategoryIdByLabel(label: string): string | null {
  return MEETING_CATEGORY_ID_BY_LABEL.get(label) ?? null
}

export function formatCommandCenterCategoryLabel(
  label: string,
  itemType: CommandCenterItemType
): string {
  if (itemType === 'todo') {
    return label.trim()
  }

  return getMeetingCategoryLabel(label)
}

// Komuta Merkezi — ortak tip sözleşmesi.
// Satır (snake_case, PostgREST) ve alan (camelCase, UI) şekilleri ile bunlardan
// türeyen seçenek/grup tipleri burada tek yerde durur; diğer parça modüller
// yalnız bu dosyadan tip alır, böylece parçalar arasında döngüsel bağ oluşmaz.

import { TODO_ASSIGNEES, TODO_STATUSES } from '../todo-items'

export const COMMAND_CENTER_ITEM_TYPES = ['todo', 'meeting_note'] as const
export type CommandCenterItemType = (typeof COMMAND_CENTER_ITEM_TYPES)[number]
export type CommandCenterAssignee = (typeof TODO_ASSIGNEES)[number]
export type CommandCenterStatus = (typeof TODO_STATUSES)[number]
export const COMMAND_CENTER_PRIORITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const
export type CommandCenterPriority = (typeof COMMAND_CENTER_PRIORITY_OPTIONS)[number]

export interface CommandCenterItemRow {
  id: string
  item_type: CommandCenterItemType
  title: string
  detail: string
  category_label: string
  assignee: CommandCenterAssignee
  status: CommandCenterStatus
  priority: CommandCenterPriority
  due_date: string | null
  urgent: boolean
  legacy_source_type: string | null
  legacy_source_code: string | null
  legacy_source_date_label: string | null
  legacy_source_category: string | null
  legacy_source_title: string | null
  sort_order: number
  archived_at: string | null
  deleted_at: string | null
  created_at?: string
  updated_at?: string
}

export interface CommandCenterItem {
  id: string
  itemType: CommandCenterItemType
  title: string
  detail: string
  categoryLabel: string
  assignee: CommandCenterAssignee
  status: CommandCenterStatus
  priority: CommandCenterPriority
  dueDate: string | null
  urgent: boolean
  legacySourceType: string | null
  legacySourceCode: string | null
  legacySourceDateLabel: string | null
  legacySourceCategory: string | null
  legacySourceTitle: string | null
  sortOrder: number
  archivedAt: string | null
  deletedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface CommandCenterFormState {
  itemType: CommandCenterItemType
  title: string
  detail: string
  categoryLabel: string
  assignee: CommandCenterAssignee
  status: CommandCenterStatus
  priority: CommandCenterPriority
  dueDate: string
  urgent: boolean
  legacySourceCode: string
  legacySourceDateLabel: string
  legacySourceCategory: string
  legacySourceTitle: string
}

export interface FetchCommandCenterItemsOptions {
  page?: number
  pageSize?: number
  itemType?: CommandCenterItemType
  assignee?: string
  topCategory?: string
  status?: string
  priority?: number
  urgentOnly?: boolean
  sourceCode?: string
  dateGroup?: string
  searchTerm?: string
}

export interface CommandCenterItemsResult {
  items: CommandCenterItem[]
  totalCount: number
  page: number
  pageSize: number
}

export interface CommandCenterItemCounts {
  total: number
  todo: number
  meetingNote: number
  burak: number
  ubt: number
  bb: number
  team: number
}

/**
 * One aggregated row of `public.v_command_center_facets` — a distinct facet combination of the active
 * (non-archived, non-deleted) items plus how many items share it. The panel derives every filter
 * option, the source breakdown card and the badge counts from these ~320 rows, instead of reading the
 * full table (which PostgREST truncates at 1000 rows and would silently hide the newest batches).
 */
export interface CommandCenterFacetRow {
  item_type: CommandCenterItemType
  category_label: string
  legacy_source_code: string | null
  legacy_source_date_label: string | null
  legacy_source_category: string | null
  assignee: CommandCenterAssignee
  item_count: number
}

export type CommandCenterSourceKind = 'meeting' | 'wa' | 'todo'

export interface CommandCenterSourceEntry {
  key: string
  label: string
  kind: CommandCenterSourceKind
  count: number
  sortValue: string
}

export interface CommandCenterSourceSection {
  kind: CommandCenterSourceKind
  label: string
  total: number
  entries: CommandCenterSourceEntry[]
}

export interface CommandCenterSourceBreakdown {
  sections: CommandCenterSourceSection[]
  total: number
}

export interface CommandCenterCategoryOption {
  value: string
  label: string
}

export interface CommandCenterDateGroupOption {
  value: string
  label: string
}

export interface CommandCenterDateGroupInfo {
  key: string
  label: string
  rawLabel: string
  sortValue: string
}

export interface CommandCenterDateGroup {
  key: string
  label: string
  items: CommandCenterItem[]
}

export interface CommandCenterItemTypeGroup {
  key: CommandCenterItemType
  label: string
  items: CommandCenterItem[]
  dateGroups: CommandCenterDateGroup[]
}

export interface CommandCenterTopCategoryGroup {
  key: string
  label: string
  items: CommandCenterItem[]
  itemTypeGroups: CommandCenterItemTypeGroup[]
}

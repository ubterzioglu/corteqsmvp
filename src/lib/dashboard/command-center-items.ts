import { getSupabaseBrowserClient } from './supabase'
import { sanitizeError, validateContent, validateTitle } from '@/lib/security'
import { MEETING_CATEGORIES } from './meeting-notes-data'
import {
  TODO_CATEGORIES,
  TODO_ASSIGNEES,
  TODO_STATUSES,
  type TodoAssignee,
  type TodoStatus,
} from './todo-items'

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
  team: number
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

export const COMMAND_CENTER_SELECT =
  'id, item_type, title, detail, category_label, assignee, status, priority, due_date, urgent, legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category, legacy_source_title, sort_order, archived_at, deleted_at, created_at, updated_at'

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
}

const ITEM_TYPE_LABELS: Record<CommandCenterItemType, string> = {
  todo: 'Todo',
  meeting_note: 'Toplantı Notu',
}

const TODO_DATE_GROUP_LABEL = 'TODO'
const MEETING_CATEGORY_LABEL_BY_ID = new Map(
  MEETING_CATEGORIES.map((category) => [category.id, category.label] as const)
)
const MEETING_CATEGORY_ID_BY_LABEL = new Map(
  MEETING_CATEGORIES.map((category) => [category.label, category.id] as const)
)
const TODO_CATEGORY_SET = new Set<string>(TODO_CATEGORIES)

function escapeIlikeValue(value: string): string {
  return value.replace(/[%_,()]/g, (char) => `\\${char}`).replace(/,/g, '\\,')
}

function quoteFilterValue(value: string): string {
  return JSON.stringify(value)
}

function humanizeMeetingCategorySlug(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase('tr-TR') + part.slice(1))
    .join(' ')
}

export function mapCommandCenterRow(row: CommandCenterItemRow): CommandCenterItem {
  return {
    id: row.id,
    itemType: row.item_type,
    title: row.title,
    detail: row.detail,
    categoryLabel: row.category_label,
    assignee: row.assignee,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    urgent: row.urgent,
    legacySourceType: row.legacy_source_type,
    legacySourceCode: row.legacy_source_code,
    legacySourceDateLabel: row.legacy_source_date_label,
    legacySourceCategory: row.legacy_source_category,
    legacySourceTitle: row.legacy_source_title,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  }
}

export function createEmptyCommandCenterFormState(
  defaults?: Partial<CommandCenterFormState>
): CommandCenterFormState {
  return {
    itemType: defaults?.itemType ?? 'todo',
    title: defaults?.title ?? '',
    detail: defaults?.detail ?? '',
    categoryLabel: defaults?.categoryLabel ?? '',
    assignee: defaults?.assignee ?? 'Atanmadi',
    status: defaults?.status ?? 'Baslanmadi',
    priority: defaults?.priority ?? 5,
    dueDate: defaults?.dueDate ?? '',
    urgent: defaults?.urgent ?? false,
    legacySourceCode: defaults?.legacySourceCode ?? '',
    legacySourceDateLabel: defaults?.legacySourceDateLabel ?? '',
    legacySourceCategory: defaults?.legacySourceCategory ?? '',
    legacySourceTitle: defaults?.legacySourceTitle ?? '',
  }
}

export function toCommandCenterFormState(item: CommandCenterItem): CommandCenterFormState {
  return {
    itemType: item.itemType,
    title: item.title,
    detail: item.detail,
    categoryLabel: item.categoryLabel,
    assignee: item.assignee,
    status: item.status,
    priority: item.priority,
    dueDate: item.dueDate ?? '',
    urgent: item.urgent,
    legacySourceCode: item.legacySourceCode ?? '',
    legacySourceDateLabel: item.legacySourceDateLabel ?? '',
    legacySourceCategory: item.legacySourceCategory ?? '',
    legacySourceTitle: item.legacySourceTitle ?? '',
  }
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

function getMeetingCategoryLabel(categoryId: string | null | undefined): string {
  if (!categoryId) {
    return 'Diğer Toplantı Maddeleri'
  }

  return MEETING_CATEGORY_LABEL_BY_ID.get(categoryId) ?? humanizeMeetingCategorySlug(categoryId)
}

function getMeetingCategoryIdByLabel(label: string): string | null {
  return MEETING_CATEGORY_ID_BY_LABEL.get(label) ?? null
}

function isWaMeetingCategory(label: string): boolean {
  return /\bWA\b/i.test(label)
}

function extractDateLabelWithoutWa(label: string): string {
  return label.replace(/\bWA\b/gi, '').replace(/\s+/g, ' ').trim()
}

function getMonthNumber(monthLabel: string): number | null {
  const normalized = monthLabel
    .toLocaleLowerCase('tr-TR')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')

  const monthMap: Record<string, number> = {
    ocak: 1,
    subat: 2,
    mart: 3,
    nisan: 4,
    mayis: 5,
    haziran: 6,
    temmuz: 7,
    agustos: 8,
    eylul: 9,
    ekim: 10,
    kasim: 11,
    aralik: 12,
  }

  return monthMap[normalized] ?? null
}

const WA_BUCKET_YEAR = 2026

function formatMonthDayLabel(date: Date): string {
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

function getFirstMondayOfMonth(monthNumber: number): Date {
  const firstDayOfMonth = new Date(Date.UTC(WA_BUCKET_YEAR, monthNumber - 1, 1))
  const weekday = firstDayOfMonth.getUTCDay()
  const daysUntilMonday = (8 - weekday) % 7

  return new Date(Date.UTC(WA_BUCKET_YEAR, monthNumber - 1, 1 + daysUntilMonday))
}

function getWaWeekBucketLabel(rawLabel: string): string {
  const normalizedLabel = extractDateLabelWithoutWa(rawLabel)
  const match = normalizedLabel.match(/(\d{1,2})\s+([^\s]+)/)
  if (!match) {
    return normalizedLabel || 'WA'
  }

  const day = Number(match[1])
  const month = match[2]
  if (!Number.isFinite(day)) {
    return normalizedLabel || 'WA'
  }

  const monthNumber = getMonthNumber(month)
  if (!monthNumber) {
    return normalizedLabel || 'WA'
  }

  if (monthNumber === 5) {
    return '8 Mayıs'
  }

  const firstMonday = getFirstMondayOfMonth(monthNumber)
  const firstMondayDay = firstMonday.getUTCDate()
  const bucketDay =
    day <= firstMondayDay
      ? firstMondayDay
      : firstMondayDay + Math.floor((day - firstMondayDay) / 7) * 7
  const bucketDate = new Date(Date.UTC(WA_BUCKET_YEAR, monthNumber - 1, bucketDay))

  return formatMonthDayLabel(bucketDate)
}

function getDateGroupSortToken(label: string): string {
  if (label === TODO_DATE_GROUP_LABEL) {
    return '0-0000-00-00'
  }

  const isTop = label.startsWith('TOP ')
  const isWa = label.startsWith('WA ')
  const rawLabel = label.replace(/^(TOP|WA)\s+/, '')
  const match = rawLabel.match(/(\d{1,2})\s+([^\s]+)/)

  if (!match) {
    return `${isTop ? '1' : isWa ? '2' : '9'}-${rawLabel}`
  }

  const day = Number(match[1])
  const monthNumber = getMonthNumber(match[2]) ?? 99
  const paddedMonth = String(monthNumber).padStart(2, '0')
  const paddedDay = String(day).padStart(2, '0')

  return `${isTop ? '1' : isWa ? '2' : '9'}-2026-${paddedMonth}-${paddedDay}`
}

export function getCommandCenterTopCategoryLabel(item: CommandCenterItem): string {
  if (item.itemType === 'todo') {
    return item.categoryLabel.trim() || 'Genel'
  }

  return getMeetingCategoryLabel(item.legacySourceCategory)
}

export function getCommandCenterDateGroupInfo(
  item: Pick<
    CommandCenterItem,
    'itemType' | 'categoryLabel' | 'legacySourceCode' | 'legacySourceDateLabel'
  >
): CommandCenterDateGroupInfo {
  if (item.itemType === 'todo') {
    return {
      key: 'TODO',
      label: TODO_DATE_GROUP_LABEL,
      rawLabel: TODO_DATE_GROUP_LABEL,
      sortValue: '0-TODO',
    }
  }

  const rawLabel = (item.legacySourceDateLabel ?? item.categoryLabel).trim() || 'Tarihsiz'
  if (item.legacySourceCode === 'WA' || isWaMeetingCategory(rawLabel)) {
    const bucketLabel = getWaWeekBucketLabel(rawLabel)
    return {
      key: `WA::${bucketLabel}`,
      label: `WA ${bucketLabel}`,
      rawLabel,
      sortValue: `2-${bucketLabel}`,
    }
  }

  return {
    key: `TOP::${rawLabel}`,
    label: `T ${rawLabel}`,
    rawLabel,
    sortValue: `1-${rawLabel}`,
  }
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

function applyCommandCenterFilters<
  TQuery extends {
    eq: (column: string, value: unknown) => TQuery
    neq: (column: string, value: unknown) => TQuery
    or: (filters: string) => TQuery
  },
>(query: TQuery, options?: FetchCommandCenterItemsOptions): TQuery {
  if (options?.itemType) {
    query = query.eq('item_type', options.itemType)
  }

  if (options?.assignee && options.assignee !== 'Tümü') {
    query = query.eq('assignee', options.assignee)
  }

  if (options?.topCategory?.trim()) {
    const topCategory = options.topCategory.trim()
    const meetingCategoryId = getMeetingCategoryIdByLabel(topCategory)
    const categoryConditions: string[] = []

    if (!options.itemType || options.itemType === 'todo') {
      categoryConditions.push(
        `and(item_type.eq.todo,category_label.eq.${quoteFilterValue(topCategory)})`
      )
    }

    if (!options.itemType || options.itemType === 'meeting_note') {
      if (meetingCategoryId) {
        categoryConditions.push(
          `and(item_type.eq.meeting_note,legacy_source_category.eq.${quoteFilterValue(
            meetingCategoryId
          )})`
        )
      } else if (topCategory === 'Diğer Toplantı Maddeleri') {
        categoryConditions.push('and(item_type.eq.meeting_note,legacy_source_category.is.null)')
      }
    }

    if (categoryConditions.length > 0) {
      query = query.or(categoryConditions.join(','))
    }
  }

  if (options?.status && options.status !== 'Tümü') {
    query = query.eq('status', options.status)
  }

  if (options?.priority && Number.isInteger(options.priority)) {
    query = query.eq('priority', options.priority)
  }

  if (options?.urgentOnly) {
    query = query.eq('urgent', true)
  }

  if (options?.sourceCode && options.sourceCode !== 'Tümü') {
    query = query.eq('legacy_source_code', options.sourceCode)
  }

  if (options?.dateGroup?.trim()) {
    const [kind, payload] = options.dateGroup.split('::')

    if (kind === 'TODO') {
      query = query.eq('item_type', 'todo')
    } else if (kind === 'TOP' && payload) {
      query = query.eq('item_type', 'meeting_note')
      query = query.neq('legacy_source_code', 'WA')
      query = query.eq('category_label', payload)
    } else if (kind === 'WA' && payload) {
      const rawLabels = payload.split('||').filter(Boolean)
      query = query.eq('item_type', 'meeting_note')
      query = query.eq('legacy_source_code', 'WA')
      if (rawLabels.length === 1) {
        query = query.eq('category_label', rawLabels[0])
      } else if (rawLabels.length > 1) {
        query = query.or(
          rawLabels
            .map((rawLabel) => `category_label.eq.${quoteFilterValue(rawLabel)}`)
            .join(',')
        )
      }
    }
  }

  if (options?.searchTerm?.trim()) {
    const searchValue = `%${escapeIlikeValue(options.searchTerm.trim())}%`
    query = query.or(
      [
        `title.ilike.${searchValue}`,
        `detail.ilike.${searchValue}`,
        `category_label.ilike.${searchValue}`,
        `legacy_source_date_label.ilike.${searchValue}`,
        `legacy_source_category.ilike.${searchValue}`,
        `legacy_source_title.ilike.${searchValue}`,
      ].join(',')
    )
  }

  return query
}

export async function fetchCommandCenterItems(
  options?: FetchCommandCenterItemsOptions
): Promise<CommandCenterItemsResult> {
  const supabase = getSupabaseBrowserClient()
  const page = Math.max(1, options?.page ?? 1)
  const pageSize = Math.max(1, options?.pageSize ?? 50)

  if (!supabase) {
    return {
      items: [],
      totalCount: 0,
      page,
      pageSize,
    }
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('command_center_items')
    .select(COMMAND_CENTER_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .is('archived_at', null)
    .order('priority', { ascending: false })
    .order('item_type', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to)

  query = applyCommandCenterFilters(query, options)

  const { data, error, count } = await query
  if (error || !data) {
    return {
      items: [],
      totalCount: 0,
      page,
      pageSize,
    }
  }

  return {
    items: sortCommandCenterItems((data as CommandCenterItemRow[]).map(mapCommandCenterRow)),
    totalCount: count ?? 0,
    page,
    pageSize,
  }
}

export async function fetchDeletedCommandCenterItems(
  options?: FetchCommandCenterItemsOptions
): Promise<CommandCenterItem[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return []
  }

  let query = supabase
    .from('command_center_items')
    .select(COMMAND_CENTER_SELECT)
    .is('archived_at', null)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
    .order('priority', { ascending: false })
    .order('item_type', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  query = applyCommandCenterFilters(query, options)

  const { data, error } = await query
  if (error || !data) {
    return []
  }

  return (data as CommandCenterItemRow[]).map(mapCommandCenterRow)
}

export async function fetchArchivedCommandCenterItems(
  options?: FetchCommandCenterItemsOptions
): Promise<CommandCenterItem[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return []
  }

  let query = supabase
    .from('command_center_items')
    .select(COMMAND_CENTER_SELECT)
    .is('deleted_at', null)
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false })
    .order('priority', { ascending: false })
    .order('item_type', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  query = applyCommandCenterFilters(query, options)

  const { data, error } = await query
  if (error || !data) {
    return []
  }

  return (data as CommandCenterItemRow[]).map(mapCommandCenterRow)
}

export async function fetchCommandCenterCategoryOptions(options?: {
  itemType?: CommandCenterItemType
  sourceCode?: string
}): Promise<CommandCenterCategoryOption[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return []
  }

  let query = supabase
    .from('command_center_items')
    .select('category_label, item_type, legacy_source_category')
    .is('deleted_at', null)
    .is('archived_at', null)
    .order('item_type', { ascending: true })
    .order('category_label', { ascending: true })

  if (options?.itemType) {
    query = query.eq('item_type', options.itemType)
  }

  if (options?.sourceCode && options.sourceCode !== 'Tümü') {
    query = query.eq('legacy_source_code', options.sourceCode)
  }

  const { data, error } = await query
  if (error || !data) {
    return []
  }

  const uniqueOptions = new Map<string, CommandCenterCategoryOption>()
  for (const row of data as Pick<
    CommandCenterItemRow,
    'category_label' | 'item_type' | 'legacy_source_category'
  >[]) {
    const label =
      row.item_type === 'todo'
        ? row.category_label?.trim()
        : getMeetingCategoryLabel(row.legacy_source_category)

    if (!label) {
      continue
    }

    const key = label
    if (!uniqueOptions.has(key)) {
      uniqueOptions.set(key, {
        value: label,
        label,
      })
    }
  }

  return sortCommandCenterCategoryOptions(Array.from(uniqueOptions.values()))
}

export async function fetchCommandCenterDateGroupOptions(options?: {
  itemType?: CommandCenterItemType
  sourceCode?: string
  topCategory?: string
}): Promise<CommandCenterDateGroupOption[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return []
  }

  let query = supabase
    .from('command_center_items')
    .select(
      'item_type, category_label, legacy_source_code, legacy_source_date_label, legacy_source_category'
    )
    .is('deleted_at', null)
    .is('archived_at', null)
    .order('item_type', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (options?.itemType) {
    query = query.eq('item_type', options.itemType)
  }

  if (options?.sourceCode && options.sourceCode !== 'Tümü') {
    query = query.eq('legacy_source_code', options.sourceCode)
  }

  const { data, error } = await query
  if (error || !data) {
    return []
  }

  const optionsMap = new Map<string, CommandCenterDateGroupOption>()
  for (const row of data as Pick<
    CommandCenterItemRow,
    | 'item_type'
    | 'category_label'
    | 'legacy_source_code'
    | 'legacy_source_date_label'
    | 'legacy_source_category'
  >[]) {
    const item = mapCommandCenterRow({
      id: '',
      item_type: row.item_type,
      title: '',
      detail: '',
      category_label: row.category_label,
      assignee: 'Atanmadi',
      status: 'Baslanmadi',
      priority: 5,
      due_date: null,
      urgent: false,
      legacy_source_type: null,
      legacy_source_code: row.legacy_source_code,
      legacy_source_date_label: row.legacy_source_date_label,
      legacy_source_category: row.legacy_source_category,
      legacy_source_title: null,
      sort_order: 0,
      archived_at: null,
      deleted_at: null,
      created_at: undefined,
      updated_at: undefined,
    })

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

function buildTitle(state: CommandCenterFormState): string {
  const fallback = state.detail.trim().slice(0, 80) || 'Yeni kayıt'
  return (state.title.trim() || fallback).slice(0, 160)
}

function buildCategoryLabel(state: CommandCenterFormState): string {
  if (state.itemType === 'meeting_note') {
    return state.categoryLabel.trim() || state.legacySourceDateLabel.trim() || 'Tarihsiz'
  }

  return state.categoryLabel.trim() || 'Genel'
}

export function validateCommandCenterFormState(state: CommandCenterFormState): string | null {
  const titleError = validateTitle(buildTitle(state))
  if (titleError) return titleError

  const detailError = validateContent(state.detail)
  if (detailError) return detailError

  if (!buildCategoryLabel(state)) {
    return 'Kategori boş bırakılamaz.'
  }

  if (
    !TODO_ASSIGNEES.includes(state.assignee as TodoAssignee) ||
    !TODO_STATUSES.includes(state.status as TodoStatus)
  ) {
    return 'Geçersiz atama veya durum.'
  }

  if (
    !Number.isInteger(state.priority) ||
    state.priority < COMMAND_CENTER_PRIORITY_OPTIONS[0] ||
    state.priority > COMMAND_CENTER_PRIORITY_OPTIONS[COMMAND_CENTER_PRIORITY_OPTIONS.length - 1]
  ) {
    return 'Geçersiz prio değeri.'
  }

  return null
}

function buildCommandCenterPayload(state: CommandCenterFormState) {
  const categoryLabel = buildCategoryLabel(state)
  const title = buildTitle(state)

  return {
    item_type: state.itemType,
    title,
    detail: state.detail.trim(),
    category_label: categoryLabel,
    assignee: state.assignee,
    status: state.status,
    priority: state.priority,
    due_date: state.itemType === 'meeting_note' ? null : state.dueDate || null,
    urgent: state.urgent,
    legacy_source_type: state.itemType === 'meeting_note' ? 'meeting_notes' : 'todo_items',
    legacy_source_code:
      state.itemType === 'meeting_note' ? state.legacySourceCode.trim() || 'MAN' : null,
    legacy_source_date_label:
      state.itemType === 'meeting_note'
        ? state.legacySourceDateLabel.trim() || categoryLabel
        : null,
    legacy_source_category:
      state.itemType === 'meeting_note' ? state.legacySourceCategory.trim() || null : null,
    legacy_source_title:
      state.itemType === 'meeting_note' ? state.legacySourceTitle.trim() || title : null,
  }
}

export async function createCommandCenterItem(
  state: CommandCenterFormState
): Promise<CommandCenterItem | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const validationError = validateCommandCenterFormState(state)
  if (validationError) {
    console.error(validationError)
    return null
  }

  const { data, error } = await supabase
    .from('command_center_items')
    .insert(buildCommandCenterPayload(state))
    .select(COMMAND_CENTER_SELECT)
    .single()

  if (error || !data) {
    console.error(sanitizeError(error, 'Command center kaydı eklenemedi.'))
    return null
  }

  return mapCommandCenterRow(data as CommandCenterItemRow)
}

export async function updateCommandCenterItem(
  id: string,
  state: CommandCenterFormState
): Promise<CommandCenterItem | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const validationError = validateCommandCenterFormState(state)
  if (validationError) {
    console.error(validationError)
    return null
  }

  const { data, error } = await supabase
    .from('command_center_items')
    .update(buildCommandCenterPayload(state))
    .eq('id', id)
    .select(COMMAND_CENTER_SELECT)
    .single()

  if (error || !data) {
    console.error(sanitizeError(error, 'Command center kaydı güncellenemedi.'))
    return null
  }

  return mapCommandCenterRow(data as CommandCenterItemRow)
}

export async function deleteCommandCenterItem(id: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('command_center_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
  return !error
}

export async function archiveCommandCenterItem(id: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('command_center_items')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .is('archived_at', null)

  return !error
}

export async function fetchCommandCenterItemCounts(): Promise<CommandCenterItemCounts> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return {
      total: 0,
      todo: 0,
      meetingNote: 0,
      burak: 0,
      ubt: 0,
      team: 0,
    }
  }

  const [totalResult, todoResult, meetingNoteResult, burakResult, ubtResult, teamResult] = await Promise.all([
    supabase
      .from('command_center_items')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .is('archived_at', null),
    supabase
      .from('command_center_items')
      .select('id', { count: 'exact', head: true })
      .eq('item_type', 'todo')
      .is('deleted_at', null)
      .is('archived_at', null),
    supabase
      .from('command_center_items')
      .select('id', { count: 'exact', head: true })
      .eq('item_type', 'meeting_note')
      .is('deleted_at', null)
      .is('archived_at', null),
    supabase
      .from('command_center_items')
      .select('id', { count: 'exact', head: true })
      .eq('item_type', 'todo')
      .eq('assignee', 'Burak')
      .is('deleted_at', null)
      .is('archived_at', null),
    supabase
      .from('command_center_items')
      .select('id', { count: 'exact', head: true })
      .eq('item_type', 'todo')
      .eq('assignee', 'UBT')
      .is('deleted_at', null)
      .is('archived_at', null),
    supabase
      .from('command_center_items')
      .select('id', { count: 'exact', head: true })
      .eq('item_type', 'meeting_note')
      .is('deleted_at', null)
      .is('archived_at', null),
  ])

  return {
    total: totalResult.count ?? 0,
    todo: todoResult.count ?? 0,
    meetingNote: meetingNoteResult.count ?? 0,
    burak: burakResult.count ?? 0,
    ubt: ubtResult.count ?? 0,
    team: teamResult.count ?? 0,
  }
}

const SOURCE_SECTION_ORDER: CommandCenterSourceKind[] = ['meeting', 'wa', 'todo']
const SOURCE_SECTION_LABELS: Record<CommandCenterSourceKind, string> = {
  meeting: 'Toplantılar',
  wa: 'WhatsApp Yazışmaları',
  todo: 'Todo',
}

function getSourceKindFromDateGroupLabel(label: string): CommandCenterSourceKind {
  if (label === TODO_DATE_GROUP_LABEL) {
    return 'todo'
  }

  return label.startsWith('WA ') ? 'wa' : 'meeting'
}

/**
 * Builds a breakdown of how many active (non-archived, non-deleted) command
 * center items originate from each meeting / WhatsApp source — mirroring the
 * date-group labels shown in the "Tip" filter (e.g. "T 26 Şubat", "WA 6 Nisan").
 * Counts cover the full active list, independent of pagination or filters.
 */
export async function fetchCommandCenterSourceBreakdown(): Promise<CommandCenterSourceBreakdown> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return { sections: [], total: 0 }
  }

  const { data, error } = await supabase
    .from('command_center_items')
    .select(
      'item_type, category_label, legacy_source_code, legacy_source_date_label, legacy_source_category'
    )
    .is('deleted_at', null)
    .is('archived_at', null)

  if (error || !data) {
    return { sections: [], total: 0 }
  }

  const entryMap = new Map<string, CommandCenterSourceEntry>()
  let total = 0

  for (const row of data as Pick<
    CommandCenterItemRow,
    'item_type' | 'category_label' | 'legacy_source_code' | 'legacy_source_date_label' | 'legacy_source_category'
  >[]) {
    const dateGroup = getCommandCenterDateGroupInfo({
      itemType: row.item_type,
      categoryLabel: row.category_label,
      legacySourceCode: row.legacy_source_code,
      legacySourceDateLabel: row.legacy_source_date_label,
    })

    total += 1

    const existing = entryMap.get(dateGroup.key)
    if (existing) {
      entryMap.set(dateGroup.key, { ...existing, count: existing.count + 1 })
      continue
    }

    entryMap.set(dateGroup.key, {
      key: dateGroup.key,
      label: dateGroup.label,
      kind: getSourceKindFromDateGroupLabel(dateGroup.label),
      count: 1,
      sortValue: getDateGroupSortToken(dateGroup.label),
    })
  }

  const sections: CommandCenterSourceSection[] = SOURCE_SECTION_ORDER.map((kind) => {
    const entries = Array.from(entryMap.values())
      .filter((entry) => entry.kind === kind)
      .sort((left, right) => left.sortValue.localeCompare(right.sortValue, 'tr'))

    return {
      kind,
      label: SOURCE_SECTION_LABELS[kind],
      total: entries.reduce((sum, entry) => sum + entry.count, 0),
      entries,
    }
  }).filter((section) => section.entries.length > 0)

  return { sections, total }
}

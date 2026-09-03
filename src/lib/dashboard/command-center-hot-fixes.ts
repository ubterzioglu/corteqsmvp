import { getSupabaseBrowserClient } from './supabase'
import { sanitizeError, validateContent, validateTitle } from '@/lib/security'
import {
  TODO_ASSIGNEES,
  TODO_CATEGORIES,
  TODO_STATUSES,
  type TodoAssignee,
  type TodoStatus,
} from './todo-items'

/**
 * TOP 10 HOT FIX listesi — Komuta Merkezi'ndeki ana tablonun dar kapsamlı ikizi.
 *
 * İki davranış farkı vardır:
 * 1. **Tamamlananlar listeden çıkmaz.** Ana tabloda `Tamamlandi` kayıtlar tablodan alınıp ayrı bir
 *    akordeona taşınır; burada aynı tablonun altına düşerler ve görünür kalırlar.
 * 2. **En fazla 10 AÇIK madde.** Tamamlanan madde slot işgal etmez, yani bir maddeyi bitirir
 *    bitirmez yenisini girebilirsiniz. Sınır ayrıca DB trigger'ı ile de kilitlidir
 *    (`enforce_command_center_hot_fix_limit`).
 */
export const HOT_FIX_OPEN_LIMIT = 10

export const HOT_FIX_PRIORITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const
export type HotFixPriority = (typeof HOT_FIX_PRIORITY_OPTIONS)[number]

export const HOT_FIX_CATEGORIES = TODO_CATEGORIES
export const HOT_FIX_ASSIGNEES = TODO_ASSIGNEES
export const HOT_FIX_STATUSES = TODO_STATUSES

export type HotFixAssignee = TodoAssignee
export type HotFixStatus = TodoStatus

/** Tabloda "bitti" sayılan tek durum. Ayrı sabit, çünkü sıralama ve slot sayımı buna dayanır. */
export const HOT_FIX_COMPLETED_STATUS: HotFixStatus = 'Tamamlandi'

export interface HotFixRow {
  id: string
  title: string
  detail: string
  category_label: string
  assignee: HotFixAssignee
  status: HotFixStatus
  priority: HotFixPriority
  due_date: string | null
  urgent: boolean
  sort_order: number
  archived_at: string | null
  deleted_at: string | null
  created_at?: string
  updated_at?: string
}

export interface HotFixItem {
  id: string
  title: string
  detail: string
  categoryLabel: string
  assignee: HotFixAssignee
  status: HotFixStatus
  priority: HotFixPriority
  dueDate: string | null
  urgent: boolean
  sortOrder: number
  archivedAt: string | null
  deletedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface HotFixFormState {
  title: string
  detail: string
  categoryLabel: string
  assignee: HotFixAssignee
  status: HotFixStatus
  priority: HotFixPriority
  dueDate: string
  urgent: boolean
}

/**
 * Yazma sonucu. Ayrık birleşim (`{ok:true}|{ok:false}`) yerine düz nesne: bu projede
 * `strict`/`strictNullChecks` kapalı ve ayrık birleşim daraltması çağrı yerinde çalışmıyor.
 * `ok` false iken `item` null, `message` doludur.
 */
export interface HotFixMutationResult {
  ok: boolean
  item: HotFixItem | null
  message: string | null
}

export const HOT_FIX_SELECT =
  'id, title, detail, category_label, assignee, status, priority, due_date, urgent, sort_order, archived_at, deleted_at, created_at, updated_at'

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

/** Trigger'ın fırlattığı mesajdaki imza — kullanıcıya Türkçe metni bundan üretiyoruz. */
const HOT_FIX_LIMIT_ERROR_MARKER = 'HOT_FIX_LIMIT'

const HOT_FIX_LIMIT_MESSAGE = `TOP 10 HOT FIX listesi dolu: en fazla ${HOT_FIX_OPEN_LIMIT} açık madde tutulabilir. Yeni madde eklemek için bir maddeyi tamamlayın, arşivleyin veya silin.`

export function getHotFixStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

export function getHotFixAssigneeLabel(assignee: string): string {
  return ASSIGNEE_LABELS[assignee] ?? assignee
}

export function mapHotFixRow(row: HotFixRow): HotFixItem {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    categoryLabel: row.category_label,
    assignee: row.assignee,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    urgent: row.urgent,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  }
}

export function createEmptyHotFixFormState(
  defaults?: Partial<HotFixFormState>
): HotFixFormState {
  return {
    title: defaults?.title ?? '',
    detail: defaults?.detail ?? '',
    categoryLabel: defaults?.categoryLabel ?? HOT_FIX_CATEGORIES[0],
    assignee: defaults?.assignee ?? 'Atanmadi',
    status: defaults?.status ?? 'Baslanmadi',
    priority: defaults?.priority ?? 5,
    dueDate: defaults?.dueDate ?? '',
    urgent: defaults?.urgent ?? false,
  }
}

export function toHotFixFormState(item: HotFixItem): HotFixFormState {
  return {
    title: item.title,
    detail: item.detail,
    categoryLabel: item.categoryLabel,
    assignee: item.assignee,
    status: item.status,
    priority: item.priority,
    dueDate: item.dueDate ?? '',
    urgent: item.urgent,
  }
}

export function isHotFixCompleted(item: Pick<HotFixItem, 'status'>): boolean {
  return item.status === HOT_FIX_COMPLETED_STATUS
}

function toTimestamp(value: string | null): number {
  if (!value) return Number.NEGATIVE_INFINITY
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed
}

/**
 * Ana tablodan tek farkı: tamamlanan maddeler listeden ÇIKMAZ, listenin altına düşer.
 * Açık maddeler kendi içinde ana tablonun kuralıyla sıralanır (prio yüksekten düşüğe, sonra en yeni),
 * tamamlananlar kendi bloklarında en son bitenden en eskiye dizilir.
 */
export function sortHotFixItems(items: HotFixItem[]): HotFixItem[] {
  return [...items].sort((left, right) => {
    const leftCompleted = isHotFixCompleted(left)
    const rightCompleted = isHotFixCompleted(right)

    if (leftCompleted !== rightCompleted) {
      return leftCompleted ? 1 : -1
    }

    if (leftCompleted) {
      const completionDiff =
        toTimestamp(right.updatedAt ?? right.createdAt) -
        toTimestamp(left.updatedAt ?? left.createdAt)
      if (completionDiff !== 0) {
        return completionDiff
      }

      return left.title.localeCompare(right.title, 'tr')
    }

    if (left.priority !== right.priority) {
      return right.priority - left.priority
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder
    }

    const createdDiff = toTimestamp(right.createdAt) - toTimestamp(left.createdAt)
    if (createdDiff !== 0) {
      return createdDiff
    }

    return left.title.localeCompare(right.title, 'tr')
  })
}

/** Slot sayımı: yalnız açık maddeler. Tamamlananlar listede durur ama yer tutmaz. */
export function countOpenHotFixItems(items: HotFixItem[]): number {
  return items.filter((item) => !isHotFixCompleted(item)).length
}

export function isHotFixLimitReached(items: HotFixItem[]): boolean {
  return countOpenHotFixItems(items) >= HOT_FIX_OPEN_LIMIT
}

export function getHotFixLimitMessage(): string {
  return HOT_FIX_LIMIT_MESSAGE
}

function buildHotFixTitle(state: HotFixFormState): string {
  const fallback = state.detail.trim().slice(0, 80) || 'Yeni hot fix'
  return (state.title.trim() || fallback).slice(0, 160)
}

export function validateHotFixFormState(state: HotFixFormState): string | null {
  const titleError = validateTitle(buildHotFixTitle(state))
  if (titleError) return titleError

  const detailError = validateContent(state.detail)
  if (detailError) return detailError

  if (!state.categoryLabel.trim()) {
    return 'Kategori boş bırakılamaz.'
  }

  if (
    !HOT_FIX_ASSIGNEES.includes(state.assignee) ||
    !HOT_FIX_STATUSES.includes(state.status)
  ) {
    return 'Geçersiz atama veya durum.'
  }

  if (
    !Number.isInteger(state.priority) ||
    state.priority < HOT_FIX_PRIORITY_OPTIONS[0] ||
    state.priority > HOT_FIX_PRIORITY_OPTIONS[HOT_FIX_PRIORITY_OPTIONS.length - 1]
  ) {
    return 'Geçersiz prio değeri.'
  }

  return null
}

function buildHotFixPayload(state: HotFixFormState) {
  return {
    title: buildHotFixTitle(state),
    detail: state.detail.trim(),
    category_label: state.categoryLabel.trim() || 'Genel',
    assignee: state.assignee,
    status: state.status,
    priority: state.priority,
    due_date: state.dueDate || null,
    urgent: state.urgent,
  }
}

/**
 * Trigger'dan gelen sınır hatasını kullanıcıya gösterilebilir Türkçe mesaja çevirir.
 * PostgREST hataları `Error` örneği DEĞİL, düz nesnedir — `message`/`details`/`hint` okunur.
 */
function toHotFixErrorMessage(error: unknown, fallbackMessage: string): string {
  const parts: string[] = []

  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown; details?: unknown; hint?: unknown }
    for (const value of [candidate.message, candidate.details, candidate.hint]) {
      if (typeof value === 'string') parts.push(value)
    }
  } else if (typeof error === 'string') {
    parts.push(error)
  }

  if (parts.some((part) => part.includes(HOT_FIX_LIMIT_ERROR_MARKER))) {
    return HOT_FIX_LIMIT_MESSAGE
  }

  return sanitizeError(error, fallbackMessage)
}

export async function fetchHotFixItems(): Promise<HotFixItem[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('command_center_hot_fixes')
    .select(HOT_FIX_SELECT)
    .is('deleted_at', null)
    .is('archived_at', null)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(toHotFixErrorMessage(error, 'Hot fix kayıtları yüklenemedi.'))
  }

  return sortHotFixItems(((data ?? []) as HotFixRow[]).map(mapHotFixRow))
}

/**
 * Arşiv listesi zamanla büyür ve PostgREST 1000 satırda HATA VERMEDEN keser. Burada bilinçli olarak
 * son 100 kayıtla sınırlanır — panel bunu yalnız "arşive ne gitti" görünürlüğü için kullanır;
 * tam arşiv dökümü gerekirse sayfalama eklenmelidir.
 */
export const HOT_FIX_ARCHIVE_FETCH_LIMIT = 100

export async function fetchArchivedHotFixItems(): Promise<HotFixItem[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('command_center_hot_fixes')
    .select(HOT_FIX_SELECT)
    .is('deleted_at', null)
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false })
    .limit(HOT_FIX_ARCHIVE_FETCH_LIMIT)

  if (error) {
    throw new Error(toHotFixErrorMessage(error, 'Arşivlenen hot fix kayıtları yüklenemedi.'))
  }

  return ((data ?? []) as HotFixRow[]).map(mapHotFixRow)
}

export async function createHotFixItem(state: HotFixFormState): Promise<HotFixMutationResult> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return { ok: false, item: null, message: 'Veritabanı bağlantısı yapılandırılmamış.' }
  }

  const validationError = validateHotFixFormState(state)
  if (validationError) {
    return { ok: false, item: null, message: validationError }
  }

  const { data, error } = await supabase
    .from('command_center_hot_fixes')
    .insert(buildHotFixPayload(state))
    .select(HOT_FIX_SELECT)
    .single()

  if (error || !data) {
    return {
      ok: false,
      item: null,
      message: toHotFixErrorMessage(error, 'Hot fix kaydı eklenemedi.'),
    }
  }

  return { ok: true, item: mapHotFixRow(data as HotFixRow), message: null }
}

export async function updateHotFixItem(
  id: string,
  state: HotFixFormState
): Promise<HotFixMutationResult> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return { ok: false, item: null, message: 'Veritabanı bağlantısı yapılandırılmamış.' }
  }

  const validationError = validateHotFixFormState(state)
  if (validationError) {
    return { ok: false, item: null, message: validationError }
  }

  const { data, error } = await supabase
    .from('command_center_hot_fixes')
    .update(buildHotFixPayload(state))
    .eq('id', id)
    .select(HOT_FIX_SELECT)
    .single()

  if (error || !data) {
    return {
      ok: false,
      item: null,
      message: toHotFixErrorMessage(error, 'Hot fix kaydı güncellenemedi.'),
    }
  }

  return { ok: true, item: mapHotFixRow(data as HotFixRow), message: null }
}

export async function archiveHotFixItem(id: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('command_center_hot_fixes')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .is('archived_at', null)

  return !error
}

export async function deleteHotFixItem(id: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('command_center_hot_fixes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)

  return !error
}

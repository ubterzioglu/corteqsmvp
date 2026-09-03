'use client'

import { Dispatch, Fragment, SetStateAction, useId } from 'react'
import { Archive, Pencil, Save, Trash2, X } from 'lucide-react'
import {
  getHotFixAssigneeLabel,
  getHotFixStatusLabel,
  HOT_FIX_ASSIGNEES,
  HOT_FIX_CATEGORIES,
  HOT_FIX_PRIORITY_OPTIONS,
  HOT_FIX_STATUSES,
  isHotFixCompleted,
  toHotFixFormState,
  type HotFixFormState,
  type HotFixItem,
} from '@/lib/dashboard/command-center-hot-fixes'
import { normalizeTodoAssignee } from '@/lib/dashboard/todo-items'

const burakAvatar = '/burak.png'
const ubtAvatar = '/ubt.png'

const TABLE_INPUT_CLS =
  'h-10 w-full min-w-0 rounded-xl border border-[rgba(220,38,38,0.18)] bg-white px-3 py-2 text-[12px] text-gray-800 placeholder-gray-400 shadow-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400'
const BTN_CLS =
  'inline-flex items-center justify-center gap-1 rounded-xl px-2.5 py-2 text-[11px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60'
const CHECKBOX_CLS =
  'h-4 w-4 rounded border border-[rgba(220,38,38,0.25)] text-red-500 focus:ring-2 focus:ring-red-200'
const EDITOR_LABEL_CLS = 'text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500'

const STATUS_COLORS: Record<string, string> = {
  Baslanmadi: '#888888',
  Beklemede: '#F5A500',
  'Devam ediyor': '#1A6DC2',
  Tamamlandi: '#4CAF50',
}

const HOT_FIX_COLOR = '#DC2626'
const COLUMN_COUNT = 9

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function formatShortDate(value: string | null): string {
  if (!value) return '—'

  // `due_date` saat taşımayan bir `date` sütunu. `new Date('2026-09-10')` bunu UTC gece yarısı
  // olarak okur; UTC'nin gerisindeki bir saat diliminde bir gün geriye kayar. Gün/ay/yıl doğrudan
  // metinden okunarak bu kayma engellenir.
  const dateOnly = DATE_ONLY_PATTERN.exec(value)
  if (dateOnly) {
    const [, year, month, day] = dateOnly
    return `${day}.${month}.${year.slice(2)}`
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function getDetail(value: string): string {
  return value.trim() || 'Detay yok'
}

export interface HotFixTableProps {
  items: HotFixItem[]
  editingId: string | null
  editingState: HotFixFormState
  setEditingState: Dispatch<SetStateAction<HotFixFormState>>
  isSubmitting: boolean
  onStartEdit: (item: HotFixItem) => void
  onCancelEdit: () => void
  onUpdate: (itemId: string) => void
  onArchive: (itemId: string) => void
  onDelete: (itemId: string) => void
}

/**
 * Komuta Merkezi ana tablosunun hot fix ikizi. Tek yapısal fark: tamamlanan maddeler ayrı bir
 * akordeona taşınmaz — aynı `tbody` içinde kalır, sadece en alta iner ve soluklaşır. Açık ile
 * tamamlanan blokların arasına ayırıcı satır konur.
 */
export default function HotFixTable({
  items,
  editingId,
  editingState,
  setEditingState,
  isSubmitting,
  onStartEdit,
  onCancelEdit,
  onUpdate,
  onArchive,
  onDelete,
}: HotFixTableProps) {
  const firstCompletedId = items.find(isHotFixCompleted)?.id ?? null
  const hasOpenItems = items.some((item) => !isHotFixCompleted(item))

  return (
    <div className="rounded-2xl border border-[rgba(220,38,38,0.14)] bg-white shadow-[0_10px_20px_rgba(60,64,67,0.04)]">
      <div className="hidden md:block">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[5%]" />
            <col className="w-[4%]" />
            <col className="w-[14%]" />
            <col className="w-[35%]" />
            <col className="w-[8%]" />
            <col className="w-[10%]" />
            <col className="w-[8%]" />
            <col className="w-[7%]" />
            <col className="w-[9%]" />
          </colgroup>
          <thead className="border-b border-[rgba(220,38,38,0.1)] bg-[rgba(220,38,38,0.03)]">
            <tr>
              {['Prio', 'Acil', 'Kategori', 'Başlık & Detay', 'Kim', 'Durum', 'Termin', 'Eklenme', 'İşlem'].map(
                (column) => (
                  <th
                    key={column}
                    scope="col"
                    className="px-2.5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 first:pl-4 last:pr-4"
                  >
                    {column}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const rowIsEditing = editingId === item.id
              const rowState = rowIsEditing ? editingState : toHotFixFormState(item)
              const completed = isHotFixCompleted(item)
              const showCompletedDivider = hasOpenItems && item.id === firstCompletedId

              if (rowIsEditing) {
                return (
                  <tr key={item.id} className="bg-[rgba(220,38,38,0.03)]">
                    <td colSpan={COLUMN_COUNT} className="px-4 py-4">
                      <HotFixRowEditor
                        state={rowState}
                        setEditingState={setEditingState}
                        isSubmitting={isSubmitting}
                        onSave={() => onUpdate(item.id)}
                        onCancel={onCancelEdit}
                      />
                    </td>
                  </tr>
                )
              }

              return (
                <Fragment key={item.id}>
                  {showCompletedDivider && (
                    <tr className="bg-green-50/60">
                      <td
                        colSpan={COLUMN_COUNT}
                        className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-green-700"
                      >
                        Tamamlananlar — slot işgal etmez, listede kalır
                      </td>
                    </tr>
                  )}
                  <tr className={completed ? 'bg-green-50/40 text-gray-500' : undefined}>
                    <td className="px-2.5 py-3 pl-4 align-middle">
                      <span className="text-[13px] font-semibold text-gray-800">{item.priority}</span>
                    </td>
                    <td className="px-2.5 py-3 align-middle">
                      <UrgentIndicator urgent={item.urgent} />
                    </td>
                    <td className="px-2.5 py-3 align-middle">
                      <CategoryBadge label={item.categoryLabel} />
                    </td>
                    <td className="px-2.5 py-3 align-middle">
                      <div className="space-y-1">
                        <p
                          className={`text-[13px] font-medium ${
                            completed ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="text-[12px] leading-5 text-gray-600">{getDetail(item.detail)}</p>
                      </div>
                    </td>
                    <td className="px-2.5 py-3 align-middle">
                      <AssigneeCell assignee={item.assignee} />
                    </td>
                    <td className="px-2.5 py-3 align-middle">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-3 align-middle text-[12px] text-gray-600">
                      {formatShortDate(item.dueDate)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-3 align-middle text-[12px] text-gray-600">
                      {formatShortDate(item.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-1.5 py-3 pr-4 align-middle">
                      <RowActions
                        isSubmitting={isSubmitting}
                        isLocked={editingId !== null}
                        onEdit={() => onStartEdit(item)}
                        onArchive={() => onArchive(item.id)}
                        onDelete={() => onDelete(item.id)}
                      />
                    </td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {items.map((item) => {
          const rowIsEditing = editingId === item.id
          const rowState = rowIsEditing ? editingState : toHotFixFormState(item)
          const completed = isHotFixCompleted(item)

          return (
            <div
              key={item.id}
              className={`space-y-3 rounded-2xl border p-4 shadow-[0_10px_20px_rgba(60,64,67,0.04)] ${
                completed
                  ? 'border-green-200 bg-green-50/50'
                  : 'border-[rgba(220,38,38,0.14)] bg-white'
              }`}
            >
              {rowIsEditing ? (
                <HotFixRowEditor
                  state={rowState}
                  setEditingState={setEditingState}
                  isSubmitting={isSubmitting}
                  onSave={() => onUpdate(item.id)}
                  onCancel={onCancelEdit}
                />
              ) : (
                <>
                  <div className="space-y-2">
                    <UrgentIndicator urgent={item.urgent} mobile />
                    <h3
                      className={`text-[15px] font-semibold ${
                        completed ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p className="text-[13px] leading-5 text-gray-700">{getDetail(item.detail)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <MobileInfoPair label="Prio" value={String(item.priority)} />
                    <MobileInfoPair label="Kategori" value={item.categoryLabel} />
                    <MobileInfoPair label="Kim" value={item.assignee} assignee={item.assignee} />
                    <MobileInfoPair label="Durum" value={getHotFixStatusLabel(item.status)} />
                    <MobileInfoPair label="Termin" value={formatShortDate(item.dueDate)} />
                    <MobileInfoPair label="Eklenme" value={formatShortDate(item.createdAt)} />
                  </div>

                  <RowActions
                    isSubmitting={isSubmitting}
                    isLocked={editingId !== null}
                    onEdit={() => onStartEdit(item)}
                    onArchive={() => onArchive(item.id)}
                    onDelete={() => onDelete(item.id)}
                  />
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface HotFixRowEditorProps {
  state: HotFixFormState
  setEditingState: Dispatch<SetStateAction<HotFixFormState>>
  isSubmitting: boolean
  onSave: () => void
  onCancel: () => void
}

function HotFixRowEditor({
  state,
  setEditingState,
  isSubmitting,
  onSave,
  onCancel,
}: HotFixRowEditorProps) {
  // Düzenleyici masaüstü tablosunda ve mobil kart listesinde AYNI ANDA render edilir
  // (biri CSS ile gizlenir). Sabit id kullanılırsa DOM'da mükerrer id oluşur; useId ayırır.
  const fieldId = useId()

  return (
    <div className="rounded-3xl border border-[rgba(220,38,38,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,247,0.96))] p-4 shadow-[0_18px_40px_rgba(60,64,67,0.08)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-900">Hot Fix Düzenle</p>
          <p className="text-xs text-gray-500">
            Durumu «Tamamlandı» yaparsanız kayıt listeden çıkmaz, tablonun altına iner ve slotu boşaltır.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={isSubmitting}
            className={`${BTN_CLS} border border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}
          >
            <Save size={14} aria-hidden="true" />
            Kaydet
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className={`${BTN_CLS} border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800`}
          >
            <X size={14} aria-hidden="true" />
            İptal
          </button>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <div className="space-y-3 rounded-2xl border border-[rgba(220,38,38,0.12)] bg-white/90 p-3">
          <div className="space-y-1.5">
            <label className={EDITOR_LABEL_CLS} htmlFor={`${fieldId}-title`}>
              Başlık
            </label>
            <input
              id={`${fieldId}-title`}
              type="text"
              value={state.title}
              onChange={(event) =>
                setEditingState((current) => ({ ...current, title: event.target.value }))
              }
              className={TABLE_INPUT_CLS}
              placeholder="Başlık"
            />
          </div>
          <div className="space-y-1.5">
            <label className={EDITOR_LABEL_CLS} htmlFor={`${fieldId}-detail`}>
              Detay
            </label>
            <textarea
              id={`${fieldId}-detail`}
              value={state.detail}
              onChange={(event) =>
                setEditingState((current) => ({ ...current, detail: event.target.value }))
              }
              className={`${TABLE_INPUT_CLS} h-auto min-h-[128px] resize-y leading-5`}
              rows={5}
              placeholder="Detay"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 rounded-2xl border border-[rgba(220,38,38,0.12)] bg-white/90 p-3">
            <label className={EDITOR_LABEL_CLS} htmlFor={`${fieldId}-priority`}>
              Öncelik
            </label>
            <select
              id={`${fieldId}-priority`}
              value={state.priority}
              onChange={(event) =>
                setEditingState((current) => ({
                  ...current,
                  priority: Number(event.target.value) as HotFixFormState['priority'],
                }))
              }
              className={TABLE_INPUT_CLS}
            >
              {HOT_FIX_PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 rounded-2xl border border-[rgba(220,38,38,0.12)] bg-white/90 p-3">
            <span className={EDITOR_LABEL_CLS}>Acil</span>
            <label className="flex h-10 items-center gap-2 rounded-xl border border-[rgba(220,38,38,0.18)] bg-white px-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={state.urgent}
                onChange={(event) =>
                  setEditingState((current) => ({ ...current, urgent: event.target.checked }))
                }
                className={CHECKBOX_CLS}
              />
              Öncelikli işaretle
            </label>
          </div>

          <div className="space-y-1.5 rounded-2xl border border-[rgba(220,38,38,0.12)] bg-white/90 p-3">
            <label className={EDITOR_LABEL_CLS} htmlFor={`${fieldId}-category`}>
              Kategori
            </label>
            <select
              id={`${fieldId}-category`}
              value={state.categoryLabel}
              onChange={(event) =>
                setEditingState((current) => ({ ...current, categoryLabel: event.target.value }))
              }
              className={TABLE_INPUT_CLS}
            >
              {HOT_FIX_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 rounded-2xl border border-[rgba(220,38,38,0.12)] bg-white/90 p-3">
            <label className={EDITOR_LABEL_CLS} htmlFor={`${fieldId}-assignee`}>
              Kim
            </label>
            <select
              id={`${fieldId}-assignee`}
              value={state.assignee}
              onChange={(event) =>
                setEditingState((current) => ({
                  ...current,
                  assignee: event.target.value as HotFixFormState['assignee'],
                }))
              }
              className={TABLE_INPUT_CLS}
            >
              {HOT_FIX_ASSIGNEES.map((assignee) => (
                <option key={assignee} value={assignee}>
                  {getHotFixAssigneeLabel(assignee)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 rounded-2xl border border-[rgba(220,38,38,0.12)] bg-white/90 p-3">
            <label className={EDITOR_LABEL_CLS} htmlFor={`${fieldId}-status`}>
              Durum
            </label>
            <select
              id={`${fieldId}-status`}
              value={state.status}
              onChange={(event) =>
                setEditingState((current) => ({
                  ...current,
                  status: event.target.value as HotFixFormState['status'],
                }))
              }
              className={TABLE_INPUT_CLS}
            >
              {HOT_FIX_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getHotFixStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 rounded-2xl border border-[rgba(220,38,38,0.12)] bg-white/90 p-3">
            <label className={EDITOR_LABEL_CLS} htmlFor={`${fieldId}-due-date`}>
              Termin
            </label>
            <input
              id={`${fieldId}-due-date`}
              type="date"
              value={state.dueDate}
              onChange={(event) =>
                setEditingState((current) => ({ ...current, dueDate: event.target.value }))
              }
              className={TABLE_INPUT_CLS}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface RowActionsProps {
  isSubmitting: boolean
  isLocked: boolean
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
}

function RowActions({ isSubmitting, isLocked, onEdit, onArchive, onDelete }: RowActionsProps) {
  return (
    <div className="flex flex-nowrap items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={onEdit}
        disabled={isSubmitting || isLocked}
        className={`${BTN_CLS} border border-gray-200 text-gray-500 hover:text-gray-700`}
        aria-label="Düzenle"
        title="Düzenle"
      >
        <Pencil size={12} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onArchive}
        disabled={isSubmitting || isLocked}
        className={`${BTN_CLS} border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100`}
        aria-label="Arşivle"
        title="Arşivle"
      >
        <Archive size={12} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={isSubmitting}
        className={`${BTN_CLS} border border-red-200 bg-red-50 text-red-600 hover:bg-red-100`}
        aria-label="Sil"
        title="Sil"
      >
        <Trash2 size={12} aria-hidden="true" />
      </button>
    </div>
  )
}

function CategoryBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium leading-none"
      style={{ color: HOT_FIX_COLOR, background: `${HOT_FIX_COLOR}14` }}
    >
      {label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#888888'

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium leading-none"
      style={{ color, background: `${color}18` }}
    >
      {getHotFixStatusLabel(status)}
    </span>
  )
}

function AssigneeAvatar({ assignee }: { assignee: string }) {
  const normalized = normalizeTodoAssignee(assignee)
  const src =
    normalized === normalizeTodoAssignee('Burak')
      ? burakAvatar
      : normalized === normalizeTodoAssignee('UBT')
        ? ubtAvatar
        : null

  if (!src) {
    return <span className="text-[11px] font-medium text-gray-500">{getHotFixAssigneeLabel(assignee)}</span>
  }

  return (
    <img
      src={src}
      alt={assignee}
      width={36}
      height={36}
      className="h-9 w-9 rounded-full border border-white/80 object-cover shadow-[0_10px_20px_rgba(60,64,67,0.2)]"
    />
  )
}

function AssigneeCell({ assignee }: { assignee: string }) {
  return (
    <div className="flex min-h-[40px] items-center justify-center">
      <AssigneeAvatar assignee={assignee} />
    </div>
  )
}

function UrgentIndicator({ urgent, mobile = false }: { urgent: boolean; mobile?: boolean }) {
  if (!urgent) {
    return mobile ? null : <span className="block h-6 w-6" aria-hidden="true" />
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-[0_8px_18px_rgba(220,38,38,0.28)] ${
        mobile ? 'h-6 min-w-6 px-2' : 'h-6 w-6'
      }`}
      aria-label="Acil kayıt"
      title="Acil kayıt"
    >
      !
    </span>
  )
}

function MobileInfoPair({
  label,
  value,
  assignee,
}: {
  label: string
  value: string
  assignee?: string
}) {
  return (
    <div className="space-y-1 rounded-xl border border-[rgba(220,38,38,0.1)] bg-gray-50/50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">{label}</p>
      {label === 'Kim' ? (
        <div className="flex min-h-[40px] items-center justify-center">
          <AssigneeAvatar assignee={assignee ?? value} />
        </div>
      ) : (
        <p className="text-[13px] text-gray-800">{value}</p>
      )}
    </div>
  )
}

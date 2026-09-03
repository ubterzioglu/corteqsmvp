'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Flame, Plus } from 'lucide-react'
import AccordionCard from '@/components/dashboard/AccordionCard'
import HotFixTable from './HotFixTable'
import {
  archiveHotFixItem,
  countOpenHotFixItems,
  createEmptyHotFixFormState,
  createHotFixItem,
  deleteHotFixItem,
  fetchArchivedHotFixItems,
  fetchHotFixItems,
  getHotFixAssigneeLabel,
  getHotFixLimitMessage,
  getHotFixStatusLabel,
  HOT_FIX_ASSIGNEES,
  HOT_FIX_CATEGORIES,
  HOT_FIX_OPEN_LIMIT,
  HOT_FIX_PRIORITY_OPTIONS,
  HOT_FIX_STATUSES,
  isHotFixLimitReached,
  sortHotFixItems,
  toHotFixFormState,
  updateHotFixItem,
  type HotFixFormState,
  type HotFixItem,
} from '@/lib/dashboard/command-center-hot-fixes'

const INPUT_CLS =
  'w-full rounded-xl border border-[rgba(220,38,38,0.18)] bg-white px-3 py-2 text-[13px] text-gray-800 placeholder-gray-400 shadow-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400'
const FIELD_LABEL_CLS = 'text-xs font-semibold uppercase tracking-widest text-gray-500'
const HOT_FIX_ACCENT = '#DC2626'

function formatArchivedAt(value: string | null): string {
  if (!value) return 'Bilinmiyor'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Bilinmiyor'

  return date.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
}

/**
 * Komuta Merkezi'ndeki "TOP 10 HOT FIX" bloğu — ana tablonun ikizi, iki bilinçli farkla:
 * tamamlanan maddeler ayrı bir akordeona taşınmaz (aynı tablonun altına iner) ve liste
 * en fazla {@link HOT_FIX_OPEN_LIMIT} AÇIK madde tutar. Tamamlanan madde slot işgal etmediği için
 * bir işi bitirir bitirmez yenisi girilebilir.
 */
export default function HotFixPanel() {
  const [items, setItems] = useState<HotFixItem[]>([])
  const [archivedItems, setArchivedItems] = useState<HotFixItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<HotFixFormState>(() => createEmptyHotFixFormState())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingState, setEditingState] = useState<HotFixFormState>(() =>
    createEmptyHotFixFormState()
  )

  const openCount = useMemo(() => countOpenHotFixItems(items), [items])
  const limitReached = useMemo(() => isHotFixLimitReached(items), [items])
  const completedCount = items.length - openCount

  const loadItems = useCallback(async () => {
    try {
      const [active, archived] = await Promise.all([
        fetchHotFixItems(),
        fetchArchivedHotFixItems(),
      ])
      setItems(active)
      setArchivedItems(archived)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Hot fix kayıtları yüklenemedi.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (limitReached) {
      setError(getHotFixLimitMessage())
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await createHotFixItem(formState)
    if (!result.ok) {
      setError(result.message)
      setIsSubmitting(false)
      return
    }

    setItems((current) => sortHotFixItems([...current, result.item]))
    setFormState(createEmptyHotFixFormState())
    setIsSubmitting(false)
  }

  function startEdit(item: HotFixItem) {
    setEditingId(item.id)
    setEditingState(toHotFixFormState(item))
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingState(createEmptyHotFixFormState())
  }

  async function handleUpdate(itemId: string) {
    setIsSubmitting(true)
    setError(null)

    const result = await updateHotFixItem(itemId, editingState)
    if (!result.ok) {
      setError(result.message)
      setIsSubmitting(false)
      return
    }

    setItems((current) =>
      sortHotFixItems(current.map((item) => (item.id === itemId ? result.item : item)))
    )
    cancelEdit()
    setIsSubmitting(false)
  }

  async function handleArchive(itemId: string) {
    setIsSubmitting(true)
    setError(null)

    const archived = await archiveHotFixItem(itemId)
    if (!archived) {
      setError('Hot fix kaydı arşivlenemedi.')
      setIsSubmitting(false)
      return
    }

    await loadItems()
    setIsSubmitting(false)
  }

  async function handleDelete(itemId: string) {
    setIsSubmitting(true)
    setError(null)

    const deleted = await deleteHotFixItem(itemId)
    if (!deleted) {
      setError('Hot fix kaydı silinemedi.')
      setIsSubmitting(false)
      return
    }

    setItems((current) => current.filter((item) => item.id !== itemId))
    setIsSubmitting(false)
  }

  return (
    <section className="space-y-4" aria-labelledby="hot-fix-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(220,38,38,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,246,246,0.96))] px-4 py-3 shadow-[0_10px_20px_rgba(60,64,67,0.04)]">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <Flame size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 id="hot-fix-heading" className="text-sm font-semibold text-gray-900">
              TOP 10 HOT FIX
            </h2>
            <p className="text-xs text-gray-500">
              En fazla {HOT_FIX_OPEN_LIMIT} açık madde. Tamamlananlar listeden çıkmaz, tablonun altına
              iner ve slotu boşaltır.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span
            className={`rounded-full px-3 py-1 ${
              limitReached ? 'bg-red-100 text-red-700' : 'bg-red-50 text-red-600'
            }`}
          >
            Açık: {openCount} / {HOT_FIX_OPEN_LIMIT}
          </span>
          <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">
            Tamamlanan: {completedCount}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      <AccordionCard
        items={[
          {
            id: 'new-hot-fix-item',
            title: 'Yeni Hot Fix Ekle',
            badge: `${HOT_FIX_OPEN_LIMIT - openCount} slot`,
            accentColor: HOT_FIX_ACCENT,
            children: limitReached ? (
              <div className="rounded-2xl border border-dashed border-red-200 bg-red-50/60 p-6 text-center text-sm text-red-700">
                {getHotFixLimitMessage()}
              </div>
            ) : (
              <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-2 xl:col-span-2">
                  <span className={FIELD_LABEL_CLS}>Başlık</span>
                  <input
                    type="text"
                    value={formState.title}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Opsiyonel kısa başlık"
                    className={INPUT_CLS}
                  />
                </label>

                <label className="space-y-2">
                  <span className={FIELD_LABEL_CLS}>Kategori</span>
                  <select
                    value={formState.categoryLabel}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, categoryLabel: event.target.value }))
                    }
                    className={INPUT_CLS}
                    required
                  >
                    {HOT_FIX_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className={FIELD_LABEL_CLS}>Kim</span>
                  <select
                    value={formState.assignee}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        assignee: event.target.value as HotFixFormState['assignee'],
                      }))
                    }
                    className={INPUT_CLS}
                  >
                    {HOT_FIX_ASSIGNEES.map((assignee) => (
                      <option key={assignee} value={assignee}>
                        {getHotFixAssigneeLabel(assignee)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 md:col-span-2 xl:col-span-4">
                  <span className={FIELD_LABEL_CLS}>Detay</span>
                  <textarea
                    value={formState.detail}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, detail: event.target.value }))
                    }
                    placeholder="Ne bozuk, nasıl tekrar ediliyor, ne yapılacak?"
                    rows={3}
                    className={`${INPUT_CLS} resize-y leading-5`}
                    required
                  />
                </label>

                <label className="space-y-2">
                  <span className={FIELD_LABEL_CLS}>Durum</span>
                  <select
                    value={formState.status}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        status: event.target.value as HotFixFormState['status'],
                      }))
                    }
                    className={INPUT_CLS}
                  >
                    {HOT_FIX_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {getHotFixStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className={FIELD_LABEL_CLS}>Prio</span>
                  <select
                    value={formState.priority}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        priority: Number(event.target.value) as HotFixFormState['priority'],
                      }))
                    }
                    className={INPUT_CLS}
                  >
                    {HOT_FIX_PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className={FIELD_LABEL_CLS}>Termin</span>
                  <input
                    type="date"
                    value={formState.dueDate}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, dueDate: event.target.value }))
                    }
                    className={INPUT_CLS}
                  />
                </label>

                <div className="flex items-end gap-3">
                  <label className="flex flex-1 items-center gap-3 rounded-xl border border-red-100 bg-red-50/70 px-3.5 py-2.5 text-sm font-semibold text-red-700">
                    <input
                      type="checkbox"
                      checked={formState.urgent}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, urgent: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border border-[rgba(220,38,38,0.25)] text-red-500 focus:ring-2 focus:ring-red-200"
                    />
                    Acil!
                  </label>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus size={16} aria-hidden="true" />
                    Ekle
                  </button>
                </div>
              </form>
            ),
          },
        ]}
        className="border-red-100 bg-red-50/20"
      />

      {isLoading ? (
        <div className="rounded-2xl border border-[rgba(220,38,38,0.12)] bg-white/80 p-8 text-center text-sm text-gray-400">
          Yükleniyor…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-red-200 bg-white p-8 text-center text-sm text-gray-500">
          Henüz hot fix yok. Yukarıdaki formla ilk maddeyi ekleyin.
        </div>
      ) : (
        <HotFixTable
          items={items}
          editingId={editingId}
          editingState={editingState}
          setEditingState={setEditingState}
          isSubmitting={isSubmitting}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onUpdate={handleUpdate}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      )}

      {!isLoading && archivedItems.length > 0 && (
        <AccordionCard
          items={[
            {
              id: 'archived-hot-fix-items',
              title: 'Arşivlenen Hot Fixler',
              badge: String(archivedItems.length),
              accentColor: '#D97706',
              children: (
                <ul className="space-y-2">
                  {archivedItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-100 bg-white/80 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-gray-800">{item.title}</span>
                      <span className="text-xs text-gray-500">
                        {item.categoryLabel} · {getHotFixStatusLabel(item.status)} ·{' '}
                        {formatArchivedAt(item.archivedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              ),
            },
          ]}
          className="border-amber-100 bg-amber-50/30"
        />
      )}
    </section>
  )
}

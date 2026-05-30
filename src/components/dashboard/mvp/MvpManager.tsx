'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import AccordionCard from '@/components/dashboard/AccordionCard'
import KonuCard from './KonuCard'
import { getSupabaseBrowserClient } from '@/lib/dashboard/supabase'
import {
  MVP_LEVELS,
  MVP_AUTHORS,
  MVP_COLORS,
  INPUT_CLS,
  createEmptyMvpFormState,
  groupItemsByKonu,
  mapMvpRow,
  type MvpFormState,
  type MvpItem,
  type MvpItemRow,
} from '@/lib/dashboard/mvp-items'

export default function MvpManager() {
  const [items, setItems] = useState<MvpItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<MvpFormState>(createEmptyMvpFormState)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingState, setEditingState] = useState<MvpFormState>(createEmptyMvpFormState)

  const supabase = getSupabaseBrowserClient()

  const konuGroups = useMemo(() => groupItemsByKonu(items), [items])

  useEffect(() => {
    void loadItems()
  }, [])

  async function loadItems() {
    if (!supabase) {
      setError('Supabase bağlantısı yapılandırılmamış.')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from('mvp_items')
        .select('id, konu, sub, ayrinti, mvp_level, added_by, is_seed, created_at, updated_at')
        .order('created_at', { ascending: false })
      if (fetchErr) throw fetchErr
      setItems((data as MvpItemRow[]).map(mapMvpRow))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'MVP listesi yüklenemedi.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setIsSubmitting(true)
    setError(null)
    try {
      const insertPayload = {
        konu: formState.konu,
        sub: formState.sub.trim() || null,
        ayrinti: formState.ayrinti.trim() || null,
        mvp_level: formState.mvpLevel,
        added_by: formState.addedBy,
      }
      const { data, error: insertErr } = await supabase
        .from('mvp_items')
        .insert(insertPayload)
        .select('id, konu, sub, ayrinti, mvp_level, added_by, is_seed, created_at, updated_at')
        .single()
      if (insertErr || !data) throw insertErr ?? new Error('Madde eklenemedi.')
      setItems((prev) => [mapMvpRow(data as MvpItemRow), ...prev])
      setFormState(createEmptyMvpFormState())
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Madde eklenemedi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function startEdit(item: MvpItem) {
    setEditingId(item.id)
    setEditingState({
      konu: item.konu,
      sub: item.sub ?? '',
      ayrinti: item.ayrinti ?? '',
      mvpLevel: item.mvpLevel,
      addedBy: item.addedBy,
    })
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingState(createEmptyMvpFormState())
  }

  async function handleInlineUpdate(itemId: string, field: 'mvp_level' | 'added_by', value: string) {
    if (!supabase) return
    try {
      const { data, error: updateErr } = await supabase
        .from('mvp_items')
        .update({ [field]: value })
        .eq('id', itemId)
        .select('id, konu, sub, ayrinti, mvp_level, added_by, is_seed, created_at, updated_at')
        .single()
      if (updateErr || !data) throw updateErr
      setItems((prev) => prev.map((i) => (i.id === itemId ? mapMvpRow(data as MvpItemRow) : i)))
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Güncellenemedi.')
    }
  }

  async function handleUpdate(itemId: string) {
    if (!supabase) return
    setIsSubmitting(true)
    setError(null)
    try {
      const updatePayload = {
        konu: editingState.konu,
        sub: editingState.sub.trim() || null,
        ayrinti: editingState.ayrinti.trim() || null,
        mvp_level: editingState.mvpLevel,
        added_by: editingState.addedBy,
      }
      const { data, error: updateErr } = await supabase
        .from('mvp_items')
        .update(updatePayload)
        .eq('id', itemId)
        .select('id, konu, sub, ayrinti, mvp_level, added_by, is_seed, created_at, updated_at')
        .single()
      if (updateErr || !data) throw updateErr ?? new Error('Madde güncellenemedi.')
      setItems((prev) => prev.map((i) => (i.id === itemId ? mapMvpRow(data as MvpItemRow) : i)))
      cancelEdit()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Madde güncellenemedi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(itemId: string) {
    if (!supabase) return
    if (typeof window !== 'undefined' && !window.confirm('Bu madde silinsin mi?')) return
    setIsSubmitting(true)
    setError(null)
    try {
      const { error: deleteErr } = await supabase.from('mvp_items').delete().eq('id', itemId)
      if (deleteErr) throw deleteErr
      setItems((prev) => prev.filter((i) => i.id !== itemId))
      if (editingId === itemId) cancelEdit()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Madde silinemedi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-6" aria-labelledby="mvp-manager-heading">
      <div className="space-y-2">
        <h2 id="mvp-manager-heading" className="text-xl font-semibold text-gray-900">
          MVP Yapısal Liste
        </h2>
        <p className="max-w-3xl text-sm text-gray-500">
          Maddeleri ekleyin, MVP seviyesi ve sorumlu atayın, düzenleyin veya silin.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-2xl border border-[rgba(66,133,244,0.1)] bg-white/80 p-8 text-center text-sm text-gray-400">Yükleniyor…</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Henüz madde yok.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {konuGroups.map((group) => (
              <KonuCard
                key={group.normalizedKey}
                group={group}
                editingId={editingId}
                editingState={editingState}
                isSubmitting={isSubmitting}
                defaultOpen={group.mvpCounts.Atanmadi > 0}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onInlineUpdate={handleInlineUpdate}
                onEditingStateChange={setEditingState}
              />
            ))}
          </div>
        )}
      </div>

      {!isLoading && (
        <AccordionCard
          items={[
            {
              id: 'new-mvp',
              title: 'Yeni Madde Ekle',
              accentColor: '#1A6DC2',
              children: (
                <form
                  onSubmit={handleCreate}
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_0.8fr_1.2fr_0.7fr_0.7fr]"
                >
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Konu</span>
                    <input type="text" value={formState.konu} onChange={(e) => setFormState((s) => ({ ...s, konu: e.target.value }))} placeholder="Başlık" className={INPUT_CLS} required />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Sub</span>
                    <input type="text" value={formState.sub} onChange={(e) => setFormState((s) => ({ ...s, sub: e.target.value }))} placeholder="Alt başlık" className={INPUT_CLS} />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Ayrıntı</span>
                    <input type="text" value={formState.ayrinti} onChange={(e) => setFormState((s) => ({ ...s, ayrinti: e.target.value }))} placeholder="Madde metni" className={INPUT_CLS} />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">MVP</span>
                    <select value={formState.mvpLevel} onChange={(e) => setFormState((s) => ({ ...s, mvpLevel: e.target.value as MvpFormState['mvpLevel'] }))} className={INPUT_CLS}>
                      {MVP_LEVELS.map((l) => (<option key={l} value={l}>{l}</option>))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Kim</span>
                    <select value={formState.addedBy} onChange={(e) => setFormState((s) => ({ ...s, addedBy: e.target.value as MvpFormState['addedBy'] }))} className={INPUT_CLS}>
                      {MVP_AUTHORS.map((a) => (<option key={a} value={a}>{a}</option>))}
                    </select>
                  </label>
                  <div className="flex items-end sm:col-span-2 lg:col-span-5">
                    <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60">
                      <Plus size={16} className="mr-1 inline" aria-hidden="true" />
                      {isSubmitting ? 'Kaydediliyor...' : 'Yeni ekle'}
                    </button>
                  </div>
                </form>
              ),
            },
          ]}
        />
      )}
    </section>
  )
}

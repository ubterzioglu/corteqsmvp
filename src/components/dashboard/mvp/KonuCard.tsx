'use client'

import { Pencil, Save, Trash2, X } from 'lucide-react'
import AccordionCard from '@/components/dashboard/AccordionCard'
import {
  MVP_LEVELS,
  MVP_AUTHORS,
  MVP_COLORS,
  INPUT_CLS,
  BTN_CLS,
  type KonuGroup,
  type MvpFormState,
  type MvpItem,
  type MvpLevel,
  type MvpLevelCounts,
} from '@/lib/dashboard/mvp-items'

interface KonuCardProps {
  group: KonuGroup
  editingId: string | null
  editingState: MvpFormState
  isSubmitting: boolean
  defaultOpen: boolean
  onStartEdit: (item: MvpItem) => void
  onCancelEdit: () => void
  onUpdate: (id: string) => void
  onDelete: (id: string) => void
  onInlineUpdate: (id: string, field: 'mvp_level' | 'added_by', value: string) => void
  onEditingStateChange: React.Dispatch<React.SetStateAction<MvpFormState>>
}

function pickAccentColor(counts: MvpLevelCounts): string {
  if (counts.MVP1 > 0) return MVP_COLORS.MVP1
  if (counts.MVP2 > 0) return MVP_COLORS.MVP2
  if (counts.MVP3 > 0) return MVP_COLORS.MVP3
  return MVP_COLORS.Atanmadi
}

export default function KonuCard({
  group,
  editingId,
  editingState,
  isSubmitting,
  defaultOpen,
  onStartEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onInlineUpdate,
  onEditingStateChange,
}: KonuCardProps) {
  const accentColor = pickAccentColor(group.mvpCounts)
  const cardId = `konu-${group.normalizedKey}`

  return (
    <AccordionCard
      defaultOpenId={defaultOpen ? cardId : undefined}
      items={[
        {
          id: cardId,
          title: group.konu,
          badge: `${group.items.length} madde`,
          accentColor,
          children: (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {(['MVP1', 'MVP2', 'MVP3', 'Atanmadi'] as const).map((lvl) =>
                  group.mvpCounts[lvl] > 0 ? (
                    <span
                      key={lvl}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor: `${MVP_COLORS[lvl]}15`,
                        color: MVP_COLORS[lvl],
                        border: `1px solid ${MVP_COLORS[lvl]}30`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: MVP_COLORS[lvl] }}
                      />
                      {lvl}: {group.mvpCounts[lvl]}
                    </span>
                  ) : null,
                )}
              </div>

              <div className="hidden overflow-x-auto rounded-2xl border border-[rgba(66,133,244,0.1)] bg-white shadow-[0_10px_20px_rgba(60,64,67,0.04)] md:block">
                <table className="min-w-full divide-y divide-gray-50 text-sm">
                  <thead className="bg-gray-50/80">
                    <tr>
                      {['Konu', 'Sub', 'Ayrıntı', 'MVP', 'Kim', 'İşlemler'].map((col) => (
                        <th key={col} scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-500 first:pl-6 last:pr-6">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {group.items.map((item) => {
                      const rowIsEditing = editingId === item.id
                      return (
                        <tr key={item.id} className="align-middle transition-colors hover:bg-[rgba(66,133,244,0.03)]">
                          <td className="pl-6 pr-4 py-3.5 font-medium text-gray-900">
                            {rowIsEditing ? <input type="text" value={editingState.konu} onChange={(e) => onEditingStateChange((s) => ({ ...s, konu: e.target.value }))} className={INPUT_CLS} /> : item.konu}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600">
                            {rowIsEditing ? <input type="text" value={editingState.sub} onChange={(e) => onEditingStateChange((s) => ({ ...s, sub: e.target.value }))} className={INPUT_CLS} /> : (item.sub ?? <span className="text-gray-300">—</span>)}
                          </td>
                          <td className="max-w-xs px-4 py-3.5 text-gray-600">
                            {rowIsEditing ? <input type="text" value={editingState.ayrinti} onChange={(e) => onEditingStateChange((s) => ({ ...s, ayrinti: e.target.value }))} className={INPUT_CLS} /> : (item.ayrinti ?? <span className="text-gray-300">—</span>)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            {rowIsEditing ? (
                              <select value={editingState.mvpLevel} onChange={(e) => onEditingStateChange((s) => ({ ...s, mvpLevel: e.target.value as MvpFormState['mvpLevel'] }))} className={INPUT_CLS}>
                                {MVP_LEVELS.map((l) => (<option key={l} value={l}>{l}</option>))}
                              </select>
                            ) : (
                              <select value={item.mvpLevel} onChange={(e) => void onInlineUpdate(item.id, 'mvp_level', e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold" style={{ color: MVP_COLORS[item.mvpLevel] }}>
                                {MVP_LEVELS.map((l) => (<option key={l} value={l}>{l}</option>))}
                              </select>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            {rowIsEditing ? (
                              <select value={editingState.addedBy} onChange={(e) => onEditingStateChange((s) => ({ ...s, addedBy: e.target.value as MvpFormState['addedBy'] }))} className={INPUT_CLS}>
                                {MVP_AUTHORS.map((a) => (<option key={a} value={a}>{a}</option>))}
                              </select>
                            ) : (
                              <select value={item.addedBy} onChange={(e) => void onInlineUpdate(item.id, 'added_by', e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1 text-xs">
                                {MVP_AUTHORS.map((a) => (<option key={a} value={a}>{a}</option>))}
                              </select>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 last:pr-6">
                            <div className="flex flex-nowrap items-center gap-2">
                              {rowIsEditing ? (
                                <>
                                  <button type="button" onClick={() => void onUpdate(item.id)} disabled={isSubmitting} className={`${BTN_CLS} border border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}><Save size={14} /> Kaydet</button>
                                  <button type="button" onClick={onCancelEdit} disabled={isSubmitting} className={`${BTN_CLS} border border-gray-200 text-gray-500 hover:text-gray-700`}><X size={14} /> İptal</button>
                                </>
                              ) : (
                                <button type="button" onClick={() => onStartEdit(item)} disabled={isSubmitting || editingId !== null} className={`${BTN_CLS} border border-gray-200 text-gray-500 hover:text-gray-700`}><Pencil size={14} /> Düzenle</button>
                              )}
                              <button type="button" onClick={() => void onDelete(item.id)} disabled={isSubmitting} className={`${BTN_CLS} border border-red-200 bg-red-50 text-red-600 hover:bg-red-100`}><Trash2 size={14} /> Sil</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {group.items.map((item) => {
                  const rowIsEditing = editingId === item.id
                  return (
                    <div key={item.id} className="space-y-3 rounded-2xl border border-[rgba(66,133,244,0.1)] bg-white p-4 shadow-[0_10px_20px_rgba(60,64,67,0.04)]">
                      {rowIsEditing ? (
                        <div className="space-y-3">
                          <input type="text" value={editingState.konu} onChange={(e) => onEditingStateChange((s) => ({ ...s, konu: e.target.value }))} className={INPUT_CLS} placeholder="Konu" />
                          <input type="text" value={editingState.sub} onChange={(e) => onEditingStateChange((s) => ({ ...s, sub: e.target.value }))} className={INPUT_CLS} placeholder="Sub" />
                          <input type="text" value={editingState.ayrinti} onChange={(e) => onEditingStateChange((s) => ({ ...s, ayrinti: e.target.value }))} className={INPUT_CLS} placeholder="Ayrıntı" />
                          <div className="grid grid-cols-2 gap-3">
                            <select value={editingState.mvpLevel} onChange={(e) => onEditingStateChange((s) => ({ ...s, mvpLevel: e.target.value as MvpFormState['mvpLevel'] }))} className={INPUT_CLS}>{MVP_LEVELS.map((l) => (<option key={l} value={l}>{l}</option>))}</select>
                            <select value={editingState.addedBy} onChange={(e) => onEditingStateChange((s) => ({ ...s, addedBy: e.target.value as MvpFormState['addedBy'] }))} className={INPUT_CLS}>{MVP_AUTHORS.map((a) => (<option key={a} value={a}>{a}</option>))}</select>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-1">
                            <h3 className="text-base font-semibold text-gray-900">{item.konu}</h3>
                            {item.sub && <p className="text-xs text-gray-400">{item.sub}</p>}
                            <p className="text-sm text-gray-500">{item.ayrinti ?? 'Ayrıntı yok'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1 rounded-xl border border-[rgba(66,133,244,0.08)] bg-gray-50/50 px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">MVP</p>
                              <select value={item.mvpLevel} onChange={(e) => void onInlineUpdate(item.id, 'mvp_level', e.target.value)} className="w-full rounded border border-gray-200 px-2 py-1 text-xs font-semibold" style={{ color: MVP_COLORS[item.mvpLevel] }}>
                                {MVP_LEVELS.map((l) => (<option key={l} value={l}>{l}</option>))}
                              </select>
                            </div>
                            <div className="space-y-1 rounded-xl border border-[rgba(66,133,244,0.08)] bg-gray-50/50 px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Kim</p>
                              <select value={item.addedBy} onChange={(e) => void onInlineUpdate(item.id, 'added_by', e.target.value)} className="w-full rounded border border-gray-200 px-2 py-1 text-xs">
                                {MVP_AUTHORS.map((a) => (<option key={a} value={a}>{a}</option>))}
                              </select>
                            </div>
                          </div>
                        </>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        {rowIsEditing ? (
                          <>
                            <button type="button" onClick={() => void onUpdate(item.id)} disabled={isSubmitting} className={`${BTN_CLS} border border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}><Save size={14} /> Kaydet</button>
                            <button type="button" onClick={onCancelEdit} disabled={isSubmitting} className={`${BTN_CLS} border border-gray-200 text-gray-500 hover:text-gray-700`}><X size={14} /> İptal</button>
                          </>
                        ) : (
                          <button type="button" onClick={() => onStartEdit(item)} disabled={isSubmitting || editingId !== null} className={`${BTN_CLS} border border-gray-200 text-gray-500 hover:text-gray-700`}><Pencil size={14} /> Düzenle</button>
                        )}
                        <button type="button" onClick={() => void onDelete(item.id)} disabled={isSubmitting} className={`${BTN_CLS} border border-red-200 bg-red-50 text-red-600 hover:bg-red-100`}><Trash2 size={14} /> Sil</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ),
        },
      ]}
    />
  )
}

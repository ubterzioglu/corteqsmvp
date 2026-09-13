// Komuta Merkezi — masaüstü tablosunun satır içi düzenleyicisi.
// Düzenlenen satır tüm kolonları kaplayan tek bir hücreye dönüşür (colSpan=9);
// kolon genişlikleri düzenleyici açıkken bozulmasın diye böyle yapılmıştır.

import { Dispatch, SetStateAction } from 'react'
import { Save, X } from 'lucide-react'
import {
  COMMAND_CENTER_PRIORITY_OPTIONS,
  getCommandCenterAssigneeLabel,
  getCommandCenterStatusLabel,
} from '@/lib/dashboard/command-center-items'
import type {
  CommandCenterFormState,
  CommandCenterItem,
} from '@/lib/dashboard/command-center-items'
import { MEETING_CATEGORIES } from '@/lib/dashboard/meeting-notes-data'
import { TODO_ASSIGNEES, TODO_CATEGORIES, TODO_STATUSES } from '@/lib/dashboard/todo-items'
import { BTN_CLS, CHECKBOX_CLS, INLINE_EDITOR_LABEL_CLS, TABLE_INPUT_CLS } from './styles'

interface ItemsTableEditorRowProps {
  item: CommandCenterItem
  rowState: CommandCenterFormState
  setEditingState: Dispatch<SetStateAction<CommandCenterFormState>>
  isSubmitting: boolean
  onUpdate: (itemId: string) => void
  onCancelEdit: () => void
}

export default function ItemsTableEditorRow({
  item,
  rowState,
  setEditingState,
  isSubmitting,
  onUpdate,
  onCancelEdit,
}: ItemsTableEditorRowProps) {
  return (
    <tr className="bg-[rgba(66,133,244,0.03)]">
      <td colSpan={9} className="px-4 py-4">
        <div className="rounded-3xl border border-[rgba(66,133,244,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,249,255,0.96))] p-4 shadow-[0_18px_40px_rgba(60,64,67,0.08)]">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">Görevi Düzenle</p>
              <p className="text-xs text-gray-500">
                Kayıt bilgilerini daha rahat bir görünümle buradan güncelleyebilirsiniz.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void onUpdate(item.id)}
                disabled={isSubmitting}
                className={`${BTN_CLS} border border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}
              >
                <Save size={14} aria-hidden="true" />
                Kaydet
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                disabled={isSubmitting}
                className={`${BTN_CLS} border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800`}
              >
                <X size={14} aria-hidden="true" />
                İptal
              </button>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
            <div className="space-y-3 rounded-2xl border border-[rgba(66,133,244,0.1)] bg-white/90 p-3">
              <div className="space-y-1.5">
                <label className={INLINE_EDITOR_LABEL_CLS}>Başlık</label>
                <input
                  type="text"
                  value={rowState.title}
                  onChange={(event) =>
                    setEditingState((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className={TABLE_INPUT_CLS}
                  placeholder="Başlık"
                />
              </div>
              <div className="space-y-1.5">
                <label className={INLINE_EDITOR_LABEL_CLS}>Detay</label>
                <textarea
                  value={rowState.detail}
                  onChange={(event) =>
                    setEditingState((current) => ({
                      ...current,
                      detail: event.target.value,
                    }))
                  }
                  className={`${TABLE_INPUT_CLS} h-auto min-h-[128px] resize-y leading-5`}
                  rows={5}
                  placeholder="Detay"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 rounded-2xl border border-[rgba(66,133,244,0.1)] bg-white/90 p-3">
                <label className={INLINE_EDITOR_LABEL_CLS}>Öncelik</label>
                <select
                  value={rowState.priority}
                  onChange={(event) =>
                    setEditingState((current) => ({
                      ...current,
                      priority: Number(event.target.value) as CommandCenterFormState['priority'],
                    }))
                  }
                  className={TABLE_INPUT_CLS}
                >
                  {COMMAND_CENTER_PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 rounded-2xl border border-[rgba(66,133,244,0.1)] bg-white/90 p-3">
                <label className={INLINE_EDITOR_LABEL_CLS}>Acil</label>
                <label className="flex h-10 items-center gap-2 rounded-xl border border-[rgba(66,133,244,0.15)] bg-white px-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={rowState.urgent}
                    onChange={(event) =>
                      setEditingState((current) => ({
                        ...current,
                        urgent: event.target.checked,
                      }))
                    }
                    className={CHECKBOX_CLS}
                    aria-label="Acil"
                  />
                  Öncelikli işaretle
                </label>
              </div>

              <div className="space-y-1.5 rounded-2xl border border-[rgba(66,133,244,0.1)] bg-white/90 p-3">
                <label className={INLINE_EDITOR_LABEL_CLS}>Kategori</label>
                {rowState.itemType === 'meeting_note' ? (
                  <select
                    value={rowState.legacySourceCategory}
                    onChange={(event) =>
                      setEditingState((current) => ({
                        ...current,
                        legacySourceCategory: event.target.value,
                      }))
                    }
                    className={TABLE_INPUT_CLS}
                  >
                    <option value="">Kategori seç</option>
                    {MEETING_CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={rowState.categoryLabel}
                    onChange={(event) =>
                      setEditingState((current) => ({
                        ...current,
                        categoryLabel: event.target.value,
                      }))
                    }
                    className={TABLE_INPUT_CLS}
                  >
                    {TODO_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1.5 rounded-2xl border border-[rgba(66,133,244,0.1)] bg-white/90 p-3">
                <label className={INLINE_EDITOR_LABEL_CLS}>
                  {rowState.itemType === 'meeting_note' ? 'Tarih etiketi' : 'Tarih tipi'}
                </label>
                {rowState.itemType === 'meeting_note' ? (
                  <input
                    type="text"
                    value={rowState.legacySourceDateLabel}
                    onChange={(event) =>
                      setEditingState((current) => ({
                        ...current,
                        legacySourceDateLabel: event.target.value,
                        categoryLabel: '',
                      }))
                    }
                    className={TABLE_INPUT_CLS}
                    placeholder="Tarih"
                  />
                ) : (
                  <div className="flex h-10 items-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
                    TODO
                  </div>
                )}
              </div>

              <div className="space-y-1.5 rounded-2xl border border-[rgba(66,133,244,0.1)] bg-white/90 p-3">
                <label className={INLINE_EDITOR_LABEL_CLS}>Kim</label>
                <select
                  value={rowState.assignee}
                  onChange={(event) =>
                    setEditingState((current) => ({
                      ...current,
                      assignee: event.target.value as CommandCenterFormState['assignee'],
                    }))
                  }
                  className={TABLE_INPUT_CLS}
                >
                  {TODO_ASSIGNEES.map((assignee) => (
                    <option key={assignee} value={assignee}>
                      {getCommandCenterAssigneeLabel(assignee)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 rounded-2xl border border-[rgba(66,133,244,0.1)] bg-white/90 p-3">
                <label className={INLINE_EDITOR_LABEL_CLS}>Durum</label>
                <select
                  value={rowState.status}
                  onChange={(event) =>
                    setEditingState((current) => ({
                      ...current,
                      status: event.target.value as CommandCenterFormState['status'],
                    }))
                  }
                  className={TABLE_INPUT_CLS}
                >
                  {TODO_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getCommandCenterStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 rounded-2xl border border-[rgba(66,133,244,0.1)] bg-white/90 p-3 sm:col-span-2">
                <label className={INLINE_EDITOR_LABEL_CLS}>Tarih</label>
                <input
                  type="date"
                  value={rowState.dueDate}
                  onChange={(event) =>
                    setEditingState((current) => ({
                      ...current,
                      dueDate: event.target.value,
                    }))
                  }
                  className={TABLE_INPUT_CLS}
                />
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

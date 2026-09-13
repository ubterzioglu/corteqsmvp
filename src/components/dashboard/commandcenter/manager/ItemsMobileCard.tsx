// Komuta Merkezi — mobil (md altı) kayıt kartı.
// Masaüstü tablosunun yerine geçer ve okuma/düzenleme durumlarını aynı kartta
// çizer. Mobilde düzenleme paneli açıkken arşiv düğmesi bilinçli olarak kapalıdır.

import { Dispatch, SetStateAction } from 'react'
import { Archive, Pencil, Save, Trash2, X } from 'lucide-react'
import {
  COMMAND_CENTER_PRIORITY_OPTIONS,
  getCommandCenterAssigneeLabel,
  getCommandCenterDateGroupInfo,
  getCommandCenterStatusLabel,
  getCommandCenterTopCategoryLabel,
} from '@/lib/dashboard/command-center-items'
import type {
  CommandCenterFormState,
  CommandCenterItem,
} from '@/lib/dashboard/command-center-items'
import { MEETING_CATEGORIES, MEETING_SOURCES } from '@/lib/dashboard/meeting-notes-data'
import { TODO_ASSIGNEES, TODO_CATEGORIES, TODO_STATUSES } from '@/lib/dashboard/todo-items'
import { MobileInfoPair, UrgentIndicator } from './cells'
import { formatCreatedAt, getItemDetail } from './formatters'
import { BTN_CLS, CHECKBOX_CLS, INPUT_CLS } from './styles'

interface ItemsMobileCardProps {
  item: CommandCenterItem
  rowIsEditing: boolean
  rowState: CommandCenterFormState
  setEditingState: Dispatch<SetStateAction<CommandCenterFormState>>
  editingId: string | null
  isSubmitting: boolean
  onStartEdit: (item: CommandCenterItem) => void
  onCancelEdit: () => void
  onUpdate: (itemId: string) => void
  onArchive: (itemId: string) => void
  onDelete: (itemId: string) => void
}

export default function ItemsMobileCard({
  item,
  rowIsEditing,
  rowState,
  setEditingState,
  editingId,
  isSubmitting,
  onStartEdit,
  onCancelEdit,
  onUpdate,
  onArchive,
  onDelete,
}: ItemsMobileCardProps) {
  const dateGroupInfo = getCommandCenterDateGroupInfo(item)

  return (
    <div className="space-y-3 rounded-2xl border border-[rgba(66,133,244,0.1)] bg-white p-4 shadow-[0_10px_20px_rgba(60,64,67,0.04)]">
      {rowIsEditing ? (
        <div className="space-y-3">
          <select
            value={rowState.priority}
            onChange={(event) =>
              setEditingState((current) => ({
                ...current,
                priority: Number(event.target.value) as CommandCenterFormState['priority'],
              }))
            }
            className={INPUT_CLS}
          >
            {COMMAND_CENTER_PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={rowState.title}
            onChange={(event) =>
              setEditingState((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            className={INPUT_CLS}
            placeholder="Başlık"
          />
          <textarea
            value={rowState.detail}
            onChange={(event) =>
              setEditingState((current) => ({
                ...current,
                detail: event.target.value,
              }))
            }
            className={INPUT_CLS}
            rows={4}
          />
          {rowState.itemType === 'meeting_note' ? (
            <>
              <select
                value={rowState.legacySourceCategory}
                onChange={(event) =>
                  setEditingState((current) => ({
                    ...current,
                    legacySourceCategory: event.target.value,
                  }))
                }
                className={INPUT_CLS}
              >
                <option value="">Kategori seç</option>
                {MEETING_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
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
                className={INPUT_CLS}
                placeholder="Tarih"
              />
            </>
          ) : (
            <select
              value={rowState.categoryLabel}
              onChange={(event) =>
                setEditingState((current) => ({
                  ...current,
                  categoryLabel: event.target.value,
                }))
              }
              className={INPUT_CLS}
            >
              {TODO_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={rowState.assignee}
              onChange={(event) =>
                setEditingState((current) => ({
                  ...current,
                  assignee: event.target.value as CommandCenterFormState['assignee'],
                }))
              }
              className={INPUT_CLS}
            >
              {TODO_ASSIGNEES.map((assignee) => (
                <option key={assignee} value={assignee}>
                  {getCommandCenterAssigneeLabel(assignee)}
                </option>
              ))}
            </select>
            <select
              value={rowState.status}
              onChange={(event) =>
                setEditingState((current) => ({
                  ...current,
                  status: event.target.value as CommandCenterFormState['status'],
                }))
              }
              className={INPUT_CLS}
            >
              {TODO_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getCommandCenterStatusLabel(status)}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={rowState.dueDate}
              onChange={(event) =>
                setEditingState((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
              className={INPUT_CLS}
            />
            {rowState.itemType === 'meeting_note' && (
              <select
                value={rowState.legacySourceCode}
                onChange={(event) =>
                  setEditingState((current) => ({
                    ...current,
                    legacySourceCode: event.target.value,
                  }))
                }
                className={INPUT_CLS}
              >
                <option value="">Kaynak seç</option>
                {MEETING_SOURCES.map((source) => (
                  <option key={source.key} value={source.key}>
                    {source.label}
                  </option>
                ))}
              </select>
            )}
            <label className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/70 px-3.5 py-3 text-sm font-semibold text-red-700 sm:col-span-2">
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
              />
              Acil!
            </label>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UrgentIndicator urgent={item.urgent} mobile />
            </div>
            <h3 className="text-[15px] font-semibold text-gray-900">{item.title}</h3>
            <p className="text-[13px] leading-5 text-gray-700">{getItemDetail(item.detail)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <MobileInfoPair label="Prio" value={String(item.priority)} />
            <MobileInfoPair label="Kategori" value={getCommandCenterTopCategoryLabel(item)} />
            <MobileInfoPair label="Tarih" value={dateGroupInfo.label} />
            <MobileInfoPair label="Kim" value={item.assignee} assignee={item.assignee} />
            <MobileInfoPair label="Durum" value={getCommandCenterStatusLabel(item.status)} />
            <MobileInfoPair label="Eklenme" value={formatCreatedAt(item.createdAt)} />
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {rowIsEditing ? (
          <>
            <button
              type="button"
              onClick={() => void onUpdate(item.id)}
              disabled={isSubmitting}
              className={`${BTN_CLS} border border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}
              aria-label="Kaydet"
              title="Kaydet"
            >
              <Save size={12} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isSubmitting}
              className={`${BTN_CLS} border border-gray-200 text-gray-500 hover:text-gray-700`}
              aria-label="İptal"
              title="İptal"
            >
              <X size={12} aria-hidden="true" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onStartEdit(item)}
            disabled={isSubmitting || editingId !== null}
            className={`${BTN_CLS} border border-gray-200 text-gray-500 hover:text-gray-700`}
            aria-label="Düzenle"
            title="Düzenle"
          >
            <Pencil size={12} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={() => void onArchive(item.id)}
          disabled={isSubmitting || rowIsEditing}
          className={`${BTN_CLS} border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100`}
          aria-label="Arşivle"
          title="Arşivle"
        >
          <Archive size={12} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => void onDelete(item.id)}
          disabled={isSubmitting}
          className={`${BTN_CLS} border border-red-200 bg-red-50 text-red-600 hover:bg-red-100`}
          aria-label="Sil"
          title="Sil"
        >
          <Trash2 size={12} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

// Komuta Merkezi — "Yeni Kayıt Ekle" formu.
// Alan kilitleri kayıt tipine bağlıdır: toplantı notunda termin kapalı, kaynak
// kodu ve tarih etiketi açıktır; todo'da tam tersi. Bu kilitler yazma yükünü
// kuran `buildCommandCenterPayload` ile aynı varsayımı paylaşır.

import { Dispatch, FormEvent, SetStateAction } from 'react'
import { Plus } from 'lucide-react'
import {
  COMMAND_CENTER_PRIORITY_OPTIONS,
  getCommandCenterAssigneeLabel,
  getCommandCenterStatusLabel,
} from '@/lib/dashboard/command-center-items'
import type { CommandCenterFormState } from '@/lib/dashboard/command-center-items'
import { MEETING_CATEGORIES, MEETING_SOURCES } from '@/lib/dashboard/meeting-notes-data'
import { TODO_ASSIGNEES, TODO_CATEGORIES, TODO_STATUSES } from '@/lib/dashboard/todo-items'
import { CHECKBOX_CLS, INPUT_CLS } from './styles'

interface CommandCenterCreateFormProps {
  formState: CommandCenterFormState
  setFormState: Dispatch<SetStateAction<CommandCenterFormState>>
  isSubmitting: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function CommandCenterCreateForm({
  formState,
  setFormState,
  isSubmitting,
  onSubmit,
}: CommandCenterCreateFormProps) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Başlık
        </span>
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
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Konu Bazında Kategori
        </span>
        {formState.itemType === 'meeting_note' ? (
          <select
            value={formState.legacySourceCategory}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                legacySourceCategory: event.target.value,
                categoryLabel: '',
              }))
            }
            className={INPUT_CLS}
            required
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
            value={formState.categoryLabel}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                categoryLabel: event.target.value,
              }))
            }
            className={INPUT_CLS}
            required
          >
            {TODO_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        )}
      </label>

      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Kim
        </span>
        <select
          value={formState.assignee}
          onChange={(event) =>
            setFormState((current) => ({
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
      </label>

      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Durum
        </span>
        <select
          value={formState.status}
          onChange={(event) =>
            setFormState((current) => ({
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
      </label>

      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Prio
        </span>
        <select
          value={formState.priority}
          onChange={(event) =>
            setFormState((current) => ({
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
      </label>

      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Termin
        </span>
        <input
          type="date"
          value={formState.dueDate}
          onChange={(event) =>
            setFormState((current) => ({ ...current, dueDate: event.target.value }))
          }
          className={INPUT_CLS}
          disabled={formState.itemType === 'meeting_note'}
        />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Kaynak Kodu
        </span>
        <select
          value={formState.legacySourceCode}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              legacySourceCode: event.target.value,
            }))
          }
          className={INPUT_CLS}
          disabled={formState.itemType !== 'meeting_note'}
        >
          <option value="">Kaynak seç</option>
          {MEETING_SOURCES.map((source) => (
            <option key={source.key} value={source.key}>
              {source.label} — {source.date}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Tarih
        </span>
        <input
          type="text"
          value={formState.legacySourceDateLabel}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              legacySourceDateLabel: event.target.value,
            }))
          }
          placeholder={formState.itemType === 'meeting_note' ? 'örn. 24 Nisan WA' : 'Todo'}
          className={INPUT_CLS}
          disabled={formState.itemType !== 'meeting_note'}
        />
      </label>

      <label className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/70 px-3.5 py-3 text-sm font-semibold text-red-700">
        <input
          type="checkbox"
          checked={formState.urgent}
          onChange={(event) =>
            setFormState((current) => ({ ...current, urgent: event.target.checked }))
          }
          className={CHECKBOX_CLS}
        />
        Acil!
      </label>

      <label className="space-y-2 md:col-span-2 xl:col-span-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Detay
        </span>
        <textarea
          value={formState.detail}
          onChange={(event) =>
            setFormState((current) => ({ ...current, detail: event.target.value }))
          }
          placeholder="Kaydın tam açıklamasını yaz"
          rows={4}
          className={INPUT_CLS}
          required
        />
      </label>

      <div className="flex items-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <Plus size={16} className="mr-1 inline" aria-hidden="true" />
          {isSubmitting ? 'Kaydediliyor...' : 'Yeni ekle'}
        </button>
      </div>
    </form>
  )
}

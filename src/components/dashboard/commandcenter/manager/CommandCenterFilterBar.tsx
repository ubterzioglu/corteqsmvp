// Komuta Merkezi — filtre çubuğu.
// Her filtre değişimi sayfayı 1'e döndürür (bu davranış çağıran taraftaki
// `onChange*` yardımcılarında toplanmıştır). Kategori ve Tip seçenekleri tek
// facet sorgusundan türer; filtre değişimi yeni bir seçenek isteği ATMAZ.

import { Search } from 'lucide-react'
import { COMMAND_CENTER_PRIORITY_OPTIONS } from '@/lib/dashboard/command-center-items'
import type {
  CommandCenterCategoryOption,
  CommandCenterDateGroupOption,
} from '@/lib/dashboard/command-center-items'
import { TODO_ASSIGNEES, TODO_STATUSES } from '@/lib/dashboard/todo-items'
import { CHECKBOX_CLS, FILTER_INPUT_CLS, FILTER_SELECT_CLS } from './styles'

interface CommandCenterFilterBarProps {
  selectedAssignee: string
  onAssigneeChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
  categoryOptions: CommandCenterCategoryOption[]
  selectedDateGroup: string
  onDateGroupChange: (value: string) => void
  dateGroupOptions: CommandCenterDateGroupOption[]
  selectedStatus: string
  onStatusChange: (value: string) => void
  selectedPriority: string
  onPriorityChange: (value: string) => void
  urgentOnly: boolean
  onUrgentOnlyChange: (value: boolean) => void
  searchTerm: string
  onSearchTermChange: (value: string) => void
}

export default function CommandCenterFilterBar({
  selectedAssignee,
  onAssigneeChange,
  selectedCategory,
  onCategoryChange,
  categoryOptions,
  selectedDateGroup,
  onDateGroupChange,
  dateGroupOptions,
  selectedStatus,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
  urgentOnly,
  onUrgentOnlyChange,
  searchTerm,
  onSearchTermChange,
}: CommandCenterFilterBarProps) {
  return (
    <div className="rounded-2xl border border-[rgba(66,133,244,0.1)] bg-white p-4 shadow-[0_10px_20px_rgba(60,64,67,0.04)]">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <select
          value={selectedAssignee}
          onChange={(event) => onAssigneeChange(event.target.value)}
          className={FILTER_SELECT_CLS}
          aria-label="Kim filtresi"
        >
          <option value="Tümü">Tümü - Kim</option>
          {TODO_ASSIGNEES.map((assignee) => (
            <option key={assignee} value={assignee}>
              {assignee}
            </option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={(event) => onCategoryChange(event.target.value)}
          className={FILTER_SELECT_CLS}
          aria-label="Kategori filtresi"
        >
          <option value="">Tümü - Kategori</option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={selectedDateGroup}
          onChange={(event) => onDateGroupChange(event.target.value)}
          className={FILTER_SELECT_CLS}
          aria-label="Tip filtresi"
        >
          <option value="">Tümü - Tip</option>
          {dateGroupOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(event) => onStatusChange(event.target.value)}
          className={FILTER_SELECT_CLS}
          aria-label="Durum filtresi"
        >
          <option value="Tümü">Tümü - Durum</option>
          {TODO_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={selectedPriority}
          onChange={(event) => onPriorityChange(event.target.value)}
          className={FILTER_SELECT_CLS}
          aria-label="Prio filtresi"
        >
          <option value="Tümü">Tümü - Prio</option>
          {COMMAND_CENTER_PRIORITY_OPTIONS.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>

        <label className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50/70 px-3 py-2 text-[12px] font-semibold text-red-700">
          <input
            type="checkbox"
            checked={urgentOnly}
            onChange={(event) => onUrgentOnlyChange(event.target.checked)}
            className={CHECKBOX_CLS}
          />
          Sadece acil
        </label>

        <label className="relative w-full max-w-[680px]">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Kayıt ara..."
            className={FILTER_INPUT_CLS}
            aria-label="Kayıt arama"
          />
        </label>
      </div>
    </div>
  )
}

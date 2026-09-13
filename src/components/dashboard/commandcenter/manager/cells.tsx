// Komuta Merkezi — aktif/arşiv/silinmiş listelerinin ortak hücre parçaları.
// Renkler kayıt tipini ve durumu ayırt eder; aynı rozet üç listede de kullanılır.

import { normalizeTodoAssignee } from '@/lib/dashboard/todo-items'
import {
  getCommandCenterStatusLabel,
  getCommandCenterTopCategoryLabel,
} from '@/lib/dashboard/command-center-items'
import type { CommandCenterItem } from '@/lib/dashboard/command-center-items'

const burakAvatar = '/burak.png'
const ubtAvatar = '/ubt.png'

const TODO_COLOR = '#1A6DC2'
const MEETING_NOTE_COLOR = '#8B5CF6'

const STATUS_COLORS: Record<string, string> = {
  Baslanmadi: '#888888',
  Beklemede: '#F5A500',
  'Devam ediyor': '#1A6DC2',
  Tamamlandi: '#4CAF50',
}

export function CategoryBadge({ item }: { item: CommandCenterItem }) {
  const color = item.itemType === 'todo' ? TODO_COLOR : MEETING_NOTE_COLOR

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium leading-none"
      style={{ color, background: `${color}14` }}
    >
      {getCommandCenterTopCategoryLabel(item)}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#888888'

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium leading-none"
      style={{ color, background: `${color}18` }}
    >
      {getCommandCenterStatusLabel(status)}
    </span>
  )
}

export function AssigneeAvatar({ assignee }: { assignee: string }) {
  const normalizedAssignee = normalizeTodoAssignee(assignee)
  const src =
    normalizedAssignee === normalizeTodoAssignee('Burak')
      ? burakAvatar
      : normalizedAssignee === normalizeTodoAssignee('UBT')
        ? ubtAvatar
        : null

  if (!src) {
    return null
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

export function AssigneeCell({ assignee }: { assignee: string }) {
  return (
    <div className="flex min-h-[40px] items-center justify-center">
      <AssigneeAvatar assignee={assignee} />
    </div>
  )
}

export function UrgentIndicator({
  urgent,
  mobile = false,
}: {
  urgent: boolean
  mobile?: boolean
}) {
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

export function MobileInfoPair({
  label,
  value,
  assignee,
}: {
  label: string
  value: string
  assignee?: string
}) {
  return (
    <div className="space-y-1 rounded-xl border border-[rgba(66,133,244,0.08)] bg-gray-50/50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
        {label}
      </p>
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

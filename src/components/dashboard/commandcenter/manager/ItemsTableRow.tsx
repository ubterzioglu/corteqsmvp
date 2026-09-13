// Komuta Merkezi — masaüstü tablosunun okuma satırı.
// Kolon sırası tablo başlığıyla (colgroup + thead) birebir eşleşmelidir.

import { Archive, Pencil, Trash2 } from 'lucide-react'
import { getCommandCenterDateGroupInfo } from '@/lib/dashboard/command-center-items'
import type { CommandCenterItem } from '@/lib/dashboard/command-center-items'
import { AssigneeCell, CategoryBadge, StatusBadge, UrgentIndicator } from './cells'
import { formatCreatedAt, getItemDetail } from './formatters'
import { BTN_CLS } from './styles'

interface ItemsTableRowProps {
  item: CommandCenterItem
  editingId: string | null
  isSubmitting: boolean
  onStartEdit: (item: CommandCenterItem) => void
  onArchive: (itemId: string) => void
  onDelete: (itemId: string) => void
}

export default function ItemsTableRow({
  item,
  editingId,
  isSubmitting,
  onStartEdit,
  onArchive,
  onDelete,
}: ItemsTableRowProps) {
  const dateGroupInfo = getCommandCenterDateGroupInfo(item)

  return (
    <tr className="align-middle transition-colors hover:bg-[rgba(66,133,244,0.03)]">
      <td className="pl-4 pr-2 py-3 align-middle">
        <span className="inline-flex min-w-[28px] items-center justify-center rounded-full bg-[rgba(26,109,194,0.1)] px-2 py-1 text-[10px] font-semibold leading-none text-[#1A6DC2]">
          {item.priority}
        </span>
      </td>
      <td className="pl-4 pr-2 py-3 align-middle">
        <UrgentIndicator urgent={item.urgent} />
      </td>
      <td className="px-2.5 py-3 align-middle">
        <CategoryBadge item={item} />
      </td>
      <td className="px-2.5 py-3 align-middle">
        <span className="text-[10px] font-medium text-gray-600">
          {dateGroupInfo.label}
        </span>
      </td>
      <td className="px-2.5 py-3 align-middle text-gray-600">
        <div className="space-y-1">
          <p className="text-[13px] font-medium text-gray-900">{item.title}</p>
          <p className="text-[12px] leading-5 text-gray-700">{getItemDetail(item.detail)}</p>
        </div>
      </td>
      <td className="px-2.5 py-3 align-middle text-gray-600">
        <AssigneeCell assignee={item.assignee} />
      </td>
      <td className="px-2.5 py-3 align-middle">
        <StatusBadge status={item.status} />
      </td>
      <td className="whitespace-nowrap px-2.5 py-3 align-middle text-gray-600">
        {formatCreatedAt(item.createdAt)}
      </td>
      <td className="whitespace-nowrap px-1.5 py-3 align-middle pr-4">
        <div className="flex flex-nowrap items-center justify-center gap-1.5">
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
          <button
            type="button"
            onClick={() => void onArchive(item.id)}
            disabled={isSubmitting || editingId !== null}
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
      </td>
    </tr>
  )
}

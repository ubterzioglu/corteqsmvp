// Komuta Merkezi — arşivlenen kayıtlar listesi (salt okunur).
// Arşiv kaydı düzenlenemez/silinemez; masaüstünde tablo, mobilde kart çizilir.

import {
  getCommandCenterAssigneeLabel,
  getCommandCenterItemLabel,
  getCommandCenterStatusLabel,
  getCommandCenterTopCategoryLabel,
} from '@/lib/dashboard/command-center-items'
import type { CommandCenterItem } from '@/lib/dashboard/command-center-items'
import { AssigneeAvatar, CategoryBadge, MobileInfoPair, StatusBadge } from './cells'
import { formatCreatedAt, formatDeletedAt, getItemDetail } from './formatters'

export default function ArchivedItemsList({ items }: { items: CommandCenterItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-200 bg-white/80 p-6 text-center text-sm text-gray-500">
        Arşivlenen kayıt yok.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="hidden overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-[0_10px_20px_rgba(60,64,67,0.04)] md:block">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[6%]" />
            <col className="w-[10%]" />
            <col className="w-[14%]" />
            <col className="w-[34%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[8%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead className="border-b border-amber-100 bg-amber-50/70">
            <tr>
              {['Prio', 'Tip', 'Kategori', 'Başlık & Detay', 'Kim', 'Durum', 'Eklenme', 'Arşiv'].map(
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
          <tbody className="divide-y divide-amber-50">
            {items.map((item) => (
              <tr key={item.id} className="align-middle">
                <td className="pl-4 pr-2 py-3">
                  <span className="inline-flex min-w-[28px] items-center justify-center rounded-full bg-[rgba(217,119,6,0.1)] px-2 py-1 text-[10px] font-semibold leading-none text-amber-700">
                    {item.priority}
                  </span>
                </td>
                <td className="px-2.5 py-3 text-[12px] font-medium text-gray-700">
                  {getCommandCenterItemLabel(item.itemType)}
                </td>
                <td className="px-2.5 py-3">
                  <CategoryBadge item={item} />
                </td>
                <td className="px-2.5 py-3 text-gray-600">
                  <div className="space-y-1">
                    <p className="text-[13px] font-medium text-gray-900">{item.title}</p>
                    <p className="text-[12px] leading-5 text-gray-700">{getItemDetail(item.detail)}</p>
                  </div>
                </td>
                <td className="px-2.5 py-3 text-gray-600">
                  <div className="flex items-center gap-2">
                    <AssigneeAvatar assignee={item.assignee} />
                    <span className="text-[12px] text-gray-700">
                      {getCommandCenterAssigneeLabel(item.assignee)}
                    </span>
                  </div>
                </td>
                <td className="px-2.5 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="whitespace-nowrap px-2.5 py-3 text-[12px] text-gray-600">
                  {formatCreatedAt(item.createdAt)}
                </td>
                <td className="whitespace-nowrap px-2.5 py-3 text-[12px] text-gray-600">
                  {formatDeletedAt(item.archivedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <div
            key={item.id}
            className="space-y-3 rounded-2xl border border-amber-100 bg-white p-4 shadow-[0_10px_20px_rgba(60,64,67,0.04)]"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex min-w-[28px] items-center justify-center rounded-full bg-[rgba(217,119,6,0.1)] px-2 py-1 text-[10px] font-semibold leading-none text-amber-700">
                  {item.priority}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                  {getCommandCenterItemLabel(item.itemType)}
                </span>
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900">{item.title}</h3>
              <p className="text-[13px] leading-5 text-gray-700">{getItemDetail(item.detail)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <MobileInfoPair label="Kategori" value={getCommandCenterTopCategoryLabel(item)} />
              <MobileInfoPair
                label="Kim"
                value={getCommandCenterAssigneeLabel(item.assignee)}
                assignee={item.assignee}
              />
              <MobileInfoPair label="Durum" value={getCommandCenterStatusLabel(item.status)} />
              <MobileInfoPair label="Eklenme" value={formatCreatedAt(item.createdAt)} />
              <MobileInfoPair label="Arşiv" value={formatDeletedAt(item.archivedAt)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Komuta Merkezi — kayıt listesi kabuğu (masaüstü tablo + mobil kartlar).
// Aynı bileşen hem aktif hem de "Tamamlanan Görevler" listesinde kullanılır.
// Kolon genişlikleri (colgroup) ve başlık sırası panoda görünür — değiştirme.
//
// A08d: başlıklar sıralama düğmesidir (sunucu sıralaması, A08b). Yalnız
// GÖRÜNEN değeri birebir sıralayan kolonlar tıklanabilir: 'Acil' (boolean
// gösterge), 'Kategori' (etiket türetilmiş), 'Tarih' (hafta kovası etiketi —
// due_date sırasıyla birebir değil) ve 'İşlem' sıralanamaz.

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'
import { toCommandCenterFormState } from '@/lib/dashboard/command-center-items'
import type {
  CommandCenterFormState,
  CommandCenterItem,
  CommandCenterSortDirection,
  CommandCenterSortKey,
} from '@/lib/dashboard/command-center-items'
import ItemsMobileCard from './ItemsMobileCard'
import ItemsTableEditorRow from './ItemsTableEditorRow'
import ItemsTableRow from './ItemsTableRow'

interface CommandCenterColumnSpec {
  label: string
  sortKey?: CommandCenterSortKey
}

// Colgroup ve başlık sırası panoda görünür — sırayı değiştirme.
const COMMAND_CENTER_COLUMNS: readonly CommandCenterColumnSpec[] = [
  { label: 'Prio', sortKey: 'priority' },
  { label: 'Acil' },
  { label: 'Kategori' },
  { label: 'Tarih' },
  { label: 'Başlık & Detay', sortKey: 'title' },
  { label: 'Kim', sortKey: 'assignee' },
  { label: 'Durum', sortKey: 'status' },
  { label: 'Eklenme', sortKey: 'created_at' },
  { label: 'İşlem' },
]

export interface CommandCenterItemsTableProps {
  items: CommandCenterItem[]
  editingId: string | null
  editingState: CommandCenterFormState
  setEditingState: Dispatch<SetStateAction<CommandCenterFormState>>
  isSubmitting: boolean
  sortKey: CommandCenterSortKey
  sortDirection: CommandCenterSortDirection
  onSortChange: (key: CommandCenterSortKey) => void
  onStartEdit: (item: CommandCenterItem) => void
  onCancelEdit: () => void
  onUpdate: (itemId: string) => void
  onArchive: (itemId: string) => void
  onDelete: (itemId: string) => void
}

export default function CommandCenterItemsTable({
  items,
  editingId,
  editingState,
  setEditingState,
  isSubmitting,
  sortKey,
  sortDirection,
  onSortChange,
  onStartEdit,
  onCancelEdit,
  onUpdate,
  onArchive,
  onDelete,
}: CommandCenterItemsTableProps) {
  return (
    <div className="rounded-2xl border border-[rgba(66,133,244,0.1)] bg-white shadow-[0_10px_20px_rgba(60,64,67,0.04)]">
      <div className="hidden md:block">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[6%]" />
            <col className="w-[4%]" />
            <col className="w-[14%]" />
            <col className="w-[8%]" />
            <col className="w-[36%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[8%]" />
            <col className="w-[6%]" />
            <col className="w-[9%]" />
          </colgroup>
          <thead className="border-b border-[rgba(66,133,244,0.08)] bg-[rgba(66,133,244,0.02)]">
            <tr>
              {COMMAND_CENTER_COLUMNS.map((column) => {
                const isActive = column.sortKey !== undefined && column.sortKey === sortKey
                const ariaSort =
                  column.sortKey === undefined
                    ? undefined
                    : isActive
                      ? sortDirection === 'asc'
                        ? ('ascending' as const)
                        : ('descending' as const)
                      : ('none' as const)
                const SortIcon = isActive
                  ? sortDirection === 'asc'
                    ? ArrowUp
                    : ArrowDown
                  : ArrowUpDown

                return (
                  <th
                    key={column.label}
                    scope="col"
                    aria-sort={ariaSort}
                    className="px-2.5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 first:pl-4 last:pr-4"
                  >
                    {column.sortKey === undefined ? (
                      column.label
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSortChange(column.sortKey!)}
                        className={`inline-flex items-center gap-1 uppercase tracking-[0.16em] transition-colors hover:text-gray-800 ${
                          isActive ? 'text-[#1A6DC2]' : ''
                        }`}
                        title={`${column.label} sıralaması`}
                      >
                        {column.label}
                        <SortIcon size={11} aria-hidden="true" />
                      </button>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) =>
              editingId === item.id ? (
                <ItemsTableEditorRow
                  key={item.id}
                  item={item}
                  rowState={editingState}
                  setEditingState={setEditingState}
                  isSubmitting={isSubmitting}
                  onUpdate={onUpdate}
                  onCancelEdit={onCancelEdit}
                />
              ) : (
                <ItemsTableRow
                  key={item.id}
                  item={item}
                  editingId={editingId}
                  isSubmitting={isSubmitting}
                  onStartEdit={onStartEdit}
                  onArchive={onArchive}
                  onDelete={onDelete}
                />
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {items.map((item) => {
          const rowIsEditing = editingId === item.id
          const rowState = rowIsEditing ? editingState : toCommandCenterFormState(item)

          return (
            <ItemsMobileCard
              key={item.id}
              item={item}
              rowIsEditing={rowIsEditing}
              rowState={rowState}
              setEditingState={setEditingState}
              editingId={editingId}
              isSubmitting={isSubmitting}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onUpdate={onUpdate}
              onArchive={onArchive}
              onDelete={onDelete}
            />
          )
        })}
      </div>
    </div>
  )
}

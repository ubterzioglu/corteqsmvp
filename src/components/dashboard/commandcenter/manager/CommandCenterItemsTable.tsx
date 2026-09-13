// Komuta Merkezi — kayıt listesi kabuğu (masaüstü tablo + mobil kartlar).
// Aynı bileşen hem aktif hem de "Tamamlanan Görevler" listesinde kullanılır.
// Kolon genişlikleri (colgroup) ve başlık sırası panoda görünür — değiştirme.

import { Dispatch, SetStateAction } from 'react'
import { toCommandCenterFormState } from '@/lib/dashboard/command-center-items'
import type {
  CommandCenterFormState,
  CommandCenterItem,
} from '@/lib/dashboard/command-center-items'
import ItemsMobileCard from './ItemsMobileCard'
import ItemsTableEditorRow from './ItemsTableEditorRow'
import ItemsTableRow from './ItemsTableRow'

export interface CommandCenterItemsTableProps {
  items: CommandCenterItem[]
  editingId: string | null
  editingState: CommandCenterFormState
  setEditingState: Dispatch<SetStateAction<CommandCenterFormState>>
  isSubmitting: boolean
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
              {['Prio', 'Acil', 'Kategori', 'Tarih', 'Başlık & Detay', 'Kim', 'Durum', 'Eklenme', 'İşlem'].map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-2.5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 first:pl-4 last:pr-4"
                >
                  {column}
                </th>
              ))}
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

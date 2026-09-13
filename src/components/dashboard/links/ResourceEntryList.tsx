'use client'

// Aktif (gizlenmemiş) kayıt listesi. Düzenlenen satır normal satırın YERİNE
// düzenleme formunu çizer — liste ayrı bir kip/görünüme geçmez.

import type { ResourceEntry, ResourceFormState } from '@/lib/dashboard/resource-items'
import ResourceEntryEditRow from './ResourceEntryEditRow'
import ResourceEntryRow from './ResourceEntryRow'
import type { ResourceFieldSetter } from './useLinkManager'

interface ResourceEntryListProps {
  entries: ResourceEntry[]
  editingId: string | null
  editingState: ResourceFormState
  expandedEntryIds: Set<string>
  isSubmitting: boolean
  isEditing: boolean
  sectionOptions: string[]
  getSubsectionOptionsForSection: (section: string) => string[]
  onEditingChange: ResourceFieldSetter
  onFileChange: (file: File | null) => void
  onSaveEdit: (entry: ResourceEntry) => void
  onCancelEdit: () => void
  onToggleDetails: (entryId: string) => void
  onStartEdit: (entry: ResourceEntry) => void
  onToggleHidden: (entry: ResourceEntry, nextHidden: boolean) => void
  onOpenStoredFile: (entry: ResourceEntry, shouldDownload: boolean) => void
  onDelete: (entry: ResourceEntry) => void
}

export default function ResourceEntryList({
  entries,
  editingId,
  editingState,
  expandedEntryIds,
  isSubmitting,
  isEditing,
  sectionOptions,
  getSubsectionOptionsForSection,
  onEditingChange,
  onFileChange,
  onSaveEdit,
  onCancelEdit,
  onToggleDetails,
  onStartEdit,
  onToggleHidden,
  onOpenStoredFile,
  onDelete,
}: ResourceEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="space-y-1.5">
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-center text-xs text-gray-500">
          Aktif listede kayıt bulunamadı.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {entries.map((entry) =>
        editingId === entry.id ? (
          <ResourceEntryEditRow
            key={entry.id}
            entry={entry}
            state={editingState}
            sectionOptions={sectionOptions}
            subsectionOptions={getSubsectionOptionsForSection(editingState.section)}
            isSubmitting={isSubmitting}
            onChange={onEditingChange}
            onFileChange={onFileChange}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
          />
        ) : (
          <ResourceEntryRow
            key={entry.id}
            entry={entry}
            isExpanded={expandedEntryIds.has(entry.id)}
            isSubmitting={isSubmitting}
            isEditing={isEditing}
            onToggleDetails={onToggleDetails}
            onStartEdit={onStartEdit}
            onToggleHidden={onToggleHidden}
            onOpenStoredFile={onOpenStoredFile}
            onDelete={onDelete}
          />
        ),
      )}
    </div>
  )
}

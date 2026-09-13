'use client'

// Satır içi düzenleme kipi: aynı satırın yerine formun kendisi çizilir.
// Aynı anda tek satır düzenlenebilir (diğer satırların kalem düğmesi kapanır).

import { Save, X } from 'lucide-react'
import type { ResourceEntry, ResourceFormState } from '@/lib/dashboard/resource-items'
import ResourceFormFields from './ResourceFormFields'
import type { ResourceFieldSetter } from './useLinkManager'
import { BTN_CLS } from './link-manager-styles'

interface ResourceEntryEditRowProps {
  entry: ResourceEntry
  state: ResourceFormState
  sectionOptions: string[]
  subsectionOptions: string[]
  isSubmitting: boolean
  onChange: ResourceFieldSetter
  onFileChange: (file: File | null) => void
  onSave: (entry: ResourceEntry) => void
  onCancel: () => void
}

export default function ResourceEntryEditRow({
  entry,
  state,
  sectionOptions,
  subsectionOptions,
  isSubmitting,
  onChange,
  onFileChange,
  onSave,
  onCancel,
}: ResourceEntryEditRowProps) {
  return (
    <div className="rounded-xl border border-[rgba(66,133,244,0.1)] bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700">Düzenleme: {entry.title}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSave(entry)}
            disabled={isSubmitting}
            className={`${BTN_CLS} border border-green-200 bg-green-50 px-2.5 py-1.5 text-[11px] text-green-700 hover:bg-green-100`}
          >
            <Save size={12} aria-hidden="true" />
            Kaydet
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className={`${BTN_CLS} border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-600 hover:text-gray-800`}
          >
            <X size={12} aria-hidden="true" />
            İptal
          </button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ResourceFormFields
          state={state}
          mode="edit"
          sectionOptions={sectionOptions}
          subsectionOptions={subsectionOptions}
          onChange={onChange}
          onFileChange={onFileChange}
        />
      </div>
    </div>
  )
}

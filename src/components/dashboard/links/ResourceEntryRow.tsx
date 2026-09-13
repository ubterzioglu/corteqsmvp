'use client'

// Aktif listedeki tek bir kaydın satırı: rozetler, başlık, eylem düğmeleri ve
// açılır detay bloğu. Depolanmış dosyası olmayan kayıtta görüntüle/indir
// düğmeleri hiç çizilmez.

import {
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
} from 'lucide-react'
import type { ResourceEntry } from '@/lib/dashboard/resource-items'
import { safeHref } from '@/lib/security'
import { ICON_BTN_CLS } from './link-manager-styles'

interface ResourceEntryRowProps {
  entry: ResourceEntry
  isExpanded: boolean
  isSubmitting: boolean
  isEditing: boolean
  onToggleDetails: (entryId: string) => void
  onStartEdit: (entry: ResourceEntry) => void
  onToggleHidden: (entry: ResourceEntry, nextHidden: boolean) => void
  onOpenStoredFile: (entry: ResourceEntry, shouldDownload: boolean) => void
  onDelete: (entry: ResourceEntry) => void
}

export default function ResourceEntryRow({
  entry,
  isExpanded,
  isSubmitting,
  isEditing,
  onToggleDetails,
  onStartEdit,
  onToggleHidden,
  onOpenStoredFile,
  onDelete,
}: ResourceEntryRowProps) {
  const hasStoredFile = Boolean(entry.storageBucket && entry.storagePath)

  return (
    <div className="rounded-xl border border-[rgba(66,133,244,0.1)] bg-white px-3 py-2 shadow-[0_4px_10px_rgba(60,64,67,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 font-semibold text-primary-700">
              {entry.section}
            </span>
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">
              {entry.subsection || '-'}
            </span>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 font-semibold text-gray-600">
              {entry.recordKind}
            </span>
            {entry.url ? (
              <a
                href={safeHref(entry.url)}
                target="_blank"
                rel="noopener noreferrer"
                title="URL aç"
                aria-label="URL aç"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
              >
                <ExternalLink size={10} aria-hidden="true" />
              </a>
            ) : null}
          </div>
          <p className="mt-1 truncate text-xs text-gray-900">
            <span className="font-medium">{entry.title}</span>
            {entry.description ? (
              <span className="font-normal text-gray-500"> — {entry.description}</span>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleDetails(entry.id)}
            disabled={isSubmitting}
            title={isExpanded ? 'Detayı kapat' : 'Detayı aç'}
            aria-label={isExpanded ? 'Detayı kapat' : 'Detayı aç'}
            className={`${ICON_BTN_CLS} border-gray-200 bg-white text-gray-600 hover:bg-gray-50`}
          >
            <ChevronDown
              size={13}
              aria-hidden="true"
              className="transition-transform"
              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          <button
            type="button"
            onClick={() => onStartEdit(entry)}
            disabled={isSubmitting || isEditing}
            title="Düzenle"
            aria-label="Düzenle"
            className={`${ICON_BTN_CLS} border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200`}
          >
            <Pencil size={13} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onToggleHidden(entry, true)}
            disabled={isSubmitting}
            title="Gizle"
            aria-label="Gizle"
            className={`${ICON_BTN_CLS} border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100`}
          >
            <EyeOff size={13} aria-hidden="true" />
          </button>
          {hasStoredFile ? (
            <>
              <button
                type="button"
                onClick={() => onOpenStoredFile(entry, false)}
                title="Görüntüle"
                aria-label="Görüntüle"
                className={`${ICON_BTN_CLS} border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100`}
              >
                <Eye size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onOpenStoredFile(entry, true)}
                title="İndir"
                aria-label="İndir"
                className={`${ICON_BTN_CLS} border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}
              >
                <Download size={13} aria-hidden="true" />
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => onDelete(entry)}
            disabled={isSubmitting}
            title="Sil"
            aria-label="Sil"
            className={`${ICON_BTN_CLS} border-red-200 bg-red-50 text-red-600 hover:bg-red-100`}
          >
            <Trash2 size={13} aria-hidden="true" />
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="mt-2 grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 text-[11px] text-gray-700 md:grid-cols-2">
          <p>
            <span className="font-semibold text-gray-800">Açıklama:</span> {entry.description ?? '-'}
          </p>
          <p>
            <span className="font-semibold text-gray-800">Ekleyen:</span> {entry.addedBy}
          </p>
          <p>
            <span className="font-semibold text-gray-800">Dosya Adı:</span> {entry.fileName ?? '-'}
          </p>
          <p>
            <span className="font-semibold text-gray-800">Kayıt Türü:</span> {entry.recordKind}
          </p>
        </div>
      ) : null}
    </div>
  )
}

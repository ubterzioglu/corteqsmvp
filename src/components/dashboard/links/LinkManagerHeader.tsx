'use client'

// Ekran başlığı, Drive klasör kısayolu ve kayıt sayacı şeridi.

import { ExternalLink } from 'lucide-react'
import { safeHref } from '@/lib/security'

const DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1TYFEdjDPOLOMWAf_MScs6XJXRW9FHh-r?usp=drive_link'

/** Şeritte gösterilen sabit tarih — içerik sahibi tarafından elle güncellenir. */
const LAST_UPDATED_LABEL = '24.05.26'

interface LinkManagerHeaderProps {
  headingId: string
  totalCount: number
  visibleCount: number
  hiddenCount: number
}

export default function LinkManagerHeader({
  headingId,
  totalCount,
  visibleCount,
  hiddenCount,
}: LinkManagerHeaderProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[rgba(66,133,244,0.1)] bg-white px-3 py-2">
        <h2 id={headingId} className="text-sm font-semibold text-gray-900">
          Birleşik Kaynak Merkezi
        </h2>
        <a
          href={safeHref(DRIVE_FOLDER_URL)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700 hover:bg-primary-100"
        >
          <ExternalLink size={12} aria-hidden="true" />
          Drive Dosya Klasör Linki
        </a>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-gray-600">
        <p>Son Güncelleme Tarihi : {LAST_UPDATED_LABEL}</p>
        <p>
          Dosya Sayısı : {totalCount} (Aktif: {visibleCount} | Gizli: {hiddenCount})
        </p>
      </div>
    </>
  )
}

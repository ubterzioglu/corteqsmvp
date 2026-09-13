'use client'

// "Gizlenmiş Dosyalar" akordeonu. Gizli kayıtlar da aktif filtrelerden geçer;
// tek eylem geri gösterme (göz düğmesi).

import { Eye } from 'lucide-react'
import AccordionCard from '@/components/dashboard/AccordionCard'
import type { ResourceEntry } from '@/lib/dashboard/resource-items'
import { ICON_BTN_CLS } from './link-manager-styles'

interface HiddenResourcesPanelProps {
  entries: ResourceEntry[]
  isSubmitting: boolean
  onToggleHidden: (entry: ResourceEntry, nextHidden: boolean) => void
}

export default function HiddenResourcesPanel({
  entries,
  isSubmitting,
  onToggleHidden,
}: HiddenResourcesPanelProps) {
  return (
    <AccordionCard
      className="mt-3"
      items={[
        {
          id: 'hidden-resources',
          title: 'Gizlenmiş Dosyalar',
          badge: String(entries.length),
          accentColor: '#8B5CF6',
          children:
            entries.length === 0 ? (
              <p className="text-xs text-gray-500">Gizlenmiş kayıt yok.</p>
            ) : (
              <div className="space-y-1.5">
                {entries.map((entry) => (
                  <div
                    key={`hidden-${entry.id}`}
                    className="rounded-lg border border-violet-100 bg-violet-50/30 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="rounded-full border border-violet-200 bg-violet-100 px-2 py-0.5 font-semibold text-violet-700">
                            {entry.section}
                          </span>
                          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">
                            {entry.subsection || '-'}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-gray-900">
                          <span className="font-medium">{entry.title}</span>
                          {entry.description ? (
                            <span className="font-normal text-gray-500"> — {entry.description}</span>
                          ) : null}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleHidden(entry, false)}
                        disabled={isSubmitting}
                        title="Göster"
                        aria-label="Göster"
                        className={`${ICON_BTN_CLS} border-violet-200 bg-white text-violet-700 hover:bg-violet-100`}
                      >
                        <Eye size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ),
        },
      ]}
    />
  )
}

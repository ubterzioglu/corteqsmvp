// Komuta Merkezi — "Kayıt Kaynakları" kartı.
// Aktif listedeki kayıtların hangi toplantı / WhatsApp yazışmasından geldiğini
// gösterir; bölüm sırası ve sayılar `buildCommandCenterSourceBreakdown`'dan gelir.

import type { CommandCenterSourceBreakdown } from '@/lib/dashboard/command-center-items'

const SOURCE_SECTION_COLORS: Record<string, string> = {
  meeting: '#1A6DC2',
  wa: '#FA7B17',
  todo: '#8B5CF6',
}

export default function SourceBreakdownList({
  breakdown,
}: {
  breakdown: CommandCenterSourceBreakdown
}) {
  if (breakdown.sections.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[rgba(139,92,246,0.3)] bg-white/80 p-6 text-center text-sm text-gray-500">
        Henüz kaynak bilgisi olan kayıt yok.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Aktif listedeki kayıtların hangi toplantı ve WhatsApp yazışmalarından geldiğini gösterir.
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {breakdown.sections.map((section) => {
          const color = SOURCE_SECTION_COLORS[section.kind] ?? '#1A6DC2'

          return (
            <div
              key={section.kind}
              className="space-y-3 rounded-2xl border border-[rgba(66,133,244,0.12)] bg-white p-4 shadow-[0_10px_20px_rgba(60,64,67,0.04)]"
              style={{ borderTop: `3px solid ${color}` }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  {section.label}
                </span>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
                >
                  {section.total}
                </span>
              </div>
              <ul className="space-y-1.5">
                {section.entries.map((entry) => (
                  <li
                    key={entry.key}
                    className="flex items-center justify-between gap-3 rounded-xl bg-gray-50/70 px-3 py-2"
                  >
                    <span className="text-[13px] font-medium text-gray-800">{entry.label}</span>
                    <span
                      className="inline-flex min-w-[28px] items-center justify-center rounded-full px-2 py-1 text-[10px] font-semibold leading-none"
                      style={{ background: `${color}14`, color }}
                    >
                      {entry.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

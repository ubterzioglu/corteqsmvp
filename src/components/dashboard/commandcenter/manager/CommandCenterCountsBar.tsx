// Komuta Merkezi — rozet sayıları şeridi.
// Sayılar facet satırlarından gelir ve TÜM aktif listeyi kapsar; sayfalama ve
// filtre bunları değiştirmez. "Kim: Takım" bilinçli olarak Toplantı Notu ile
// aynı sayıdır (`buildCommandCenterItemCounts` içinde belgelenmiştir).

import type { CommandCenterItemCounts } from '@/lib/dashboard/command-center-items'

export default function CommandCenterCountsBar({
  counts,
}: {
  counts: CommandCenterItemCounts
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
          Toplam: {counts.total}
        </span>
        <span className="rounded-full bg-[rgba(26,109,194,0.12)] px-3 py-1 text-[#1A6DC2]">
          Todo: {counts.todo}
        </span>
        <span className="rounded-full bg-[rgba(139,92,246,0.12)] px-3 py-1 text-[#8B5CF6]">
          Toplantı Notu: {counts.meetingNote}
        </span>
        <span className="rounded-full bg-[rgba(249,115,22,0.14)] px-3 py-1 text-orange-700">
          Kim: Burak {counts.burak}
        </span>
        <span className="rounded-full bg-[rgba(14,165,233,0.14)] px-3 py-1 text-sky-700">
          Kim: UBT {counts.ubt}
        </span>
        <span className="rounded-full bg-[rgba(124,58,237,0.14)] px-3 py-1 text-violet-700">
          Kim: B+B {counts.bb}
        </span>
        <span className="rounded-full bg-[rgba(99,102,241,0.14)] px-3 py-1 text-indigo-700">
          Kim: Takım {counts.team}
        </span>
      </div>
    </div>
  )
}

// Komuta Merkezi — facet satırlarından rozet sayıları ve kaynak dökümü.
// Bölüm sırası (Toplantılar → WhatsApp → Todo) panoda görünen sıradır.

import { getCommandCenterDateGroupInfo, getDateGroupSortToken } from './date-groups'
import { sortFacetRows, toFacetItemShape } from './facets'
import { TODO_DATE_GROUP_LABEL } from './labels'
import type {
  CommandCenterFacetRow,
  CommandCenterItemCounts,
  CommandCenterSourceBreakdown,
  CommandCenterSourceEntry,
  CommandCenterSourceKind,
  CommandCenterSourceSection,
} from './types'

const SOURCE_SECTION_ORDER: CommandCenterSourceKind[] = ['meeting', 'wa', 'todo']
const SOURCE_SECTION_LABELS: Record<CommandCenterSourceKind, string> = {
  meeting: 'Toplantılar',
  wa: 'WhatsApp Yazışmaları',
  todo: 'Todo',
}

function getSourceKindFromDateGroupLabel(label: string): CommandCenterSourceKind {
  if (label === TODO_DATE_GROUP_LABEL) {
    return 'todo'
  }

  return label.startsWith('WA ') ? 'wa' : 'meeting'
}

/**
 * Badge counts, derived from the facet rows. Mirrors the six count queries this used to run:
 * `team` intentionally equals `meetingNote` (both counted meeting notes).
 */
export function buildCommandCenterItemCounts(
  facets: CommandCenterFacetRow[]
): CommandCenterItemCounts {
  const counts = {
    total: 0,
    todo: 0,
    meetingNote: 0,
    burak: 0,
    ubt: 0,
    bb: 0,
    team: 0,
  }

  for (const facet of facets) {
    const itemCount = Number(facet.item_count) || 0
    counts.total += itemCount

    if (facet.item_type === 'todo') {
      counts.todo += itemCount

      if (facet.assignee === 'Burak') {
        counts.burak += itemCount
      } else if (facet.assignee === 'UBT') {
        counts.ubt += itemCount
      } else if (facet.assignee === 'B+B') {
        counts.bb += itemCount
      }

      continue
    }

    if (facet.item_type === 'meeting_note') {
      counts.meetingNote += itemCount
      counts.team += itemCount
    }
  }

  return counts
}

/**
 * Builds a breakdown of how many active (non-archived, non-deleted) command
 * center items originate from each meeting / WhatsApp source — mirroring the
 * date-group labels shown in the "Tip" filter (e.g. "T 26 Şubat", "WA 6 Nisan").
 * Counts cover the full active list, independent of pagination or filters.
 */
export function buildCommandCenterSourceBreakdown(
  facets: CommandCenterFacetRow[]
): CommandCenterSourceBreakdown {
  const entryMap = new Map<string, CommandCenterSourceEntry>()
  let total = 0

  for (const facet of sortFacetRows(facets)) {
    const dateGroup = getCommandCenterDateGroupInfo(toFacetItemShape(facet))
    const itemCount = Number(facet.item_count) || 0

    total += itemCount

    const existing = entryMap.get(dateGroup.key)
    if (existing) {
      entryMap.set(dateGroup.key, { ...existing, count: existing.count + itemCount })
      continue
    }

    entryMap.set(dateGroup.key, {
      key: dateGroup.key,
      label: dateGroup.label,
      kind: getSourceKindFromDateGroupLabel(dateGroup.label),
      count: itemCount,
      sortValue: getDateGroupSortToken(dateGroup.label),
    })
  }

  const sections: CommandCenterSourceSection[] = SOURCE_SECTION_ORDER.map((kind) => {
    const entries = Array.from(entryMap.values())
      .filter((entry) => entry.kind === kind)
      .sort((left, right) => left.sortValue.localeCompare(right.sortValue, 'tr'))

    return {
      kind,
      label: SOURCE_SECTION_LABELS[kind],
      total: entries.reduce((sum, entry) => sum + entry.count, 0),
      entries,
    }
  }).filter((section) => section.entries.length > 0)

  return { sections, total }
}

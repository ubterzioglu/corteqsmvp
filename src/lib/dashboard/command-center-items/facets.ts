// Komuta Merkezi — facet (özet) okuma katmanı.
// Pano, geçerli sayfa dışındaki HER ŞEYİ (filtre seçenekleri, kaynak dökümü,
// rozet sayıları) tek bir küçük facet sorgusundan türetir; tüm tabloyu okumak
// PostgREST'in 1000 satır sınırına takılıp en yeni partileri sessizce gizliyordu.

import { getSupabaseBrowserClient } from '../supabase'
import type { CommandCenterFacetRow, CommandCenterItem, CommandCenterItemType } from './types'

export const COMMAND_CENTER_FACET_SELECT =
  'item_type, category_label, legacy_source_code, legacy_source_date_label, legacy_source_category, assignee, item_count'

/**
 * Reads the aggregated facet view once. Everything the panel needs besides the current page (filter
 * options, source breakdown, badge counts) is derived from this single small result.
 */
export async function fetchCommandCenterFacets(): Promise<CommandCenterFacetRow[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('v_command_center_facets')
    .select(COMMAND_CENTER_FACET_SELECT)

  if (error || !data) {
    return []
  }

  return (data as CommandCenterFacetRow[]).map((row) => ({
    ...row,
    category_label: row.category_label ?? '',
    item_count: Number(row.item_count) || 0,
  }))
}

/** Stable ordering so derived option lists and their merged filter values are deterministic. */
export function sortFacetRows(facets: CommandCenterFacetRow[]): CommandCenterFacetRow[] {
  return [...facets].sort((left, right) => {
    if (left.item_type !== right.item_type) {
      return left.item_type.localeCompare(right.item_type)
    }

    const leftLabel = left.legacy_source_date_label ?? left.category_label ?? ''
    const rightLabel = right.legacy_source_date_label ?? right.category_label ?? ''

    return leftLabel.localeCompare(rightLabel, 'tr')
  })
}

export function matchesFacetFilters(
  facet: CommandCenterFacetRow,
  options?: { itemType?: CommandCenterItemType; sourceCode?: string }
): boolean {
  if (options?.itemType && facet.item_type !== options.itemType) {
    return false
  }

  if (
    options?.sourceCode &&
    options.sourceCode !== 'Tümü' &&
    facet.legacy_source_code !== options.sourceCode
  ) {
    return false
  }

  return true
}

/** Facet row -> the minimal item shape the grouping/labelling helpers need. */
export function toFacetItemShape(
  facet: CommandCenterFacetRow
): Pick<
  CommandCenterItem,
  'itemType' | 'categoryLabel' | 'legacySourceCode' | 'legacySourceDateLabel' | 'legacySourceCategory'
> {
  return {
    itemType: facet.item_type,
    categoryLabel: facet.category_label ?? '',
    legacySourceCode: facet.legacy_source_code,
    legacySourceDateLabel: facet.legacy_source_date_label,
    legacySourceCategory: facet.legacy_source_category,
  }
}

// Komuta Merkezi — PostgREST filtrelerini VERİ olarak üretir.
// Filtreleri builder üzerinde değil, veri olarak kurmak jenerik özyinelemesini
// (TS2589) kaynağında keser; uygulama `queries.ts` içinde yapılır.

import { getMeetingCategoryIdByLabel } from './labels'
import type { FetchCommandCenterItemsOptions } from './types'

function escapeIlikeValue(value: string): string {
  return value.replace(/[%_,()]/g, (char) => `\\${char}`).replace(/,/g, '\\,')
}

function quoteFilterValue(value: string): string {
  return JSON.stringify(value)
}

/**
 * Tek bir PostgREST filtresi — veri olarak. Eskiden bu mantık `TQuery` jenerigiyle
 * doğrudan builder üzerinde çalışıyordu; kısıt kendine referans verdiği için
 * (`eq: (...) => TQuery`) derin `.select().order()...` zinciriyle çağrıldığında
 * TypeScript "Type instantiation is excessively deep" (TS2589) veriyordu — üç
 * çağrı yerinde birden. Filtreleri veri olarak üretip uygulamayı çağrı yerine
 * bırakmak jenerigi tamamen kaldırır; mantık ve sıra aynen korunur.
 */
export type CommandCenterFilterOp =
  | { kind: 'eq'; column: string; value: unknown }
  | { kind: 'neq'; column: string; value: unknown }
  | { kind: 'or'; filters: string }

export function buildCommandCenterFilters(
  options?: FetchCommandCenterItemsOptions
): CommandCenterFilterOp[] {
  const ops: CommandCenterFilterOp[] = []

  if (options?.itemType) {
    ops.push({ kind: 'eq', column: 'item_type', value: options.itemType })
  }

  if (options?.assignee && options.assignee !== 'Tümü') {
    ops.push({ kind: 'eq', column: 'assignee', value: options.assignee })
  }

  if (options?.topCategory?.trim()) {
    const topCategory = options.topCategory.trim()
    const meetingCategoryId = getMeetingCategoryIdByLabel(topCategory)
    const categoryConditions: string[] = []

    if (!options.itemType || options.itemType === 'todo') {
      categoryConditions.push(
        `and(item_type.eq.todo,category_label.eq.${quoteFilterValue(topCategory)})`
      )
    }

    if (!options.itemType || options.itemType === 'meeting_note') {
      if (meetingCategoryId) {
        categoryConditions.push(
          `and(item_type.eq.meeting_note,legacy_source_category.eq.${quoteFilterValue(
            meetingCategoryId
          )})`
        )
      } else if (topCategory === 'Diğer Toplantı Maddeleri') {
        categoryConditions.push('and(item_type.eq.meeting_note,legacy_source_category.is.null)')
      }
    }

    if (categoryConditions.length > 0) {
      ops.push({ kind: 'or', filters: categoryConditions.join(',') })
    }
  }

  if (options?.status && options.status !== 'Tümü') {
    ops.push({ kind: 'eq', column: 'status', value: options.status })
  }

  if (options?.priority && Number.isInteger(options.priority)) {
    ops.push({ kind: 'eq', column: 'priority', value: options.priority })
  }

  if (options?.urgentOnly) {
    ops.push({ kind: 'eq', column: 'urgent', value: true })
  }

  if (options?.sourceCode && options.sourceCode !== 'Tümü') {
    ops.push({ kind: 'eq', column: 'legacy_source_code', value: options.sourceCode })
  }

  if (options?.dateGroup?.trim()) {
    const [kind, payload] = options.dateGroup.split('::')

    if (kind === 'TODO') {
      ops.push({ kind: 'eq', column: 'item_type', value: 'todo' })
    } else if (kind === 'TOP' && payload) {
      ops.push({ kind: 'eq', column: 'item_type', value: 'meeting_note' })
      ops.push({ kind: 'neq', column: 'legacy_source_code', value: 'WA' })
      ops.push({ kind: 'eq', column: 'category_label', value: payload })
    } else if (kind === 'WA' && payload) {
      const rawLabels = payload.split('||').filter(Boolean)
      ops.push({ kind: 'eq', column: 'item_type', value: 'meeting_note' })
      ops.push({ kind: 'eq', column: 'legacy_source_code', value: 'WA' })
      if (rawLabels.length === 1) {
        ops.push({ kind: 'eq', column: 'category_label', value: rawLabels[0] })
      } else if (rawLabels.length > 1) {
        ops.push({
          kind: 'or',
          filters: rawLabels
            .map((rawLabel) => `category_label.eq.${quoteFilterValue(rawLabel)}`)
            .join(','),
        })
      }
    }
  }

  if (options?.searchTerm?.trim()) {
    const searchValue = `%${escapeIlikeValue(options.searchTerm.trim())}%`
    ops.push({
      kind: 'or',
      filters: [
        `title.ilike.${searchValue}`,
        `detail.ilike.${searchValue}`,
        `category_label.ilike.${searchValue}`,
        `legacy_source_date_label.ilike.${searchValue}`,
        `legacy_source_category.ilike.${searchValue}`,
        `legacy_source_title.ilike.${searchValue}`,
      ].join(','),
    })
  }

  return ops
}

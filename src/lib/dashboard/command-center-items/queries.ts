// Komuta Merkezi — okuma sorguları (aktif / silinmiş / arşivlenmiş).
//
// ⚠️ Aşağıdaki üç fonksiyondaki `let query: any` + `eslint-disable` deseni
// BİLİNÇLİDİR ve KORUNMALIDIR: her `.eq()` yeni bir derin generic üretir,
// `query`ye geri atamak TypeScript'i TS2589 ("Type instantiation is excessively
// deep") ile düşürür. Aynı tuzağın aynı çözümü `cadde-internal.ts` içindeki
// `const db = supabase as any` satırında da uygulanmıştır. Sızıntı riski yok:
// sonuç `data as CommandCenterItemRow[]` ile dar tipe geri döner.

import { getSupabaseBrowserClient } from '../supabase'
import { buildCommandCenterFilters } from './filters'
import { COMMAND_CENTER_SELECT, mapCommandCenterRow } from './row-mapping'
import { sortCommandCenterItems } from './sorting'
import type {
  CommandCenterItem,
  CommandCenterItemRow,
  CommandCenterItemsResult,
  FetchCommandCenterItemsOptions,
} from './types'

export async function fetchCommandCenterItems(
  options?: FetchCommandCenterItemsOptions
): Promise<CommandCenterItemsResult> {
  const supabase = getSupabaseBrowserClient()
  const page = Math.max(1, options?.page ?? 1)
  const pageSize = Math.max(1, options?.pageSize ?? 50)

  if (!supabase) {
    return {
      items: [],
      totalCount: 0,
      page,
      pageSize,
    }
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Filtreler .order()/.range() zincirinden ONCE uygulanir. TS2589'un gercek
  // sebebi jenerik degil, DERIN builder tipine yeniden atamaydi: her .eq() yeni
  // bir derin tip uretiyor, `query`ye geri atamak tipi tekrar tekrar cozduruyordu.
  // Siralama/sayfalama zinciri artik sorgunun SONUNDA, tek seferde eklenir.
  //
  // Q6 (tsc TS2589): yukarisi da yetmedi — her `.eq()` hala YENİ bir derin
  // generic uretiyor. `query`nin tipi burada BILEREK `any`e genisletiliyor
  // (cadde-internal.ts'teki `const db = supabase as any` ile ayni tuzak, ayni
  // cozum): sizinti riski yok, cunku sonuc `data as CommandCenterItemRow[]`
  // ile asagida zaten dar tipe geri donuyor.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('command_center_items')
    .select(COMMAND_CENTER_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .is('archived_at', null)

  for (const op of buildCommandCenterFilters(options)) {
    if (op.kind === 'eq') query = query.eq(op.column, op.value)
    else if (op.kind === 'neq') query = query.neq(op.column, op.value)
    else query = query.or(op.filters)
  }

  const { data, error, count } = await query
    .order('priority', { ascending: false })
    .order('item_type', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error || !data) {
    return {
      items: [],
      totalCount: 0,
      page,
      pageSize,
    }
  }

  return {
    items: sortCommandCenterItems((data as CommandCenterItemRow[]).map(mapCommandCenterRow)),
    totalCount: count ?? 0,
    page,
    pageSize,
  }
}

export async function fetchDeletedCommandCenterItems(
  options?: FetchCommandCenterItemsOptions
): Promise<CommandCenterItem[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return []
  }

  // Filtreler .order()/.range() zincirinden ONCE uygulanir; `query` tipi Q6
  // (tsc TS2589) nedeniyle bilerek `any` — açıklama fetchCommandCenterItems'ta.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('command_center_items')
    .select(COMMAND_CENTER_SELECT)
    .is('archived_at', null)
    .not('deleted_at', 'is', null)

  for (const op of buildCommandCenterFilters(options)) {
    if (op.kind === 'eq') query = query.eq(op.column, op.value)
    else if (op.kind === 'neq') query = query.neq(op.column, op.value)
    else query = query.or(op.filters)
  }

  const { data, error } = await query
    .order('deleted_at', { ascending: false })
    .order('priority', { ascending: false })
    .order('item_type', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error || !data) {
    return []
  }

  return (data as CommandCenterItemRow[]).map(mapCommandCenterRow)
}

export async function fetchArchivedCommandCenterItems(
  options?: FetchCommandCenterItemsOptions
): Promise<CommandCenterItem[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return []
  }

  // Filtreler .order()/.range() zincirinden ONCE uygulanir; `query` tipi Q6
  // (tsc TS2589) nedeniyle bilerek `any` — açıklama fetchCommandCenterItems'ta.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('command_center_items')
    .select(COMMAND_CENTER_SELECT)
    .is('deleted_at', null)
    .not('archived_at', 'is', null)

  for (const op of buildCommandCenterFilters(options)) {
    if (op.kind === 'eq') query = query.eq(op.column, op.value)
    else if (op.kind === 'neq') query = query.neq(op.column, op.value)
    else query = query.or(op.filters)
  }

  const { data, error } = await query
    .order('archived_at', { ascending: false })
    .order('priority', { ascending: false })
    .order('item_type', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error || !data) {
    return []
  }

  return (data as CommandCenterItemRow[]).map(mapCommandCenterRow)
}

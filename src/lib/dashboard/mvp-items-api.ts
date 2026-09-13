// S1 (13 Eylül, B6 mixed-data-fetching): MvpManager.tsx doğrudan
// getSupabaseBrowserClient() ile 'mvp_items' tablosuna 5 farklı yerde
// (liste, ekleme, tekil alan güncelleme, tam güncelleme, silme) yazıp okuyordu.
// mvp-items.ts (schemas) zaten satır<->domain tip eşlemesini taşıyordu ama hiç
// Supabase çağrısı yoktu; muhasebe-api.ts/muhasebe-schemas.ts ikilisiyle aynı
// ayrım burada da kuruldu.

import { getSupabaseBrowserClient } from './supabase'
import { mapMvpRow, type MvpItem, type MvpItemRow } from './mvp-items'

const SELECT_FIELDS = 'id, konu, sub, ayrinti, mvp_level, added_by, is_seed, created_at, updated_at'

export interface MvpItemInsert {
  konu: string
  sub: string | null
  ayrinti: string | null
  mvp_level: MvpItemRow['mvp_level']
  added_by: MvpItemRow['added_by']
}

export type MvpItemUpdate = Partial<MvpItemInsert>

/** Tüm maddeler, en yeniden eskiye. supabase yapılandırılmamışsa hata fırlatır (bileşen zaten `if (!supabase)` ile kendi hata metnini üretiyor). */
export async function listMvpItems(): Promise<MvpItem[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error('Supabase bağlantısı yapılandırılmamış.')

  const { data, error } = await supabase
    .from('mvp_items')
    .select(SELECT_FIELDS)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as MvpItemRow[]).map(mapMvpRow)
}

/** Yeni madde ekler. supabase yapılandırılmamışsa null döner (bileşen `if (!supabase) return` ile korunuyor). */
export async function createMvpItem(payload: MvpItemInsert): Promise<MvpItem | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('mvp_items')
    .insert(payload)
    .select(SELECT_FIELDS)
    .single()

  if (error || !data) throw error ?? new Error('Madde eklenemedi.')
  return mapMvpRow(data as MvpItemRow)
}

/** Var olan bir kaydı günceller — tekil alan güncellemesi (mvp_level/added_by) ile tam form güncellemesi ortak yol. */
export async function updateMvpItem(itemId: string, payload: MvpItemUpdate): Promise<MvpItem | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('mvp_items')
    .update(payload)
    .eq('id', itemId)
    .select(SELECT_FIELDS)
    .single()

  if (error || !data) throw error
  return mapMvpRow(data as MvpItemRow)
}

/** Kaydı siler. supabase yapılandırılmamışsa no-op. */
export async function deleteMvpItem(itemId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return

  const { error } = await supabase.from('mvp_items').delete().eq('id', itemId)
  if (error) throw error
}

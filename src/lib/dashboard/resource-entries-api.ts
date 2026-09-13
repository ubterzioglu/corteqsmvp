// R4 (13 Eylül, B6 mixed-data-fetching): LinkManager.tsx doğrudan
// supabase.from('resource_entries') ile 5 farklı yerde okuyup yazıyordu.
// resource-items.ts (schemas) zaten satır↔domain tip eşlemesini taşıyordu ama
// hiç Supabase çağrısı yoktu — muhasebe-api.ts/muhasebe-schemas.ts ikilisiyle
// aynı ayrım burada da kuruldu.

import { getSupabaseBrowserClient } from './supabase'
import { mapResourceEntryRow, type ResourceEntry, type ResourceEntryRow } from './resource-items'
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types'

const SELECT_FIELDS =
  'id, order_no, slug, section, subsection, department, record_kind, added_by, title, description, url, file_id, file_type, mime_type, privacy_level, is_public_import, import_suggestion, tags, source_path, status, is_hidden, storage_bucket, storage_path, file_name, person_first_name, person_last_name, person_role, linkedin_url, instagram_url, website_url, source_folder, source_subfolder, source_snapshot_date, import_batch, created_at'

/** Tüm kayıtlar, en yeniden eskiye. supabase yapılandırılmamışsa boş liste döner. */
export async function listResourceEntries(): Promise<ResourceEntry[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('resource_entries')
    .select(SELECT_FIELDS)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as ResourceEntryRow[]).map(mapResourceEntryRow)
}

/** Yeni kayıt ekler. supabase yapılandırılmamışsa null döner (bileşen zaten `if (!supabase) return` ile korunuyor). */
export async function createResourceEntry(
  payload: TablesInsert<'resource_entries'>,
): Promise<ResourceEntry | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('resource_entries')
    .insert(payload)
    .select(SELECT_FIELDS)
    .single()

  if (error || !data) throw error ?? new Error('Kayıt eklenemedi.')
  return mapResourceEntryRow(data as ResourceEntryRow)
}

/** Var olan bir kaydı günceller (form düzenleme VE tekil alan güncellemesi — ör. is_hidden — için ortak yol). */
export async function updateResourceEntry(
  id: string,
  payload: TablesUpdate<'resource_entries'>,
): Promise<ResourceEntry | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('resource_entries')
    .update(payload)
    .eq('id', id)
    .select(SELECT_FIELDS)
    .single()

  if (error || !data) throw error ?? new Error('Kayıt güncellenemedi.')
  return mapResourceEntryRow(data as ResourceEntryRow)
}

/** Kaydı ve (varsa) storage'daki dosyasını birlikte siler — davranış eskisiyle birebir aynı sıra. */
export async function deleteResourceEntry(entry: {
  id: string
  storageBucket: string | null
  storagePath: string | null
}): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return

  if (entry.storageBucket && entry.storagePath) {
    const { error: storageErr } = await supabase.storage.from(entry.storageBucket).remove([entry.storagePath])
    if (storageErr) throw storageErr
  }

  const { error: deleteErr } = await supabase.from('resource_entries').delete().eq('id', entry.id)
  if (deleteErr) throw deleteErr
}

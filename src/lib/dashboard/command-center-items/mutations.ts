// Komuta Merkezi — yazma işlemleri (ekle / güncelle / sil / arşivle).
// Silme ve arşivleme YUMUŞAKTIR: satır silinmez, `deleted_at` / `archived_at`
// damgalanır; pano bu iki alanı ayrı listelerde gösterir.

import { sanitizeError } from '@/lib/security'
import { getSupabaseBrowserClient } from '../supabase'
import {
  buildCategoryLabel,
  buildTitle,
  validateCommandCenterFormState,
} from './form-state'
import { COMMAND_CENTER_SELECT, mapCommandCenterRow } from './row-mapping'
import type { CommandCenterFormState, CommandCenterItem, CommandCenterItemRow } from './types'

function buildCommandCenterPayload(state: CommandCenterFormState) {
  const categoryLabel = buildCategoryLabel(state)
  const title = buildTitle(state)

  return {
    item_type: state.itemType,
    title,
    detail: state.detail.trim(),
    category_label: categoryLabel,
    assignee: state.assignee,
    status: state.status,
    priority: state.priority,
    due_date: state.itemType === 'meeting_note' ? null : state.dueDate || null,
    urgent: state.urgent,
    legacy_source_type: state.itemType === 'meeting_note' ? 'meeting_notes' : 'todo_items',
    legacy_source_code:
      state.itemType === 'meeting_note' ? state.legacySourceCode.trim() || 'MAN' : null,
    legacy_source_date_label:
      state.itemType === 'meeting_note'
        ? state.legacySourceDateLabel.trim() || categoryLabel
        : null,
    legacy_source_category:
      state.itemType === 'meeting_note' ? state.legacySourceCategory.trim() || null : null,
    legacy_source_title:
      state.itemType === 'meeting_note' ? state.legacySourceTitle.trim() || title : null,
  }
}

export async function createCommandCenterItem(
  state: CommandCenterFormState
): Promise<CommandCenterItem | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const validationError = validateCommandCenterFormState(state)
  if (validationError) {
    console.error(validationError)
    return null
  }

  const { data, error } = await supabase
    .from('command_center_items')
    .insert(buildCommandCenterPayload(state))
    .select(COMMAND_CENTER_SELECT)
    .single()

  if (error || !data) {
    console.error(sanitizeError(error, 'Command center kaydı eklenemedi.'))
    return null
  }

  return mapCommandCenterRow(data as CommandCenterItemRow)
}

export async function updateCommandCenterItem(
  id: string,
  state: CommandCenterFormState
): Promise<CommandCenterItem | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const validationError = validateCommandCenterFormState(state)
  if (validationError) {
    console.error(validationError)
    return null
  }

  const { data, error } = await supabase
    .from('command_center_items')
    .update(buildCommandCenterPayload(state))
    .eq('id', id)
    .select(COMMAND_CENTER_SELECT)
    .single()

  if (error || !data) {
    console.error(sanitizeError(error, 'Command center kaydı güncellenemedi.'))
    return null
  }

  return mapCommandCenterRow(data as CommandCenterItemRow)
}

export async function deleteCommandCenterItem(id: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('command_center_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
  return !error
}

export async function archiveCommandCenterItem(id: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('command_center_items')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .is('archived_at', null)

  return !error
}

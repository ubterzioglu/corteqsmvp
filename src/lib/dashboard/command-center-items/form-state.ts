// Komuta Merkezi — form durumu üretimi ve doğrulama.
// `buildTitle` / `buildCategoryLabel` hem doğrulamada hem de yazma yükünü kuran
// `mutations.ts` içinde kullanılır; ikisi de AYNI değeri üretmelidir, yoksa
// doğrulanan metin ile kaydedilen metin ayrışır.

import { validateContent, validateTitle } from '@/lib/security'
import { TODO_ASSIGNEES, TODO_STATUSES, type TodoAssignee, type TodoStatus } from '../todo-items'
import { COMMAND_CENTER_PRIORITY_OPTIONS } from './types'
import type { CommandCenterFormState, CommandCenterItem } from './types'

export function createEmptyCommandCenterFormState(
  defaults?: Partial<CommandCenterFormState>
): CommandCenterFormState {
  return {
    itemType: defaults?.itemType ?? 'todo',
    title: defaults?.title ?? '',
    detail: defaults?.detail ?? '',
    categoryLabel: defaults?.categoryLabel ?? '',
    assignee: defaults?.assignee ?? 'Atanmadi',
    status: defaults?.status ?? 'Baslanmadi',
    priority: defaults?.priority ?? 5,
    dueDate: defaults?.dueDate ?? '',
    urgent: defaults?.urgent ?? false,
    legacySourceCode: defaults?.legacySourceCode ?? '',
    legacySourceDateLabel: defaults?.legacySourceDateLabel ?? '',
    legacySourceCategory: defaults?.legacySourceCategory ?? '',
    legacySourceTitle: defaults?.legacySourceTitle ?? '',
  }
}

export function toCommandCenterFormState(item: CommandCenterItem): CommandCenterFormState {
  return {
    itemType: item.itemType,
    title: item.title,
    detail: item.detail,
    categoryLabel: item.categoryLabel,
    assignee: item.assignee,
    status: item.status,
    priority: item.priority,
    dueDate: item.dueDate ?? '',
    urgent: item.urgent,
    legacySourceCode: item.legacySourceCode ?? '',
    legacySourceDateLabel: item.legacySourceDateLabel ?? '',
    legacySourceCategory: item.legacySourceCategory ?? '',
    legacySourceTitle: item.legacySourceTitle ?? '',
  }
}

export function buildTitle(state: CommandCenterFormState): string {
  const fallback = state.detail.trim().slice(0, 80) || 'Yeni kayıt'
  return (state.title.trim() || fallback).slice(0, 160)
}

export function buildCategoryLabel(state: CommandCenterFormState): string {
  if (state.itemType === 'meeting_note') {
    return state.categoryLabel.trim() || state.legacySourceDateLabel.trim() || 'Tarihsiz'
  }

  return state.categoryLabel.trim() || 'Genel'
}

export function validateCommandCenterFormState(state: CommandCenterFormState): string | null {
  const titleError = validateTitle(buildTitle(state))
  if (titleError) return titleError

  const detailError = validateContent(state.detail)
  if (detailError) return detailError

  if (!buildCategoryLabel(state)) {
    return 'Kategori boş bırakılamaz.'
  }

  if (
    !TODO_ASSIGNEES.includes(state.assignee as TodoAssignee) ||
    !TODO_STATUSES.includes(state.status as TodoStatus)
  ) {
    return 'Geçersiz atama veya durum.'
  }

  if (
    !Number.isInteger(state.priority) ||
    state.priority < COMMAND_CENTER_PRIORITY_OPTIONS[0] ||
    state.priority > COMMAND_CENTER_PRIORITY_OPTIONS[COMMAND_CENTER_PRIORITY_OPTIONS.length - 1]
  ) {
    return 'Geçersiz prio değeri.'
  }

  return null
}

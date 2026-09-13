// Komuta Merkezi — hücre metni biçimleyicileri.
// Geçersiz/boş tarihler için görünen yedek metinler bilinçlidir: eklenme tarihi
// yoksa '10.05.26' (panonun ilk toplu içe aktarım tarihi) gösterilir.

import { createEmptyCommandCenterFormState } from '@/lib/dashboard/command-center-items'
import type {
  CommandCenterFormState,
  CommandCenterItemType,
} from '@/lib/dashboard/command-center-items'

export function getItemDetail(value: string): string {
  return value.trim() || 'Detay yok'
}

export function formatDeletedAt(value: string | null): string {
  if (!value) {
    return 'Bilinmiyor'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Bilinmiyor'
  }

  return date.toLocaleString('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export function formatCreatedAt(value: string | null): string {
  if (!value) {
    return '10.05.26'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '10.05.26'
  }

  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export function createDefaultFormState(
  lockedItemType?: CommandCenterItemType,
  itemTypeOverride?: CommandCenterItemType
): CommandCenterFormState {
  const itemType = itemTypeOverride ?? lockedItemType ?? 'todo'

  return createEmptyCommandCenterFormState(
    itemType === 'meeting_note'
      ? {
          itemType: 'meeting_note',
          assignee: 'UBT',
          status: 'Beklemede',
          legacySourceCode: 'MAN',
        }
      : {
          itemType: 'todo',
        }
  )
}

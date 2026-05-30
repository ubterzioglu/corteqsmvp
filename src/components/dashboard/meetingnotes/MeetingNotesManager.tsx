'use client'

import CommandCenterManager from '@/components/dashboard/commandcenter/CommandCenterManager'

export default function MeetingNotesManager() {
  return (
    <CommandCenterManager
      title="Toplantı Özetleri ve WA Konuşma Özetleri"
      description="Command center kaynağından sadece toplantı maddeleri gösterilir."
      compatibilityMessage="Bu içerik artık /commandcenter üzerinden yönetiliyor. Bu sayfa geçiş sürecinde yalnız toplantı maddelerini yeni kaynaktan gösterir."
      lockedItemType="meeting_note"
    />
  )
}

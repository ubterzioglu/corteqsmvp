'use client'

import CommandCenterManager from '@/components/dashboard/commandcenter/CommandCenterManager'

export default function TodoManager() {
  return (
    <CommandCenterManager
      title="Todo Listesi"
      description="Command center kaynağından sadece todo kayıtları gösterilir."
      compatibilityMessage="Bu içerik artık /commandcenter üzerinden yönetiliyor. Bu sayfa geçiş sürecinde yalnız todo filtresiyle yeni kaynağı gösterir."
      lockedItemType="todo"
    />
  )
}

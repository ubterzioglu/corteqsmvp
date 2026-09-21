import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { KADRO_STATUSES, KADRO_PRIORITIES } from "@/lib/kadro/kadro-taxonomy";
import type { KadroRoleEvent } from "@/lib/kadro/kadro-types";

interface KadroEventLogProps {
  events: KadroRoleEvent[];
  isLoading: boolean;
}

export function KadroEventLog({ events, isLoading }: KadroEventLogProps) {
  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">Yükleniyor...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">Henüz değişiklik yok</p>
      </div>
    );
  }

  const getFieldLabel = (field: string) => {
    switch (field) {
      case "status":
        return "Durum";
      case "priority":
        return "Öncelik";
      case "ownerName":
        return "Sorumlu Kişi";
      case "note":
        return "Not";
      default:
        return field;
    }
  };

  const formatValue = (field: string, value: string | null) => {
    if (!value) return "—";
    
    if (field === "status") {
      return KADRO_STATUSES[value as keyof typeof KADRO_STATUSES]?.label ?? value;
    }
    
    if (field === "priority") {
      return KADRO_PRIORITIES[value as keyof typeof KADRO_PRIORITIES]?.label ?? value;
    }
    
    return value;
  };

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 py-2"
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {getFieldLabel(event.field)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                {format(new Date(event.changedAt), "dd MMM yyyy, HH:mm", { locale: tr })}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <span className="line-through text-slate-400 dark:text-slate-500">
              {formatValue(event.field, event.oldValue)}
            </span>
            <span className="mx-2">→</span>
            <span className="text-slate-900 dark:text-slate-100">
              {formatValue(event.field, event.newValue)}
            </span>
          </div>
          
          {event.changedBy && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Değiştiren: {event.changedBy}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

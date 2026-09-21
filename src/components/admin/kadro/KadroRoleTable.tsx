import { KADRO_DEPTS, KADRO_AXES, KADRO_STATUSES, KADRO_PRIORITIES } from "@/lib/kadro/kadro-taxonomy";
import type { KadroGroup } from "@/lib/kadro/kadro-view";
import type { KadroResolvedRole } from "@/lib/kadro/kadro-types";

interface KadroRoleTableProps {
  groups: KadroGroup[];
  onSelectRole: (role: KadroResolvedRole) => void;
}

export function KadroRoleTable({ groups, onSelectRole }: KadroRoleTableProps) {
  const getDeptName = (deptId: string) => {
    return KADRO_DEPTS.find((d) => d.id === deptId)?.name ?? deptId;
  };

  const getAxisName = (axisId: string) => {
    return KADRO_AXES.find((a) => a.id === axisId)?.name ?? axisId;
  };

  const getStatusLabel = (status: string) => {
    return KADRO_STATUSES[status as keyof typeof KADRO_STATUSES]?.label ?? status;
  };

  const getPriorityLabel = (priority: string) => {
    return KADRO_PRIORITIES[priority as keyof typeof KADRO_PRIORITIES]?.label ?? priority;
  };

  const getStatusTone = (status: string) => {
    const tone = KADRO_STATUSES[status as keyof typeof KADRO_STATUSES]?.tone;
    switch (tone) {
      case "ok":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200";
      case "warn":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
      case "crit":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
      case "mute":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      case "open":
        return "bg-amber-50 text-amber-900 ring-1 ring-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-800";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const getPriorityTone = (priority: string) => {
    const tone = KADRO_PRIORITIES[priority as keyof typeof KADRO_PRIORITIES]?.tone;
    switch (tone) {
      case "crit":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
      case "warn":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200";
      case "mute":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  if (groups.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 border border-slate-200 dark:border-slate-700 text-center">
        <p className="text-slate-600 dark:text-slate-400">Filtrelere uygun pozisyon bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.deptId} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {getDeptName(group.deptId)}
            </h2>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {group.axes.map((axis) => (
              <div key={axis.axisId}>
                {group.axes.length > 1 && (
                  <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {getAxisName(axis.axisId)}
                    </h3>
                  </div>
                )}

                {axis.roles.map((role) => (
                  <div
                    key={role.id}
                    onClick={() => onSelectRole(role)}
                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {role.title}
                          </h4>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Dalga {role.wave}
                          </span>
                        </div>

                        {role.currentOwner && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                            {role.currentOwner}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusTone(role.currentStatus)}`}>
                            {getStatusLabel(role.currentStatus)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityTone(role.currentPriority)}`}>
                            {getPriorityLabel(role.currentPriority)}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {role.type === "core" ? "Çekirdek" : role.type === "part" ? "Part-time" : role.type}
                          </span>
                        </div>
                      </div>

                      {role.hasState && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                            Düzenlendi
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

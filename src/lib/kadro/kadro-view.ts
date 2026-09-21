import { trIncludes } from "@/lib/text-normalization";
import type { KadroRole, KadroRoleState, KadroResolvedRole } from "./kadro-types";
import { KADRO_OPEN_STATUSES, KADRO_FILLED_STATUSES } from "./kadro-taxonomy";
import { KADRO_ROLE_IDS } from "./roles";

export function resolveKadroRoles(
  roles: KadroRole[],
  states: KadroRoleState[],
): KadroResolvedRole[] {
  const stateMap = new Map(states.map((s) => [s.roleKey, s]));

  return roles.map((role) => {
    const state = stateMap.get(role.id);

    return {
      ...role,
      currentStatus: state?.status ?? role.status,
      currentPriority: state?.priority ?? role.pri,
      currentOwner: state?.ownerName ?? role.owner,
      note: state?.note ?? "",
      hasState: !!state,
      updatedAt: state?.updatedAt ?? null,
    };
  });
}

export function findOrphanStateKeys(states: KadroRoleState[]): string[] {
  return states.filter((s) => !KADRO_ROLE_IDS.has(s.roleKey)).map((s) => s.roleKey);
}

export interface KadroFilters {
  q: string;
  dept: string;
  wave: string;
  type: string;
  status: string;
  openOnly: boolean;
}

export const KADRO_EMPTY_FILTERS: KadroFilters = {
  q: "",
  dept: "",
  wave: "",
  type: "",
  status: "",
  openOnly: false,
};

export function filterKadroRoles(
  roles: KadroResolvedRole[],
  filters: KadroFilters,
): KadroResolvedRole[] {
  return roles.filter((role) => {
    if (filters.dept && role.dept !== filters.dept) return false;
    if (filters.wave && String(role.wave) !== filters.wave) return false;
    if (filters.type && role.type !== filters.type) return false;
    if (filters.status && role.currentStatus !== filters.status) return false;
    if (filters.openOnly && !KADRO_OPEN_STATUSES.includes(role.currentStatus)) return false;

    if (filters.q) {
      const searchFields = [
        role.title,
        role.currentOwner,
        role.note,
        role.jd,
        ...role.kpi,
      ].join(" ");

      if (!trIncludes(searchFields, filters.q)) return false;
    }

    return true;
  });
}

export function summarizeKadroRoles(roles: KadroResolvedRole[]) {
  const total = roles.length;
  const open = roles.filter((r) => KADRO_OPEN_STATUSES.includes(r.currentStatus)).length;
  const filled = roles.filter((r) => KADRO_FILLED_STATUSES.includes(r.currentStatus)).length;
  const criticalOpen = roles.filter(
    (r) => r.currentPriority === "kritik" && KADRO_OPEN_STATUSES.includes(r.currentStatus),
  ).length;

  return { total, open, filled, criticalOpen };
}

export interface KadroGroup {
  deptId: string;
  axes: Array<{
    axisId: string;
    roles: KadroResolvedRole[];
  }>;
}

export function groupKadroRoles(roles: KadroResolvedRole[]): KadroGroup[] {
  const deptMap = new Map<string, Map<string, KadroResolvedRole[]>>();

  for (const role of roles) {
    if (!deptMap.has(role.dept)) {
      deptMap.set(role.dept, new Map());
    }
    const axisMap = deptMap.get(role.dept)!;

    if (!axisMap.has(role.axis)) {
      axisMap.set(role.axis, []);
    }
    axisMap.get(role.axis)!.push(role);
  }

  const groups: KadroGroup[] = [];
  for (const [deptId, axisMap] of deptMap) {
    const axes: KadroGroup["axes"] = [];
    for (const [axisId, axisRoles] of axisMap) {
      axes.push({ axisId, roles: axisRoles });
    }
    groups.push({ deptId, axes });
  }

  return groups;
}

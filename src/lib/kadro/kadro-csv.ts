import type { KadroResolvedRole } from "./kadro-types";
import { KADRO_DEPTS, KADRO_AXES, KADRO_WORK_TYPES, KADRO_STATUSES, KADRO_PRIORITIES } from "./kadro-taxonomy";

export function buildKadroCsv(roles: KadroResolvedRole[]): string {
  const headers = [
    "Rol ID",
    "Pozisyon",
    "Departman",
    "Eksen",
    "Çalışma Tipi",
    "Dalga",
    "Durum",
    "Öncelik",
    "Sahip",
    "Rapor Yöneticisi",
    "KPI'lar",
    "Not",
  ];

  const rows = roles.map((role) => {
    const dept = KADRO_DEPTS.find((d) => d.id === role.dept);
    const axis = KADRO_AXES.find((a) => a.id === role.axis);
    const workType = KADRO_WORK_TYPES[role.type];
    const status = KADRO_STATUSES[role.currentStatus];
    const priority = KADRO_PRIORITIES[role.currentPriority];

    return [
      role.id,
      role.title,
      dept?.name ?? role.dept,
      axis?.name ?? role.axis,
      workType,
      String(role.wave),
      status.label,
      priority.label,
      role.currentOwner,
      role.reports,
      role.kpi.join("; "),
      role.note,
    ];
  });

  const escapeCsvField = (field: string): string => {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const csvLines = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(",")),
  ];

  return csvLines.join("\n");
}

export function downloadKadroCsv(roles: KadroResolvedRole[], filename?: string): void {
  const csv = buildKadroCsv(roles);
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().split("T")[0];
  const defaultFilename = `kadro-${timestamp}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", filename ?? defaultFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

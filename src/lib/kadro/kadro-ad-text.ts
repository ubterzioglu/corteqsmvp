import type { KadroRole } from "./kadro-types";
import { KADRO_AD_BLOCKS, KADRO_DEPTS, KADRO_AXES, KADRO_WORK_TYPES, KADRO_STATUSES, KADRO_PRIORITIES } from "./kadro-taxonomy";

export function buildKadroAdText(role: KadroRole): string | null {
  if (!role.ad) return null;

  const dept = KADRO_DEPTS.find((d) => d.id === role.dept);
  const axis = KADRO_AXES.find((a) => a.id === role.axis);
  const workType = KADRO_WORK_TYPES[role.type];
  const status = KADRO_STATUSES[role.status];
  const priority = KADRO_PRIORITIES[role.pri];

  const lines: string[] = [];

  lines.push(`# ${role.title}`);
  lines.push("");
  lines.push(role.ad.sum);
  lines.push("");

  lines.push("## Ne yapacaksın?");
  for (const item of role.ad.does) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Kimi arıyoruz?");
  for (const item of role.ad.profile) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Görev Detayları");
  lines.push(`- **Departman:** ${dept?.name ?? role.dept}`);
  lines.push(`- **Eksen:** ${axis?.name ?? role.axis}`);
  lines.push(`- **Çalışma Tipi:** ${workType}`);
  lines.push(`- **Dalga:** ${role.wave}`);
  lines.push(`- **Durum:** ${status.label}`);
  lines.push(`- **Öncelik:** ${priority.label}`);
  lines.push(`- **Rapor Yöneticisi:** ${role.reports}`);
  lines.push(`- **Çalışma Saati:** ${role.hours}`);
  lines.push(`- **Ücret:** ${role.pay}`);
  lines.push(`- **ESOP:** ${role.esop}`);
  lines.push("");

  lines.push("## KPI'lar");
  for (const kpi of role.kpi) {
    lines.push(`- ${kpi}`);
  }
  lines.push("");

  lines.push("## Çalışma Düzeni");
  lines.push(role.cadence);
  lines.push("");

  lines.push("## Araçlar");
  lines.push(role.tools);
  lines.push("");

  lines.push("## Tetikleyici");
  lines.push(role.trigger);
  lines.push("");

  lines.push("## Çıkış Planı");
  lines.push(role.exit);
  lines.push("");

  lines.push("---");
  lines.push("");
  lines.push(KADRO_AD_BLOCKS.startup);
  lines.push("");
  lines.push(KADRO_AD_BLOCKS.model);
  lines.push("");
  lines.push(KADRO_AD_BLOCKS.apply);
  lines.push("");
  lines.push("## Görev Testi");
  lines.push(role.ad.test);

  return lines.join("\n");
}

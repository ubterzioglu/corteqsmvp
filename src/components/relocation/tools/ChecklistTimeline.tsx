// Görev timeline kartı — checklist result_kind (#8 İlk 90 Gün).
// primary_result.tasks öğelerini faza göre gruplar; her görev başlık + öncelik rozeti.
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PHASE_LABELS, PHASE_ORDER, type PlannerPhase } from "@/lib/relocation-tools-planner";

interface ChecklistTask {
  key?: string;
  title?: string;
  phase?: string;
  priority?: number;
  [extra: string]: unknown;
}

interface ChecklistTimelineProps {
  title: string;
  tasks: ChecklistTask[];
}

export function ChecklistTimeline({ title, tasks }: ChecklistTimelineProps) {
  if (tasks.length === 0) return null;

  const phases = Object.keys(PHASE_ORDER) as PlannerPhase[];
  const groups = phases
    .map((phase) => ({ phase, items: tasks.filter((t) => t.phase === phase) }))
    .filter((g) => g.items.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {groups.map((group) => (
          <div key={group.phase} className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              {PHASE_LABELS[group.phase]}
            </h3>
            <ul className="space-y-2">
              {group.items.map((task, idx) => (
                <li
                  key={task.key ?? idx}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <span className="text-sm text-foreground">{task.title ?? task.key}</span>
                  {typeof task.priority === "number" && (
                    <Badge variant="outline" className="shrink-0">
                      {Math.round(task.priority * 100)}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

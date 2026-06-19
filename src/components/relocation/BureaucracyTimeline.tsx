// Bürokrasi adımları zaman çizelgesi — build_checklist_v1 çıktısını trigger'a göre gruplar.
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { RelocationStepRow, RelocationStepTrigger } from "@/lib/relocation-types";

const TRIGGER_ORDER: RelocationStepTrigger[] = ["before_departure", "after_arrival", "ongoing"];

interface BureaucracyTimelineProps {
  steps: RelocationStepRow[];
  triggerLabels: Record<RelocationStepTrigger, string>;
  documentsLabel: string;
  deadlineLabel: string;
  emptyLabel: string;
}

export function BureaucracyTimeline({
  steps,
  triggerLabels,
  documentsLabel,
  deadlineLabel,
  emptyLabel,
}: BureaucracyTimelineProps) {
  if (steps.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-6">
      {TRIGGER_ORDER.map((trigger) => {
        const group = steps.filter((s) => s.trigger === trigger);
        if (group.length === 0) return null;
        return (
          <div key={trigger} className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">{triggerLabels[trigger]}</h3>
            {group.map((step) => (
              <Card key={step.id}>
                <CardContent className="space-y-2 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">{step.name}</span>
                    {step.deadline_rule && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {deadlineLabel}: {step.deadline_rule}
                      </Badge>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  )}
                  {step.required_documents.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">{documentsLabel}:</span>{" "}
                      {step.required_documents.join(", ")}
                    </p>
                  )}
                  {step.official_url && (
                    <a
                      href={step.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {step.official_url_label ?? step.official_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}

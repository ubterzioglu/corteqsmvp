import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CareerJob } from "@/lib/careers/careers-types";

import { positionAnchorId } from "./career-anchors";

type CareerPositionCardProps = {
  job: CareerJob;
  areaLabel: string;
  onApply: (positionId: string) => void;
};


export function CareerPositionCard({ job, areaLabel, onApply }: CareerPositionCardProps) {
  return (
    <AccordionItem
      value={job.id}
      id={positionAnchorId(job.id)}
      className="scroll-mt-28 rounded-xl border border-border/60 bg-card px-4"
    >
      <AccordionTrigger className="py-5 text-left hover:no-underline">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold sm:text-lg">{job.tr}</span>
            <Badge variant="secondary" className="font-normal">
              {areaLabel}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{job.en}</p>
          {job.badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.badges.map((badge) => (
                <Badge key={badge} variant="outline" className="font-normal">
                  {badge}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </AccordionTrigger>

      <AccordionContent className="pb-6">
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{job.intro}</p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold">Ne yapacaksın</h4>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {job.tasks.map((task) => (
                <li key={task} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span className="text-pretty">{task}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Seni nasıl hayal ediyoruz</h4>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {job.profile.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span className="text-pretty">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 rounded-lg bg-muted/40 p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="font-semibold">Artı olur</dt>
            <dd className="mt-1 text-pretty text-muted-foreground">{job.plus}</dd>
          </div>
          <div>
            <dt className="font-semibold">Raporlama ve yol</dt>
            <dd className="mt-1 text-pretty text-muted-foreground">{job.report}</dd>
          </div>
          <div>
            <dt className="font-semibold">Çalışma modeli</dt>
            <dd className="mt-1 text-pretty text-muted-foreground">{job.model}</dd>
          </div>
        </dl>

        <Button className="mt-6" onClick={() => onApply(job.id)}>
          Bu pozisyona başvur
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}

export default CareerPositionCard;

import { GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CAREER_INTERNSHIP } from "@/lib/careers/careers-data";

type CareerInternProgramProps = {
  onApply: (positionId: string) => void;
};

export function CareerInternProgram({ onApply }: CareerInternProgramProps) {
  return (
    <section
      id={`ilan-${CAREER_INTERNSHIP.id}`}
      className="border-y border-border/60 bg-primary/5 scroll-mt-24"
    >
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{CAREER_INTERNSHIP.tr}</h2>
            <p className="text-sm text-muted-foreground">{CAREER_INTERNSHIP.en}</p>
          </div>
        </div>

        <p className="mt-5 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground">
          {CAREER_INTERNSHIP.intro}
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Programda ne olacak</h3>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {CAREER_INTERNSHIP.tasks.map((task) => (
                <li key={task} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span className="text-pretty">{task}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Kimleri arıyoruz</h3>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {CAREER_INTERNSHIP.profile.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span className="text-pretty">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-6 rounded-lg bg-background/70 p-4 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Çalışma modeli: </span>
          {CAREER_INTERNSHIP.model}
        </p>

        <Button className="mt-6" onClick={() => onApply(CAREER_INTERNSHIP.id)}>
          Staj programına başvur
        </Button>
      </div>
    </section>
  );
}

export default CareerInternProgram;

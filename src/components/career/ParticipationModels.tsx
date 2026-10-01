import { Globe2 } from "lucide-react";

import { CAREER_OPEN_INVITE, PARTICIPATION_FINE_PRINT, PARTICIPATION_MODELS } from "./career-content";

export function ParticipationModels() {
  return (
    <section className="border-y border-border/60 bg-muted/20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{CAREER_OPEN_INVITE.title}</h2>
          <div className="mt-5 space-y-4 text-pretty text-sm leading-relaxed text-muted-foreground">
            {CAREER_OPEN_INVITE.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium">
            <Globe2 className="h-4 w-4 text-primary" aria-hidden="true" />
            {CAREER_OPEN_INVITE.remoteNote}
          </p>
        </div>

        <div aria-label="Katılım modelleri" className="space-y-4">
          {PARTICIPATION_MODELS.map((model) => (
            <article key={model.title} className="rounded-xl border border-border/60 bg-card p-6">
              <h3 className="text-lg font-semibold">{model.title}</h3>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">{model.body}</p>
            </article>
          ))}
          <p className="text-xs leading-relaxed text-muted-foreground">{PARTICIPATION_FINE_PRINT}</p>
        </div>
      </div>
    </section>
  );
}

export default ParticipationModels;

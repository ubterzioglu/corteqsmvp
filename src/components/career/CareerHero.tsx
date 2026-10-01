import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CAREER_HERO } from "./career-content";

export function CareerHero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/5 to-background">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{CAREER_HERO.eyebrow}</p>
        <h1 className="mt-4 text-balance text-3xl font-bold leading-tight sm:text-5xl">{CAREER_HERO.title}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
          {CAREER_HERO.description}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href={CAREER_HERO.primaryCta.href}>
              {CAREER_HERO.primaryCta.label}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={CAREER_HERO.secondaryCta.href}>{CAREER_HERO.secondaryCta.label}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default CareerHero;

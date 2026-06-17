/**
 * 6. Hikaye / kampanya nehri — Vodafone'un editöryel modüllerinin diaspora uyarlaması.
 * Placeholder anlatılar; devamı mevcut içerik route'larına (radar/rehberler, founders) gider.
 */

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { DIASPORA_STORIES } from "./home-trial.data";

const DiasporaStoriesSection = () => {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-4xl">
            Ağdaki hikayeler
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Diasporada gerçek bağlantıların gündelik hayatı nasıl değiştirdiğini gösteren
            anlatılar.
          </p>
        </div>
        <Link
          to="/radar/rehberler"
          className="inline-flex items-center gap-1 text-sm font-semibold text-glow-teal underline-offset-4 hover:underline"
        >
          Tümünü gör
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {DIASPORA_STORIES.map((story) => (
          <Link
            key={story.title}
            to={story.to}
            className="glass-tech group flex flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-teal"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-glow-orange">
              {story.eyebrow}
            </span>
            <h3 className="mt-3 font-display text-lg font-bold leading-snug text-foreground">
              {story.title}
            </h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              {story.excerpt}
            </p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-glow-teal">
              Okumaya devam et
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default DiasporaStoriesSection;

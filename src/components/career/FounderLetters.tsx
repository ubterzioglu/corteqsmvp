import { FOUNDER_LETTERS } from "./career-content";

export function FounderLetters() {
  return (
    <section id="kuruculardan" className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-2xl font-bold sm:text-3xl">Kuruculardan</h2>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {FOUNDER_LETTERS.map((letter) => (
          <article key={letter.name} className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <img
                src={letter.photo}
                alt={letter.name}
                width={56}
                height={56}
                loading="lazy"
                decoding="async"
                className="h-14 w-14 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold">{letter.name}</p>
                <p className="text-sm text-muted-foreground">{letter.title}</p>
              </div>
            </div>
            <div className="mt-5 space-y-4 text-pretty text-sm leading-relaxed text-muted-foreground">
              {letter.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FounderLetters;

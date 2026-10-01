import { useEffect, useState } from "react";

import { CAREER_CLOCK_CITIES, CAREER_CLOCK_NOTE } from "./career-content";

/**
 * Diaspora şehirlerinde yerel saat bandı (KR04).
 *
 * ⚠️ Saat `Intl.DateTimeFormat("tr-TR", { timeZone })` ile hesaplanır — elle
 * UTC kaydırması YAPILMAZ. Yaz saati geçişleri ülkeden ülkeye farklı tarihlerde
 * olur; sabit kaydırma yılda iki kez sessizce bir saat yanlış gösterir.
 *
 * ⚠️ `prefers-reduced-motion` açıkken sayaç yine ÇALIŞIR (saat bilgidir,
 * süslemesi değil); kapatılan şey geçiş animasyonudur.
 */
const FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

const TICK_MS = 15_000;

function formatCity(timeZone: string, now: Date) {
  try {
    return {
      time: new Intl.DateTimeFormat("tr-TR", { ...FORMAT_OPTIONS, timeZone }).format(now),
      day: new Intl.DateTimeFormat("tr-TR", { weekday: "long", timeZone }).format(now),
    };
  } catch {
    // Bilinmeyen saat dilimi ortamda desteklenmiyorsa bant çökmez, o şehir boş kalır.
    return { time: "--:--", day: "" };
  }
}

export function CareerClockBand() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section aria-label="Diaspora şehirlerinde şu anki saat" className="border-y border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {CAREER_CLOCK_CITIES.map((city) => {
            const { time, day } = formatCity(city.timeZone, now);
            return (
              <li
                key={city.timeZone}
                className={`rounded-lg border px-3 py-2 text-center ${
                  city.primary ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background/60"
                }`}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{city.label}</p>
                <p className="font-mono text-lg tabular-nums">
                  <time dateTime={now.toISOString()}>{time}</time>
                </p>
                <p className="text-[11px] text-muted-foreground">{day}</p>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-center text-sm text-muted-foreground">{CAREER_CLOCK_NOTE}</p>
      </div>
    </section>
  );
}

export default CareerClockBand;

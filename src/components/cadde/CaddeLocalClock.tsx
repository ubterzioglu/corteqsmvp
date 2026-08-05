// Workshop m133 — kapsam şeridindeki yerel saat rozeti.
// Saf mantık (şehir çözümü, saat okuma, gün/gece eşiği) ayrı dosyada ve testli:
// src/lib/cadde-local-clock.ts. Burada yalnız tik ve çizim var.

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { readCaddeClock, type CaddeClockTarget } from "@/lib/cadde-local-clock";

/** Saniye gösterilmiyor; dakika hassasiyeti için 30 sn yeterli (en fazla 30 sn bayat). */
const TICK_MS = 30_000;

export interface CaddeLocalClockProps {
  target: CaddeClockTarget;
  /**
   * Saati sabitlemek için — yalnız testler verir. Verildiğinde interval HİÇ kurulmaz,
   * böylece test ortamında başıboş timer kalmaz.
   */
  now?: Date;
}

const CaddeLocalClock = ({ target, now }: CaddeLocalClockProps) => {
  const [tick, setTick] = useState<Date>(() => now ?? new Date());

  useEffect(() => {
    if (now) return;
    const id = window.setInterval(() => setTick(new Date()), TICK_MS);
    return () => window.clearInterval(id);
  }, [now]);

  const reading = readCaddeClock(now ?? tick, target.timeZone);
  // Saat dilimi çözülemediyse rozet HİÇ çizilmez — yanlış saat, saatsizlikten kötüdür.
  if (!reading) return null;

  const Icon = reading.isDay ? Sun : Moon;

  return (
    <span
      data-testid="cadde-local-clock"
      aria-label={`${target.cityName} yerel saati ${reading.time}`}
      title={`${target.cityName} yerel saati`}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
    >
      <Icon
        aria-hidden
        className={`h-3.5 w-3.5 ${reading.isDay ? "text-amber-500" : "text-indigo-400"}`}
      />
      {/* tabular-nums: rakam genişliği sabit kalsın, saat her tikte oynamasın. */}
      <span className="font-medium tabular-nums">{reading.time}</span>
      <span className="text-slate-500">{target.cityName}</span>
    </span>
  );
};

export default CaddeLocalClock;

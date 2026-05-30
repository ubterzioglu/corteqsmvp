import { useEffect, useState } from "react";
import { Sun, Moon, Sunrise, Sunset } from "lucide-react";

type Zone = { label: string; tz: string };

const ZONES: Zone[] = [
  { label: "San Francisco", tz: "America/Los_Angeles" },
  { label: "New York", tz: "America/New_York" },
  { label: "Londra", tz: "Europe/London" },
  { label: "Berlin", tz: "Europe/Berlin" },
  { label: "İstanbul", tz: "Europe/Istanbul" },
  { label: "Dubai", tz: "Asia/Dubai" },
  { label: "Astana", tz: "Asia/Almaty" },
  { label: "Şanghay", tz: "Asia/Shanghai" },
  { label: "Tokyo", tz: "Asia/Tokyo" },
  { label: "Sydney", tz: "Australia/Sydney" },
];

const formatTime = (tz: string, now: Date) =>
  new Intl.DateTimeFormat("tr-TR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

const getHour = (tz: string, now: Date) =>
  Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      hour12: false,
    }).format(now)
  );

type Phase = "night" | "dawn" | "day" | "dusk";
const phaseOf = (h: number): Phase => {
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 18) return "day";
  if (h >= 18 && h < 21) return "dusk";
  return "night";
};

const PHASE_STYLES: Record<
  Phase,
  { bg: string; border: string; label: string; time: string; glow: string; Icon: typeof Sun }
> = {
  night: {
    bg: "bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900",
    border: "border-indigo-400/25",
    label: "text-indigo-200/70",
    time: "text-indigo-100",
    glow: "0 0 6px rgba(165,180,252,0.55)",
    Icon: Moon,
  },
  dawn: {
    bg: "bg-gradient-to-br from-indigo-900 via-rose-500/70 to-amber-300",
    border: "border-amber-200/40",
    label: "text-rose-50/90",
    time: "text-white",
    glow: "0 0 6px rgba(255,237,213,0.7)",
    Icon: Sunrise,
  },
  day: {
    bg: "bg-gradient-to-br from-sky-400 via-sky-300 to-amber-200",
    border: "border-amber-300/50",
    label: "text-sky-900/80",
    time: "text-slate-900",
    glow: "0 0 6px rgba(255,255,255,0.7)",
    Icon: Sun,
  },
  dusk: {
    bg: "bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-700",
    border: "border-rose-300/40",
    label: "text-amber-50/90",
    time: "text-white",
    glow: "0 0 6px rgba(254,215,170,0.8)",
    Icon: Sunset,
  },
};

const WorldClocksBand = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="mb-3">

      <div className="flex items-stretch gap-1 w-full">
        {ZONES.map((z) => {
          const h = getHour(z.tz, now);
          const phase = phaseOf(h);
          const s = PHASE_STYLES[phase];
          const Icon = s.Icon;
          return (
            <div
              key={z.tz}
              title={`${z.tz} · ${phase}`}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center rounded-md border px-1 py-0.5 transition-colors ${s.bg} ${s.border}`}
            >
              <span
                className={`flex items-center gap-0.5 text-[7px] font-semibold uppercase tracking-[0.08em] truncate max-w-full ${s.label}`}
              >
                <Icon className="h-2 w-2 shrink-0" />
                <span className="truncate">{z.label}</span>
              </span>
              <span
                className={`text-[10px] font-bold tabular-nums tracking-wider ${s.time}`}
                style={{
                  fontFamily:
                    "'JetBrains Mono', 'Courier New', ui-monospace, monospace",
                  textShadow: s.glow,
                }}
              >
                {formatTime(z.tz, now)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorldClocksBand;

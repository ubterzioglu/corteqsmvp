// Cadde saat şeridi — 3 dinamik ANALOG saat (workshop m1: otel/havaalanı tarzı kadran,
// altında şehir adı; gün-evresi ikonları kaldırıldı).
//
// Korunan davranışlar:
//  1. Dakika sınırına hizalanmış canlı tick (ibreler her dakika süzülür).
//  2. Şehir seçimi: senin saatin + İstanbul + aktif filtredeki şehir; çakışırsa popüler
//     diaspora şehirlerinden tamamlanır; 'UTC' (bilinmeyen dilim) atlanır.
//  3. Gece/gündüz hissi ikon yerine kadran yüzeyinde (açık/koyu yüz).
//  Dijital saat erişilebilirlik için sr-only + tooltip'te durur.

import { useEffect, useMemo, useState } from "react";

import type { CaddeCity } from "@/lib/cadde-types";

const ISTANBUL_TIMEZONE = "Europe/Istanbul";

/** Filtre/profil şehri çözülemediğinde şeridi tamamlayan diaspora şehirleri. */
const FALLBACK_CLOCKS = [
  { label: "Berlin", timezone: "Europe/Berlin" },
  { label: "Londra", timezone: "Europe/London" },
  { label: "New York", timezone: "America/New_York" },
] as const;

type ClockEntry = {
  label: string;
  timezone: string;
  /** Kullanıcının kendi saati — vurgulanır. */
  isViewer?: boolean;
};

const timeFormatter = (timezone: string) =>
  new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: timezone });

/** Verilen zaman diliminde saat+dakika (analog ibre açıları bunlardan türetilir). */
export const timePartsInTimezone = (now: Date, timezone: string): { hour: number; minute: number } => {
  const raw = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(now);
  const [hourRaw, minuteRaw] = raw.split(":");
  const hour = Number.parseInt(hourRaw ?? "", 10);
  const minute = Number.parseInt(minuteRaw ?? "", 10);
  return {
    hour: Number.isNaN(hour) ? 12 : hour % 24,
    minute: Number.isNaN(minute) ? 0 : minute % 60,
  };
};

/** Analog ibre açıları (derece, 12 yönü = 0°). Akrep dakikayla birlikte süzülür. */
export const clockHandAngles = (hour: number, minute: number): { hourDeg: number; minuteDeg: number } => ({
  hourDeg: (hour % 12) * 30 + minute * 0.5,
  minuteDeg: minute * 6,
});

/** Tarayıcının IANA zaman dilimi; okunabilir şehir adına düşürülür ("Europe/Berlin" → "Berlin"). */
const resolveLocalTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || ISTANBUL_TIMEZONE;
  } catch {
    return ISTANBUL_TIMEZONE;
  }
};

const timezoneToCityLabel = (timezone: string): string => {
  const segment = timezone.split("/").pop() ?? timezone;
  return segment.replace(/_/g, " ");
};

/** Gece/gündüz tonu — kadran yüzeyine "şu an orada hayat var mı" hissi verir (m1: ikon yok). */
const dayPartTone = (hour: number): { face: string; hand: string } =>
  hour >= 7 && hour < 20
    ? { face: "fill-amber-50 stroke-amber-300", hand: "stroke-amber-950" }
    : { face: "fill-slate-800 stroke-slate-500", hand: "stroke-slate-100" };

/** Otel/havaalanı tarzı mini analog kadran (m1). 12/3/6/9 tikleri uzun, ibreler dakika hassas. */
const AnalogClockFace = ({ hour, minute, tone }: { hour: number; minute: number; tone: ReturnType<typeof dayPartTone> }) => {
  const { hourDeg, minuteDeg } = clockHandAngles(hour, minute);
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const major = i % 3 === 0;
    return (
      <line
        key={i}
        x1={20}
        y1={major ? 4.5 : 5.5}
        x2={20}
        y2={major ? 8 : 7}
        strokeWidth={major ? 1.6 : 1}
        className={tone.hand}
        opacity={major ? 0.9 : 0.45}
        transform={`rotate(${i * 30} 20 20)`}
      />
    );
  });

  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0" aria-hidden focusable="false">
      <circle cx={20} cy={20} r={17} strokeWidth={2} className={tone.face} />
      {ticks}
      <line x1={20} y1={20} x2={20} y2={12} strokeWidth={2.4} strokeLinecap="round" className={tone.hand} transform={`rotate(${hourDeg} 20 20)`} />
      <line x1={20} y1={20} x2={20} y2={7.5} strokeWidth={1.4} strokeLinecap="round" className={tone.hand} transform={`rotate(${minuteDeg} 20 20)`} opacity={0.85} />
      <circle cx={20} cy={20} r={1.6} className={`${tone.hand.replace("stroke-", "fill-")}`} stroke="none" />
    </svg>
  );
};

export interface CaddeWorldClocksProps {
  /** Kullanıcının profil şehri (actor context) — yalnız etiket için. */
  viewerCity: string | null;
  /** Aktif geo filtresindeki ilk şehir adı. */
  filterCity: string | null;
  /** Zaman dilimi çözümü için cadde_cities listesi. */
  cities: readonly CaddeCity[];
}

/** Dakika sınırına hizalanmış canlı saat — ilk tick dakika başında, sonrası 60sn'de bir. */
function useMinuteTick(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const msToNextMinute = 60_000 - (Date.now() % 60_000);

    const timeoutId = setTimeout(() => {
      setNow(new Date());
      intervalId = setInterval(() => setNow(new Date()), 60_000);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return now;
}

const CaddeWorldClocks = ({ viewerCity, filterCity, cities }: CaddeWorldClocksProps) => {
  const now = useMinuteTick();

  const clocks = useMemo<ClockEntry[]>(() => {
    const timezoneByCityName = new Map(cities.map((city) => [city.name, city.timezone]));
    const localTimezone = resolveLocalTimezone();

    const candidates: ClockEntry[] = [
      {
        label: viewerCity?.trim() || timezoneToCityLabel(localTimezone),
        timezone: localTimezone,
        isViewer: true,
      },
      { label: "İstanbul", timezone: ISTANBUL_TIMEZONE },
    ];

    // 'UTC' katalogda "bilinmiyor" anlamına gelir: geo_cities'te timezone kolonu yok,
    // yeni ülkenin ilk şehri devralacak bir dilim bulamazsa UTC kalıyor. Yanlış saat
    // göstermektense o şehri atla — şerit fallback'lerden tamamlanır.
    const filterTimezone = filterCity ? timezoneByCityName.get(filterCity) : undefined;
    if (filterCity && filterTimezone && filterTimezone !== "UTC") {
      candidates.push({ label: filterCity, timezone: filterTimezone });
    }

    candidates.push(...FALLBACK_CLOCKS);

    // Aynı zaman dilimini iki kez göstermek şeridi anlamsızlaştırır (ör. profili İstanbul
    // olan kullanıcıda "Senin saatin" ve "İstanbul" aynı olurdu).
    const seenTimezones = new Set<string>();
    const result: ClockEntry[] = [];
    for (const candidate of candidates) {
      if (result.length >= 3) break;
      if (seenTimezones.has(candidate.timezone)) continue;
      seenTimezones.add(candidate.timezone);
      result.push(candidate);
    }
    return result;
  }, [cities, filterCity, viewerCity]);

  return (
    <div className="flex flex-wrap items-start gap-4" data-testid="cadde-world-clocks">
      {clocks.map((clock) => {
        const { hour, minute } = timePartsInTimezone(now, clock.timezone);
        const tone = dayPartTone(hour);
        return (
          <div
            key={clock.timezone}
            className="flex flex-col items-center gap-1"
            title={`${clock.isViewer ? "Senin saatin" : clock.label} · ${timeFormatter(clock.timezone).format(now)}`}
          >
            <AnalogClockFace hour={hour} minute={minute} tone={tone} />
            <span className="flex items-center gap-1 text-xs font-medium text-slate-700">
              {clock.label}
              {clock.isViewer ? (
                <span className="relative flex h-1.5 w-1.5" aria-label="Senin saatin">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
              ) : null}
            </span>
            {/* Erişilebilirlik + testler: dijital saat görünmez ama okunur kalır. */}
            <span className="sr-only tabular-nums">{timeFormatter(clock.timezone).format(now)}</span>
          </div>
        );
      })}
    </div>
  );
};

export default CaddeWorldClocks;

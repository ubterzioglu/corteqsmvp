// Cadde saat şeridi — 6 sabit şehir yerine kullanıcıya göre 3 dinamik saat.
//
// İki düzeltme birden:
//  1. Eski kod saati yalnız render sırasında hesaplıyordu → çip donuk kalıyor, dakika hiç
//     değişmiyordu. Burada dakika sınırına hizalanmış bir tick ile canlı tutulur.
//  2. Sabit 6 şehir yerine: senin saatin + İstanbul + aktif filtredeki şehir. Üçü çakışırsa
//     popüler diaspora şehirlerinden tamamlanır.

import { useEffect, useMemo, useState } from "react";
import { Moon, Sun, Sunrise, Sunset } from "lucide-react";

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

/** Verilen zaman diliminde o anki saati (0-23) döndürür. */
const hourInTimezone = (now: Date, timezone: string): number => {
  const raw = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: timezone }).format(now);
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? 12 : parsed % 24;
};

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

const dayPartIcon = (hour: number) => {
  if (hour >= 5 && hour < 8) return Sunrise;
  if (hour >= 8 && hour < 18) return Sun;
  if (hour >= 18 && hour < 21) return Sunset;
  return Moon;
};

/** Gece/gündüz tonu — şeride "şu an orada hayat var mı" hissi verir. */
const dayPartTone = (hour: number): string =>
  hour >= 7 && hour < 20
    ? "border-amber-200/80 bg-amber-50/70 text-amber-950"
    : "border-slate-300/70 bg-slate-100 text-slate-700";

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

    const filterTimezone = filterCity ? timezoneByCityName.get(filterCity) : undefined;
    if (filterCity && filterTimezone) {
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
    <div className="flex flex-wrap items-center gap-2" data-testid="cadde-world-clocks">
      {clocks.map((clock) => {
        const hour = hourInTimezone(now, clock.timezone);
        const Icon = dayPartIcon(hour);
        return (
          <div
            key={clock.timezone}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${dayPartTone(hour)}`}
            title={clock.isViewer ? "Senin saatin" : clock.label}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <span className="font-medium">{clock.label}</span>
            <span className="tabular-nums opacity-70">{timeFormatter(clock.timezone).format(now)}</span>
            {clock.isViewer ? (
              <span className="relative flex h-1.5 w-1.5" aria-label="Senin saatin">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default CaddeWorldClocks;

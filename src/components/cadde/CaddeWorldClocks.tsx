// Cadde saat şeridi — 5 dinamik ANALOG saat (workshop m1: otel/havaalanı tarzı kadran,
// altında şehir adı; gün-evresi ikonları kaldırıldı).
//
// Korunan davranışlar:
//  1. Dakika sınırına hizalanmış canlı tick (ibreler her dakika süzülür).
//  2. Şehir seçimi: senin saatin + İstanbul + aktif filtredeki şehir; çakışırsa popüler
//     diaspora şehirlerinden tamamlanır; 'UTC' (bilinmeyen dilim) atlanır.
//  3. Gece/gündüz hissi ikon yerine kadran yüzeyinde (açık/koyu yüz).
//  Dijital saat erişilebilirlik için sr-only + tooltip'te durur.
//
// Görsel sözleşme (2026-08-04): kadran 40px→60px (1.5×), kadranda yalnız 12/3/6/9 tikleri
// kaldı (8 ara tik silindi) ve renk amber'dan nötr slate'e çekildi — 60px'te ara tikler
// gri bir halkaya dönüşüp ibreleri okunmaz yapıyordu. Şerit `hidden md:flex`: 5 kadran dar
// ekranda başlık satırını taşırıyor, mobilde bilinçli olarak gizli.
// Premium geçiş (aynı gün): çift halka gövde + gölge + iki tonlu merkez pimi, etiket
// havaalanı panosu plakasına döndü (aralıklı büyük harf, trUpper ile Türkçe-güvenli),
// viewer nabız animasyonu sabit noktaya indi.

import { useEffect, useMemo, useState } from "react";

import { trUpper } from "@/lib/text-normalization";
import type { CaddeCity } from "@/lib/cadde-types";

const ISTANBUL_TIMEZONE = "Europe/Istanbul";

/** Şeritte aynı anda gösterilen kadran sayısı. */
export const MAX_CLOCKS = 5;

/**
 * Filtre/profil şehri çözülemediğinde şeridi tamamlayan diaspora şehirleri.
 * Sıra kasıtlı: farklı zaman dilimi = ayrı bilgi. Berlin (+1, en büyük diaspora),
 * Londra (0), New York (-5, Amerika), Dubai (+4, Körfez/Asya köprüsü).
 */
const FALLBACK_CLOCKS = [
  { label: "Berlin", timezone: "Europe/Berlin" },
  { label: "Londra", timezone: "Europe/London" },
  { label: "New York", timezone: "America/New_York" },
  { label: "Dubai", timezone: "Asia/Dubai" },
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

/** IANA son parçası Türkçe/okunur ada oturmayan dilimler. */
const TIMEZONE_LABEL_OVERRIDES: Record<string, string> = {
  "Europe/Istanbul": "İstanbul",
};

const timezoneToCityLabel = (timezone: string): string => {
  const override = TIMEZONE_LABEL_OVERRIDES[timezone];
  if (override) return override;
  const segment = timezone.split("/").pop() ?? timezone;
  return segment.replace(/_/g, " ");
};

/**
 * "Senin saatin" kadranının etiketi — GÖSTERİLEN dilimle uyuşmak zorunda.
 *
 * Kadran her zaman TARAYICI dilimini çizer (nerede olduğun), etiket ise profil şehrinden
 * geliyordu: profilinde Antalya yazan ama Almanya'dan giren kullanıcıda kadran Berlin
 * saatini "Antalya" etiketiyle gösteriyordu — üstelik viewer dilimi Europe/Berlin olduğu
 * için fallback Berlin dedupe'a takılıp şeritten düşüyordu. Profil şehrinin dilimi
 * tarayıcıyla ÖRTÜŞMEDİKÇE etiket dilimden türetilir.
 */
export const resolveViewerLabel = (
  viewerCity: string | null,
  localTimezone: string,
  timezoneByCityName: ReadonlyMap<string, string>,
): string => {
  const city = viewerCity?.trim();
  if (city && timezoneByCityName.get(city) === localTimezone) return city;
  return timezoneToCityLabel(localTimezone);
};

/**
 * Gece/gündüz tonu — kadran yüzeyine "şu an orada hayat var mı" hissi verir (m1: ikon yok).
 * Nötr paletle kalır: renk gündüz/gece ayrımını taşır, dikkat çekme işini değil.
 * `bezel` gövde/çerçeve, `face` kadran yüzeyi, `hand` ibre+tik.
 */
const dayPartTone = (hour: number): { bezel: string; face: string; hand: string } =>
  hour >= 7 && hour < 20
    ? { bezel: "fill-slate-200", face: "fill-white", hand: "stroke-slate-900" }
    : { bezel: "fill-slate-700", face: "fill-slate-900", hand: "stroke-slate-100" };

/**
 * Otel/havaalanı tarzı analog kadran (m1) — premium geçiş 2026-08-04.
 *
 * Derinlik SVG gradyanıyla değil, iki halkayla kuruluyor (dış gövde + iç kadran): şeritte 5
 * kadran var, `<defs>` gradyanı 5 kez aynı id'yi DOM'a basardı. Gölge CSS drop-shadow —
 * kadranın yüzeye oturmasını sağlar. Merkez pimi iki tonlu (koyu disk + kadran renginde
 * nokta): gerçek saatlerdeki pim detayı, "çizilmiş" değil "yapılmış" hissini veren şey.
 * Tik sayısı 4'te KALIR — çerçeve+pim eklenirken ara tikleri geri getirmek kalabalık yapar.
 */
const AnalogClockFace = ({ hour, minute, tone }: { hour: number; minute: number; tone: ReturnType<typeof dayPartTone> }) => {
  const { hourDeg, minuteDeg } = clockHandAngles(hour, minute);
  const handFill = tone.hand.replace("stroke-", "fill-");
  // Sadece 4 çeyrek tik: 60px'te 12 tik gri bir halka gibi görünüp ibrelerin okunmasını zorlaştırıyordu.
  const ticks = [0, 90, 180, 270].map((deg) => (
    <line
      key={deg}
      x1={20}
      y1={5.6}
      x2={20}
      y2={8.6}
      strokeWidth={1.6}
      strokeLinecap="round"
      className={tone.hand}
      opacity={0.5}
      transform={`rotate(${deg} 20 20)`}
    />
  ));

  return (
    <svg
      viewBox="0 0 40 40"
      className="h-[3.75rem] w-[3.75rem] shrink-0 drop-shadow-[0_1px_2px_rgb(15_23_42_/_0.15)]"
      aria-hidden
      focusable="false"
    >
      <circle cx={20} cy={20} r={19} className={tone.bezel} stroke="none" />
      <circle cx={20} cy={20} r={17} className={tone.face} stroke="none" />
      {ticks}
      <line x1={20} y1={20} x2={20} y2={13} strokeWidth={2.8} strokeLinecap="round" className={tone.hand} transform={`rotate(${hourDeg} 20 20)`} />
      <line x1={20} y1={20} x2={20} y2={7.6} strokeWidth={1.9} strokeLinecap="round" className={tone.hand} transform={`rotate(${minuteDeg} 20 20)`} />
      <circle cx={20} cy={20} r={1.9} className={handFill} stroke="none" />
      <circle cx={20} cy={20} r={0.75} className={tone.face} stroke="none" />
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
        label: resolveViewerLabel(viewerCity, localTimezone, timezoneByCityName),
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
      if (result.length >= MAX_CLOCKS) break;
      if (seenTimezones.has(candidate.timezone)) continue;
      seenTimezones.add(candidate.timezone);
      result.push(candidate);
    }
    return result;
  }, [cities, filterCity, viewerCity]);

  return (
    <div className="hidden flex-wrap items-start gap-5 md:flex" data-testid="cadde-world-clocks">
      {clocks.map((clock) => {
        const { hour, minute } = timePartsInTimezone(now, clock.timezone);
        const tone = dayPartTone(hour);
        return (
          <div
            key={clock.timezone}
            className="flex flex-col items-center gap-1.5"
            title={`${clock.isViewer ? "Senin saatin" : clock.label} · ${timeFormatter(clock.timezone).format(now)}`}
          >
            <AnalogClockFace hour={hour} minute={minute} tone={tone} />
            {/* Havaalanı panosu plakası: aralıklı büyük harf. trUpper ZORUNLU — bare
                toUpperCase() "İstanbul"u "ISTANBUL" yapar (Türkçe i/İ kuralı). */}
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase leading-none tracking-[0.12em] text-slate-600">
              {trUpper(clock.label)}
              {clock.isViewer ? (
                // Nabız animasyonu kaldırıldı: kadranlar zaten canlı, sabit nokta daha sakin.
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" aria-label="Senin saatin" />
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

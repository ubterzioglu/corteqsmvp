// Etkinlik saat dilimi — tek kaynak.
//
// NEDEN VAR: `events.start_time` / `end_time` sütunları `time without time zone`
// tipindedir, yani çıplak duvar saatidir. 20 Eylül 2026'ya kadar hiçbir yerde
// "hangi ülkenin 19:00'u" bilgisi tutulmuyordu. Diasporada bu sessiz bir kusurdur:
// Katar'daki üye Berlin'deki bir online etkinliği "19:00" diye görüp iki saat geç
// kalır ve kimse hata almaz. Dahası ülke alanı formda YALNIZ fiziksel/hibrit
// etkinlikte çiziliyordu — online etkinlikte saatin referansı hiç sorulmuyordu.
//
// KARAR: Ülke değil, IANA saat dilimi saklıyoruz (`events.timezone`). Ülke yaz
// saati kuralını taşımaz; "Almanya" yazmak 27 Ekim'den sonra bir saat kaydırır.
// `Europe/Berlin` taşır. Ülkeden türetme de bilinçli olarak REDDEDİLDİ: CLAUDE.md
// 17 üyenin profil ülkesinin katalogda karşılıksız olduğunu, 14'ünün "Belirtilmedi"
// olduğunu belgeliyor — sessizce yanlış saat göstermek, saati hiç göstermemekten
// kötüdür.
//
// NEDEN KÜTÜPHANE YOK: dönüşüm yalnız `Intl` ile yapılır. `date-fns-tz`/`luxon`
// bu tek iş için bağımlılık eklemeye değmez; aşağıdaki `zoneOffsetMs` yaklaşımı
// yaz saati geçişlerinde de doğrudur (çift ölçüm yapar, aşağıdaki nota bak).
//
// DEĞERLER KULLANICIYA GÖRÜNEN METİN DEĞİL, VERİTABANI ANAHTARIDIR. `label`
// serbestçe değişir; `value` alanına dokunmak canlı veriyi böler — bu tuzak
// `events-vocabulary.ts` başlığında belgelenen 19 Eylül kusurunun aynısıdır.
//
// Sözleşme testi: `src/lib/events-timezone.test.ts`.

export type EventTimezoneOption = {
  /** IANA saat dilimi anahtarı — DB'ye yazılan değer. */
  value: string;
  /** Kullanıcıya görünen Türkçe etiket. */
  label: string;
  /** Seçim kutusundaki grup başlığı. */
  group: string;
};

/**
 * Diasporanın yoğun olduğu bölgeler. Liste bilinçli olarak "dünyadaki tüm saat
 * dilimleri" değildir: 400 seçenekli bir kutu kullanılamaz. Eksik bir ülke
 * çıkarsa buraya bir satır eklenir.
 */
export const EVENT_TIMEZONE_OPTIONS: EventTimezoneOption[] = [
  { value: "Europe/Istanbul", label: "Türkiye (İstanbul)", group: "Türkiye" },

  { value: "Europe/Berlin", label: "Almanya (Berlin)", group: "Avrupa" },
  { value: "Europe/Vienna", label: "Avusturya (Viyana)", group: "Avrupa" },
  { value: "Europe/Amsterdam", label: "Hollanda (Amsterdam)", group: "Avrupa" },
  { value: "Europe/Brussels", label: "Belçika (Brüksel)", group: "Avrupa" },
  { value: "Europe/Paris", label: "Fransa (Paris)", group: "Avrupa" },
  { value: "Europe/Zurich", label: "İsviçre (Zürih)", group: "Avrupa" },
  { value: "Europe/Rome", label: "İtalya (Roma)", group: "Avrupa" },
  { value: "Europe/Madrid", label: "İspanya (Madrid)", group: "Avrupa" },
  { value: "Europe/Lisbon", label: "Portekiz (Lizbon)", group: "Avrupa" },
  { value: "Europe/London", label: "Birleşik Krallık (Londra)", group: "Avrupa" },
  { value: "Europe/Dublin", label: "İrlanda (Dublin)", group: "Avrupa" },
  { value: "Europe/Copenhagen", label: "Danimarka (Kopenhag)", group: "Avrupa" },
  { value: "Europe/Stockholm", label: "İsveç (Stockholm)", group: "Avrupa" },
  { value: "Europe/Oslo", label: "Norveç (Oslo)", group: "Avrupa" },
  { value: "Europe/Helsinki", label: "Finlandiya (Helsinki)", group: "Avrupa" },
  { value: "Europe/Warsaw", label: "Polonya (Varşova)", group: "Avrupa" },
  { value: "Europe/Prague", label: "Çekya (Prag)", group: "Avrupa" },
  { value: "Europe/Budapest", label: "Macaristan (Budapeşte)", group: "Avrupa" },
  { value: "Europe/Bucharest", label: "Romanya (Bükreş)", group: "Avrupa" },
  { value: "Europe/Sofia", label: "Bulgaristan (Sofya)", group: "Avrupa" },
  { value: "Europe/Athens", label: "Yunanistan (Atina)", group: "Avrupa" },
  { value: "Europe/Kyiv", label: "Ukrayna (Kiev)", group: "Avrupa" },
  { value: "Europe/Moscow", label: "Rusya (Moskova)", group: "Avrupa" },

  { value: "Asia/Nicosia", label: "Kıbrıs (Lefkoşa)", group: "Orta Doğu & Körfez" },
  { value: "Asia/Baku", label: "Azerbaycan (Bakü)", group: "Orta Doğu & Körfez" },
  { value: "Asia/Tbilisi", label: "Gürcistan (Tiflis)", group: "Orta Doğu & Körfez" },
  { value: "Asia/Qatar", label: "Katar (Doha)", group: "Orta Doğu & Körfez" },
  { value: "Asia/Dubai", label: "Birleşik Arap Emirlikleri (Dubai)", group: "Orta Doğu & Körfez" },
  { value: "Asia/Riyadh", label: "Suudi Arabistan (Riyad)", group: "Orta Doğu & Körfez" },
  { value: "Asia/Kuwait", label: "Kuveyt", group: "Orta Doğu & Körfez" },
  { value: "Asia/Bahrain", label: "Bahreyn (Manama)", group: "Orta Doğu & Körfez" },
  { value: "Asia/Muscat", label: "Umman (Maskat)", group: "Orta Doğu & Körfez" },

  { value: "Asia/Almaty", label: "Kazakistan (Almatı)", group: "Asya" },
  { value: "Asia/Tashkent", label: "Özbekistan (Taşkent)", group: "Asya" },
  { value: "Asia/Karachi", label: "Pakistan (Karaçi)", group: "Asya" },
  { value: "Asia/Kolkata", label: "Hindistan (Yeni Delhi)", group: "Asya" },
  { value: "Asia/Bangkok", label: "Tayland (Bangkok)", group: "Asya" },
  { value: "Asia/Singapore", label: "Singapur", group: "Asya" },
  { value: "Asia/Kuala_Lumpur", label: "Malezya (Kuala Lumpur)", group: "Asya" },
  { value: "Asia/Jakarta", label: "Endonezya (Cakarta)", group: "Asya" },
  { value: "Asia/Shanghai", label: "Çin (Şanghay)", group: "Asya" },
  { value: "Asia/Seoul", label: "Güney Kore (Seul)", group: "Asya" },
  { value: "Asia/Tokyo", label: "Japonya (Tokyo)", group: "Asya" },

  { value: "America/New_York", label: "ABD — Doğu (New York)", group: "Amerika" },
  { value: "America/Chicago", label: "ABD — Orta (Şikago)", group: "Amerika" },
  { value: "America/Denver", label: "ABD — Dağ (Denver)", group: "Amerika" },
  { value: "America/Los_Angeles", label: "ABD — Batı (Los Angeles)", group: "Amerika" },
  { value: "America/Toronto", label: "Kanada — Doğu (Toronto)", group: "Amerika" },
  { value: "America/Vancouver", label: "Kanada — Batı (Vancouver)", group: "Amerika" },
  { value: "America/Mexico_City", label: "Meksika (Mexico City)", group: "Amerika" },
  { value: "America/Sao_Paulo", label: "Brezilya (São Paulo)", group: "Amerika" },
  { value: "America/Argentina/Buenos_Aires", label: "Arjantin (Buenos Aires)", group: "Amerika" },

  { value: "Africa/Cairo", label: "Mısır (Kahire)", group: "Afrika" },
  { value: "Africa/Tunis", label: "Tunus", group: "Afrika" },
  { value: "Africa/Algiers", label: "Cezayir", group: "Afrika" },
  { value: "Africa/Casablanca", label: "Fas (Kazablanka)", group: "Afrika" },
  { value: "Africa/Lagos", label: "Nijerya (Lagos)", group: "Afrika" },
  { value: "Africa/Nairobi", label: "Kenya (Nairobi)", group: "Afrika" },
  { value: "Africa/Johannesburg", label: "Güney Afrika (Johannesburg)", group: "Afrika" },

  { value: "Australia/Perth", label: "Avustralya — Batı (Perth)", group: "Okyanusya" },
  { value: "Australia/Sydney", label: "Avustralya — Doğu (Sidney)", group: "Okyanusya" },
  { value: "Pacific/Auckland", label: "Yeni Zelanda (Auckland)", group: "Okyanusya" },
];

/** Seçim kutusundaki grup sırası — listede göründükleri sıra. */
export const EVENT_TIMEZONE_GROUPS: string[] = EVENT_TIMEZONE_OPTIONS.reduce<string[]>(
  (groups, option) => (groups.includes(option.group) ? groups : [...groups, option.group]),
  [],
);

/**
 * Formun varsayılanı. Tarayıcı saat dilimi listede yoksa buraya düşülür —
 * platformun ağırlık merkezi Türkiye'dir.
 */
export const DEFAULT_EVENT_TIMEZONE = "Europe/Istanbul";

const OPTION_BY_VALUE = new Map(EVENT_TIMEZONE_OPTIONS.map((option) => [option.value, option]));

/** Listede tanımlı bir saat dilimi mi? */
export function isKnownEventTimezone(value: unknown): value is string {
  return typeof value === "string" && OPTION_BY_VALUE.has(value);
}

/**
 * Rozet/başlık metni. Girdi `string | null`'dır çünkü 20 Eylül 2026 öncesi
 * kayıtlarda sütun BOŞTUR ve listede olmayan bir değer elle girilmiş olabilir.
 * Tanınmayan değer ham hâliyle döner — uydurmak yerine gerçeği göster.
 */
export function eventTimezoneLabel(value: string | null | undefined): string {
  if (!value) return "";
  return OPTION_BY_VALUE.get(value)?.label ?? value;
}

/**
 * Etiketin parantez içindeki şehri: "Almanya (Berlin)" → "Berlin".
 * Dar alanlarda (liste kartı) tam etiket sığmaz.
 */
export function eventTimezoneShortLabel(value: string | null | undefined): string {
  const label = eventTimezoneLabel(value);
  const match = label.match(/\(([^)]+)\)\s*$/);
  return match ? match[1] : label;
}

/**
 * Bilinen değeri döner, bilinmeyeni BOŞ STRING yapar — varsayılana ÇEKMEZ.
 *
 * ⚠️ Burası bilerek "varsayılana çek" DEĞİLDİR. Önceki hâli bilinmeyeni
 * `Europe/Istanbul`'a çekiyordu ve bu, modülün önlemeyi vaat ettiği zararın ta
 * kendisiydi: Üsküp'teki (`Europe/Skopje`, listede yok) üye 19:00 girer, form
 * sessizce "Türkiye (İstanbul)" yazar, Berlin'deki izleyici "senin saatinle
 * 17:00" görür ve iki saat erken gelir. Boş bırakmak, yanlış bir referansı
 * kendinden emin bir etiketle basmaktan iyidir.
 */
export function sanitizeEventTimezone(value: unknown): string {
  return isKnownEventTimezone(value) ? value : "";
}

/**
 * FORMUN başlangıç değeri: tarayıcının saat dilimi, listede varsa — yoksa BOŞ.
 * Boş olduğunda seçim kutusu "Saat dilimi seçin" placeholder'ıyla açılır ve
 * saat girilmişse gönderim doğrulaması kullanıcıyı seçmeye zorlar.
 *
 * ⚠️ Bunu İZLEYİCİNİN saatini hesaplamak için KULLANMA — `resolveViewerTimezone`
 * var.
 */
export function resolveBrowserEventTimezone(): string {
  try {
    return sanitizeEventTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return "";
  }
}

/**
 * İZLEYİCİNİN gerçek saat dilimi — listeyle SINIRLI DEĞİLDİR.
 *
 * Seçenek listesi ~65 satırdır; dünyada 400'den fazla IANA saat dilimi vardır.
 * İzleyicinin dilimini bu listeye daraltmak, listede olmayan her kullanıcıya
 * yanlış bir "senin saatinle" satırı yazdırır. Okunamazsa boş döner ve arayüz
 * o satırı hiç çizmez.
 */
export function resolveViewerTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_EVENT_TIMEZONE;
  } catch {
    return DEFAULT_EVENT_TIMEZONE;
  }
}

/**
 * Etkinlik GÜNÜNÜ yazar: `"2026-10-05"` → `"5 Ekim 2026 Pazartesi"`.
 *
 * NEDEN `new Date(dateStr)` DEĞİL: `"2026-10-05"` biçimi ECMAScript'te UTC gece
 * yarısı olarak ayrıştırılır. `toLocaleDateString` bunu izleyicinin yerel
 * saatine çevirince UTC'nin BATISINDAKİ her kullanıcı bir gün GERİ görür —
 * Los Angeles'taki üyeye 5 Ekim etkinliği "4 Ekim" diye görünür. Gün alanı
 * takvim günüdür, bir an değildir; bu yüzden UTC'de tutulup UTC'de yazılır.
 */
export function formatEventDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" },
): string {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return dateStr;

  const utcMidnight = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return utcMidnight.toLocaleDateString("tr-TR", { ...options, timeZone: "UTC" });
}

/**
 * `instant` anında `zone`'un UTC'ye göre ofseti (ms).
 *
 * Yöntem: anı hedef saat diliminde biçimlendirip parçaları UTC'ymiş gibi geri
 * kurarız; aradaki fark ofsettir. `Intl` her tarayıcıda ve Node'da vardır.
 */
function zoneOffsetMs(instant: Date, zone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const read = (type: string): number => {
    const part = parts.find((candidate) => candidate.type === type);
    return part ? Number(part.value) : 0;
  };

  // Bazı ortamlar (eski ICU/Safari) h24 döngüsü kullanır ve gece yarısını bir
  // ÖNCEKİ günün "24:00"ı olarak biçimlendirir. Saati 0'a çekmek yetmez, günü
  // de ileri almak gerekir; yoksa ofset tam 24 saat sapar. `Date.UTC` ay/yıl
  // taşmasını kendisi çözdüğü için `day + 1` güvenlidir.
  const rawHour = read("hour");
  const hour = rawHour % 24;
  const day = read("day") + (rawHour === 24 ? 1 : 0);
  const asIfUtc = Date.UTC(read("year"), read("month") - 1, day, hour, read("minute"), read("second"));
  return asIfUtc - instant.getTime();
}

/** `"19:00"` / `"19:00:00"` → `{hours: 19, minutes: 0}`; geçersizse `null`. */
function parseClock(time: string): { hours: number; minutes: number } | null {
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

/**
 * `zone` saat diliminde `date` günü `time` duvar saatinin karşılık geldiği an.
 *
 * İKİ ÖLÇÜM NEDEN: ilk ofset "UTC sanılan" andan okunur; yaz saati geçişinin
 * olduğu günlerde doğru an farklı bir ofsete düşebilir, bu yüzden bulunan anla
 * bir kez daha ölçüp değişmişse düzeltiriz. Tek ölçüm, yılda iki gün bir saat
 * sapar — ve tam da o günlerde kimse hata almaz.
 */
export function eventInstant(date: string, time: string, zone: string): Date | null {
  const clock = parseClock(time);
  if (!clock) return null;

  const dayMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dayMatch) return null;

  const asIfUtc = Date.UTC(
    Number(dayMatch[1]),
    Number(dayMatch[2]) - 1,
    Number(dayMatch[3]),
    clock.hours,
    clock.minutes,
  );
  if (Number.isNaN(asIfUtc)) return null;

  let offset: number;
  try {
    offset = zoneOffsetMs(new Date(asIfUtc), zone);
  } catch {
    return null; // tanınmayan saat dilimi — uydurma
  }

  let instant = new Date(asIfUtc - offset);
  const corrected = zoneOffsetMs(instant, zone);
  if (corrected !== offset) {
    instant = new Date(asIfUtc - corrected);
  }
  return instant;
}

/** Bir anı hedef saat diliminde `"20:00"` olarak yazar. */
export function formatClockInZone(instant: Date, zone: string): string {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      timeZone: zone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }).format(instant);
  } catch {
    return "";
  }
}

/** Bir anın hedef saat dilimindeki günü `"2026-10-05"` olarak. Gün kayması denetimi için. */
export function formatDayInZone(instant: Date, zone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(instant);
  } catch {
    return "";
  }
}

/** `"2026-10-05"` + 1 → `"2026-10-06"`. Ay/yıl taşmasını `Date.UTC` çözer. */
function addEventDays(dateStr: string, days: number): string {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return dateStr;
  const shifted = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days),
  );
  return shifted.toISOString().slice(0, 10);
}

/**
 * Etkinliğin başlangıç ve bitiş ANLARI.
 *
 * ⚠️ GECE YARISINI AŞAN ETKİNLİK: `events` tablosunda bitiş için ayrı tarih
 * sütunu YOKTUR, yalnız tek bir `event_date` vardır. "22:00 – 01:00" girilen bir
 * etkinliğin bitişi saf hesapla aynı günün 01:00'i olur ve başlangıçtan **21
 * saat ÖNCEYE** düşer. Arayüzde bu tesadüfen doğru görünür (iki uç da aynı yöne
 * kaydığı için aralık metni bozulmaz) ama schema.org çıktısında `endDate <
 * startDate` olur ve Google zengin sonucu geçersiz sayar — yani gözle QA bunu
 * YAKALAMAZ. Bitiş başlangıçtan küçük ya da eşitse ertesi güne taşınır.
 */
export function eventInstantRange(input: {
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  timezone: string;
}): { start: Date | null; end: Date | null } {
  const { eventDate, startTime, endTime, timezone } = input;
  const start = startTime ? eventInstant(eventDate, startTime, timezone) : null;
  let end = endTime ? eventInstant(eventDate, endTime, timezone) : null;

  if (start && end && end.getTime() <= start.getTime()) {
    end = endTime ? eventInstant(addEventDays(eventDate, 1), endTime, timezone) : null;
  }

  return { start, end };
}

export type EventScheduleView = {
  /** Etkinliğin kendi saat dilimindeki aralık: `"19:00 – 21:00"`. */
  sourceRange: string;
  /** `"Almanya (Berlin)"` — saat dilimi bilinmiyorsa boş. */
  sourceLabel: string;
  /** İzleyicinin saatindeki aralık; saat dilimi aynıysa ya da hesaplanamıyorsa `null`. */
  viewerRange: string | null;
  /** `"Türkiye (İstanbul)"` — `viewerRange` null ise boş. */
  viewerLabel: string;
  /** İzleyicinin saatinde etkinlik başka bir güne düşüyorsa `true`. */
  viewerDayShift: boolean;
  /**
   * Kayma varsa izleyicinin takvimindeki gün: `"4 Ekim Pazar"`. Sayfadaki tek
   * tarih etkinliğin KENDİ dilimindeki tarihtir; "farklı bir güne denk geliyor"
   * demek ama hangi güne olduğunu söylememek izleyiciyi bir gün geç bağlatır.
   */
  viewerDayLabel: string;
};

/**
 * Detay ve kart ekranlarının tek hesap noktası.
 *
 * `eventTimezone` boşsa (20 Eylül 2026 öncesi kayıtlar) yalnız ham saat döner ve
 * hiçbir referans UYDURULMAZ — yanlış bir "Türkiye saatiyle" etiketi, etiketsiz
 * saatten daha zararlıdır.
 */
export function describeEventSchedule(input: {
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  eventTimezone: string | null;
  viewerTimezone: string;
}): EventScheduleView | null {
  const { eventDate, startTime, endTime, eventTimezone, viewerTimezone } = input;
  if (!startTime && !endTime) return null;

  const clock = (time: string | null): string => (time ? time.slice(0, 5) : "");
  // Tek uç girilmişse HANGİ uç olduğu yazılır. "21:00" tek başına başlangıç
  // sanılır: yalnız bitiş giren bir organizatörün etkinliğine üye tam bitiş
  // saatinde gelir.
  const range = (from: string, to: string): string => {
    if (from && to) return `${from} – ${to}`;
    if (from) return from;
    return to ? `Bitiş ${to}` : "";
  };
  const sourceRange = range(clock(startTime), clock(endTime));

  const empty: EventScheduleView = {
    sourceRange,
    sourceLabel: eventTimezoneLabel(eventTimezone),
    viewerRange: null,
    viewerLabel: "",
    viewerDayShift: false,
    viewerDayLabel: "",
  };

  if (!eventTimezone || eventTimezone === viewerTimezone) return empty;

  const { start: startInstant, end: endInstant } = eventInstantRange({
    eventDate,
    startTime,
    endTime,
    timezone: eventTimezone,
  });
  if (!startInstant && !endInstant) return empty;

  const viewerFrom = startInstant ? formatClockInZone(startInstant, viewerTimezone) : "";
  const viewerTo = endInstant ? formatClockInZone(endInstant, viewerTimezone) : "";
  const viewerRange = range(viewerFrom, viewerTo);
  if (!viewerRange) return empty;

  const anchor = startInstant ?? endInstant!;
  const viewerDay = formatDayInZone(anchor, viewerTimezone);
  const sourceDay = formatDayInZone(anchor, eventTimezone);
  const shifted = Boolean(viewerDay && sourceDay && viewerDay !== sourceDay);

  // İki diliminin ADI farklı ama SAATİ aynıysa ikinci satırı hiç çizme.
  // Asıl sebep IANA TAKMA ADLARI: eski ICU'lu Android/Windows `Asia/Istanbul`,
  // `Europe/Kiev`, `Asia/Calcutta` döndürür. Ad karşılaştırması bunları farklı
  // sanar ve kullanıcıya "Senin saatinle 19:00 (Asia/Istanbul)" gibi hem
  // gereksiz hem Türkçe arayüzde ham teknik anahtar içeren bir satır yazar.
  // Aynı ofsetteki iki ayrı ülke (Berlin/Paris) için de doğru davranış budur.
  if (viewerRange === sourceRange && !shifted) return empty;

  return {
    ...empty,
    viewerRange,
    viewerLabel: eventTimezoneLabel(viewerTimezone),
    viewerDayShift: shifted,
    viewerDayLabel: shifted ? formatEventDate(viewerDay, { day: "numeric", month: "long", weekday: "long" }) : "",
  };
}

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DEFAULT_EVENT_TIMEZONE,
  EVENT_TIMEZONE_GROUPS,
  EVENT_TIMEZONE_OPTIONS,
  describeEventSchedule,
  eventInstant,
  eventTimezoneLabel,
  eventTimezoneShortLabel,
  formatClockInZone,
  eventInstantRange,
  formatEventDate,
  resolveViewerTimezone,
  isKnownEventTimezone,
  sanitizeEventTimezone,
} from "./events-timezone";

// Sözleşme testi — gevşetme, dosyayı düzelt.
//
// Kapattığı sınıf: etkinlik saatinin referansı. 20 Eylül 2026 öncesi `start_time`
// çıplak duvar saatiydi; Katar'daki üye Berlin'deki online etkinliği "19:00" diye
// görüp iki saat geç kalıyordu ve hiçbir yerde hata çıkmıyordu.
//
// İki ayrı şeyi kilitler:
//   1. Saat dilimi değerleri gerçekten geçerli IANA anahtarlarıdır (uydurma
//      "Europe/Munich" gibi bir satır sessizce kaydedilip dönüşümü bozamaz).
//   2. Dönüşüm yaz saati geçişinde de doğrudur — tek ölçümlü saf uygulama yılda
//      iki gün bir saat sapar ve tam o günlerde kimse hata almaz.

// Migration önce parent dizinde yazılır, CANLIYA UYGULANDIKTAN SONRA `applied/`
// altına taşınır (CLAUDE.md: parent'ta duran dosya "yazıldı ama uygulanmadı"
// demektir). Sözleşme SQL'in İÇERİĞİ üzerinedir ve her iki durumda da geçerlidir,
// bu yüzden iki yola da bakarız.
//
// ⚠️ BU TESTİN YEŞİL OLMASI MIGRATION'IN CANLIYA UYGULANDIĞININ KANITI DEĞİLDİR.
// Uygulanmışlığın tek gerçek kapısı `npm run check:migrations`'tır: canlı
// `schema_migrations` tablosuna bakar ve parent dizinde bekleyen dosyayı ayrı bir
// sinyal olarak bildirir. Deploy öncesi ONU çalıştır.
const MIGRATION_CANDIDATES = [
  "supabase/migrations/applied/20260920140000_events_timezone.sql",
  "supabase/migrations/20260920140000_events_timezone.sql",
];

function readSource(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function readMigration(): string {
  for (const candidate of MIGRATION_CANDIDATES) {
    try {
      return readSource(candidate);
    } catch {
      /* sıradaki yola bak */
    }
  }
  throw new Error(`Saat dilimi migration'ı bulunamadı: ${MIGRATION_CANDIDATES.join(" | ")}`);
}

describe("etkinlik saat dilimi sözlüğü", () => {
  it("değerler tekildir", () => {
    const values = EVENT_TIMEZONE_OPTIONS.map((option) => option.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("her değer gerçek bir IANA saat dilimidir", () => {
    for (const option of EVENT_TIMEZONE_OPTIONS) {
      expect(() => new Intl.DateTimeFormat("en-US", { timeZone: option.value }).format(new Date())).not.toThrow();
    }
  });

  it("varsayılan listede tanımlıdır", () => {
    expect(isKnownEventTimezone(DEFAULT_EVENT_TIMEZONE)).toBe(true);
    expect(DEFAULT_EVENT_TIMEZONE).toBe("Europe/Istanbul");
  });

  it("etiketler Türkçe karakterlerini korur", () => {
    // ASCII'ye düşürme, 19 Eylül 2026 kusurunun tam olarak yaşandığı sınıftır.
    const labels = EVENT_TIMEZONE_OPTIONS.map((option) => option.label).join(" | ");
    expect(labels).toContain("Türkiye");
    expect(labels).toContain("İsviçre");
    expect(labels).toContain("Mısır");
    expect(labels).not.toContain("Turkiye");
    expect(labels).not.toContain("Isvicre");
  });

  it("grup listesi seçeneklerdeki sırayı korur ve boş grup içermez", () => {
    expect(EVENT_TIMEZONE_GROUPS[0]).toBe("Türkiye");
    for (const group of EVENT_TIMEZONE_GROUPS) {
      expect(EVENT_TIMEZONE_OPTIONS.some((option) => option.group === group)).toBe(true);
    }
  });

  it("etiket çözümleyici tanınmayan değeri UYDURMAZ", () => {
    expect(eventTimezoneLabel("Europe/Berlin")).toBe("Almanya (Berlin)");
    // Listede olmayan değer ham hâliyle döner — yanlış bir ülke adı yazmaktan iyidir.
    expect(eventTimezoneLabel("Europe/Munich")).toBe("Europe/Munich");
    expect(eventTimezoneLabel(null)).toBe("");
    expect(eventTimezoneLabel("")).toBe("");
  });

  it("kısa etiket parantez içindeki şehri verir", () => {
    expect(eventTimezoneShortLabel("Europe/Berlin")).toBe("Berlin");
    expect(eventTimezoneShortLabel("Asia/Kuwait")).toBe("Kuveyt");
    expect(eventTimezoneShortLabel(null)).toBe("");
  });

  it("sanitizeEventTimezone bilinmeyeni BOŞ yapar, varsayılana ÇEKMEZ", () => {
    // Bilinmeyeni "Europe/Istanbul"a çekmek, bu modülün önlemek için var olduğu
    // zararı üretir: Üsküp'teki üye 19:00 girer, form sessizce "Türkiye" yazar,
    // Berlin'deki izleyici "senin saatinle 17:00" görüp iki saat erken gelir.
    expect(sanitizeEventTimezone("Europe/Berlin")).toBe("Europe/Berlin");
    expect(sanitizeEventTimezone("Europe/Skopje")).toBe("");
    expect(sanitizeEventTimezone(undefined)).toBe("");
    expect(sanitizeEventTimezone(7)).toBe("");
  });

  it("form saat dilimi girilmemişse saati REDDEDER", () => {
    // Doğrulama olmazsa boş saat dilimi sessizce null yazılır ve referans kaybolur.
    const form = readSource("src/components/events/CreateEventFormSection.tsx");
    expect(form).toContain("isKnownEventTimezone(timezone)");
    expect(form).toContain("Saat dilimi seçin");
  });
});

describe("saat dönüşümü", () => {
  it("kış saatinde Berlin 19:00 → İstanbul 21:00", () => {
    const instant = eventInstant("2026-01-15", "19:00", "Europe/Berlin");
    expect(instant?.toISOString()).toBe("2026-01-15T18:00:00.000Z");
    expect(formatClockInZone(instant!, "Europe/Istanbul")).toBe("21:00");
  });

  it("yaz saatinde Berlin 19:00 → İstanbul 20:00", () => {
    // Türkiye 2016'dan beri kalıcı UTC+3; fark yalnız Berlin'in yaz saatinden gelir.
    const instant = eventInstant("2026-07-15", "19:00", "Europe/Berlin");
    expect(instant?.toISOString()).toBe("2026-07-15T17:00:00.000Z");
    expect(formatClockInZone(instant!, "Europe/Istanbul")).toBe("20:00");
  });

  it("Katar'daki üye Berlin etkinliğini doğru saatte görür", () => {
    const instant = eventInstant("2026-01-15", "19:00", "Europe/Berlin");
    expect(formatClockInZone(instant!, "Asia/Qatar")).toBe("21:00");
  });

  it("yaz saati geçişinin OLDUĞU gün doğru çözülür", () => {
    // Avrupa yaz saati 29 Mart 2026 saat 02:00'de başlar. 01:00 hâlâ UTC+1'dir.
    // Tek ölçümlü saf uygulama burada bir saat sapar — bu test o sapmayı yakalar.
    expect(eventInstant("2026-03-29", "01:00", "Europe/Berlin")?.toISOString()).toBe(
      "2026-03-29T00:00:00.000Z",
    );
    // Aynı günün akşamı artık UTC+2'dir.
    expect(eventInstant("2026-03-29", "19:00", "Europe/Berlin")?.toISOString()).toBe(
      "2026-03-29T17:00:00.000Z",
    );
  });

  it("geçersiz girdi null döner, uydurma tarih üretmez", () => {
    expect(eventInstant("2026-01-15", "saat yok", "Europe/Berlin")).toBeNull();
    expect(eventInstant("tarih yok", "19:00", "Europe/Berlin")).toBeNull();
    expect(eventInstant("2026-01-15", "99:00", "Europe/Berlin")).toBeNull();
    expect(eventInstant("2026-01-15", "19:00", "Mars/Olympus")).toBeNull();
  });
});

describe("etkinlik günü", () => {
  it("takvim gününü kaydırmadan yazar", () => {
    expect(formatEventDate("2026-10-05", { day: "numeric", month: "long", year: "numeric" })).toBe(
      "5 Ekim 2026",
    );
    expect(formatEventDate("2026-01-01", { day: "numeric", month: "long", year: "numeric" })).toBe(
      "1 Ocak 2026",
    );
  });

  it("gün UTC'de yazılır — yerel saat dilimine göre kaymaz", () => {
    // `new Date("2026-10-05")` UTC gece yarısıdır. `timeZone: "UTC"` verilmezse
    // UTC'nin BATISINDAKİ her kullanıcı bir gün GERİ görür (Los Angeles'ta
    // 5 Ekim etkinliği "4 Ekim" olur). Test makinesi UTC olabileceği için
    // davranış tek başına yetmez; uygulamayı kaynaktan da kilitleriz.
    const source = readSource("src/lib/events-timezone.ts");
    const fn = source.slice(source.indexOf("export function formatEventDate"));
    const body = fn.slice(0, fn.indexOf("\n}"));
    // Gün UTC'de kurulur ve UTC'de yazılır — ikisi birden olmalı.
    expect(body).toContain("Date.UTC(");
    expect(body).toContain('timeZone: "UTC"');
  });

  it("geçersiz tarih ham hâliyle döner", () => {
    expect(formatEventDate("tarih değil")).toBe("tarih değil");
  });
});

describe("izleyici saat dilimi", () => {
  it("listeyle SINIRLI DEĞİLDİR", () => {
    // Form varsayılanı listeye daraltılır; izleyicinin gerçek dilimi daraltılamaz.
    // Daraltılsaydı `America/Detroit` kullanıcısına İstanbul saati "senin saatin"
    // diye gösterilirdi.
    const source = readSource("src/lib/events-timezone.ts");
    const fn = source.slice(source.indexOf("export function resolveViewerTimezone"));
    expect(fn.slice(0, 400)).not.toContain("isKnownEventTimezone");
    expect(resolveViewerTimezone().length).toBeGreaterThan(0);
  });

  it("etkinlik sayfaları izleyici için form varsayılanını KULLANMAZ", () => {
    for (const relativePath of [
      "src/pages/EventDetailPage.tsx",
      "src/components/events/MyEventsPanel.tsx",
    ]) {
      const source = readSource(relativePath);
      expect(source).toContain("resolveViewerTimezone");
      expect(source).not.toContain("resolveBrowserEventTimezone");
    }
  });
});

describe("gece yarısını aşan etkinlik", () => {
  it("bitiş başlangıçtan küçükse ertesi güne taşınır", () => {
    // 22:00 – 01:00: saf hesapta bitiş, başlangıçtan 21 saat ÖNCEYE düşer ve
    // schema.org `endDate < startDate` üretir (Google zengin sonucu geçersiz
    // sayar). Arayüzde tesadüfen doğru göründüğü için gözle QA bunu yakalamaz.
    const { start, end } = eventInstantRange({
      eventDate: "2026-10-05",
      startTime: "22:00",
      endTime: "01:00",
      timezone: "Europe/Berlin",
    });
    expect(start?.toISOString()).toBe("2026-10-05T20:00:00.000Z");
    expect(end?.toISOString()).toBe("2026-10-05T23:00:00.000Z");
    expect(end!.getTime()).toBeGreaterThan(start!.getTime());
  });

  it("aynı gün biten etkinlik kaydırılmaz", () => {
    const { start, end } = eventInstantRange({
      eventDate: "2026-10-05",
      startTime: "19:00",
      endTime: "21:00",
      timezone: "Europe/Berlin",
    });
    expect(start?.toISOString()).toBe("2026-10-05T17:00:00.000Z");
    expect(end?.toISOString()).toBe("2026-10-05T19:00:00.000Z");
  });

  it("ay sonunda taşma doğru çözülür", () => {
    const { end } = eventInstantRange({
      eventDate: "2026-10-31",
      startTime: "23:00",
      endTime: "02:00",
      timezone: "Europe/Istanbul",
    });
    // 1 Kasım 02:00 İstanbul (UTC+3) = 31 Ekim 23:00 UTC
    expect(end?.toISOString()).toBe("2026-10-31T23:00:00.000Z");
  });
});

describe("describeEventSchedule", () => {
  it("saat dilimi BOŞSA referans uydurmaz", () => {
    // 20 Eylül 2026 öncesi kayıtlar. Yanlış bir "Türkiye saatiyle" etiketi,
    // etiketsiz saatten daha zararlıdır.
    const view = describeEventSchedule({
      eventDate: "2026-01-15",
      startTime: "19:00:00",
      endTime: "21:00:00",
      eventTimezone: null,
      viewerTimezone: "Europe/Istanbul",
    });
    expect(view).toEqual({
      sourceRange: "19:00 – 21:00",
      sourceLabel: "",
      viewerRange: null,
      viewerLabel: "",
      viewerDayShift: false,
      viewerDayLabel: "",
    });
  });

  it("izleyici aynı saat dilimindeyse ikinci satır çizilmez", () => {
    const view = describeEventSchedule({
      eventDate: "2026-01-15",
      startTime: "19:00:00",
      endTime: null,
      eventTimezone: "Europe/Berlin",
      viewerTimezone: "Europe/Berlin",
    });
    expect(view?.sourceLabel).toBe("Almanya (Berlin)");
    expect(view?.viewerRange).toBeNull();
  });

  it("farklı saat diliminde izleyicinin kendi saatini verir", () => {
    const view = describeEventSchedule({
      eventDate: "2026-01-15",
      startTime: "19:00:00",
      endTime: "21:00:00",
      eventTimezone: "Europe/Berlin",
      viewerTimezone: "Asia/Qatar",
    });
    expect(view?.sourceRange).toBe("19:00 – 21:00");
    expect(view?.sourceLabel).toBe("Almanya (Berlin)");
    expect(view?.viewerRange).toBe("21:00 – 23:00");
    expect(view?.viewerLabel).toBe("Katar (Doha)");
    expect(view?.viewerDayShift).toBe(false);
  });

  it("gün kayması işaretlenir", () => {
    // Sidney 15 Temmuz 09:00 (UTC+10) = 14 Temmuz 23:00 UTC = Los Angeles'ta 14 Temmuz 16:00.
    const view = describeEventSchedule({
      eventDate: "2026-07-15",
      startTime: "09:00:00",
      endTime: null,
      eventTimezone: "Australia/Sydney",
      viewerTimezone: "America/Los_Angeles",
    });
    expect(view?.viewerRange).toBe("16:00");
    expect(view?.viewerDayShift).toBe(true);
    // Hangi güne kaydığı da yazılmalı: "farklı bir güne denk geliyor" demek ama
    // günü söylememek izleyiciyi bir gün geç bağlatır.
    expect(view?.viewerDayLabel).toBe("14 Temmuz Salı");
  });

  it("yalnız bitiş saati girilirse hangi uç olduğu yazılır", () => {
    // "21:00" tek başına başlangıç sanılır; üye tam bitiş saatinde gelir.
    const view = describeEventSchedule({
      eventDate: "2026-01-15",
      startTime: null,
      endTime: "21:00:00",
      eventTimezone: "Europe/Berlin",
      viewerTimezone: "Asia/Qatar",
    });
    expect(view?.sourceRange).toBe("Bitiş 21:00");
    expect(view?.viewerRange).toBe("Bitiş 23:00");
  });

  it("saat hiç girilmemişse null döner", () => {
    expect(
      describeEventSchedule({
        eventDate: "2026-01-15",
        startTime: null,
        endTime: null,
        eventTimezone: "Europe/Berlin",
        viewerTimezone: "Europe/Istanbul",
      }),
    ).toBeNull();
  });
});

describe("migration sözleşmesi", () => {
  it("timezone sütunu biçim kısıtıyla birlikte eklenir", () => {
    // `events.type` üzerinde CHECK olmaması 19 Eylül kusurunun sessiz kalmasının
    // sebebiydi. Burada en azından biçim denetlenir: "Almanya" ya da "Europe Berlin"
    // yazılamaz.
    const sql = readMigration();
    expect(sql).toContain("add column if not exists timezone text");
    expect(sql.toLowerCase()).toContain("check");
    expect(sql).toContain("events_timezone_format");
  });

  it("sütun NOT NULL yapılmaz", () => {
    // Canlıdaki dağıtım henüz eski paketi sunarken form timezone'suz insert atar;
    // NOT NULL, deploy penceresi boyunca her gönderimi düşürürdü.
    const sql = readMigration();
    expect(sql).not.toMatch(/timezone\s+text\s+not\s+null/i);
  });

  it("Supabase tip sözleşmesi timezone sütununu tanır", () => {
    // types.ts ile migration BİRLİKTE değişir. Ayrışırlarsa hata yalnız canlıda,
    // `PGRST204 Could not find the 'timezone' column` olarak çıkar ve formu
    // tamamen düşürür (CLAUDE.md'de belgelenen sınıf).
    const types = readSource("src/integrations/supabase/types.ts");
    const eventsBlock = types.slice(types.indexOf("      events: {"));
    expect(eventsBlock.slice(0, 4000)).toContain("timezone: string | null");
  });
});

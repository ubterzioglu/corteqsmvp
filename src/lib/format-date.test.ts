import { describe, expect, it } from "vitest";
import {
  formatLongDateTR,
  formatLongDateTimeTR,
  formatPaddedLongDateTR,
  formatShortDateTimeTR,
  formatShortDayMonthTR,
  formatShortDayMonthTimeTR,
} from "@/lib/format-date";

/**
 * Bu testler makinenin saat dilimine BAĞLI DEĞİLDİR (CI: Linux/UTC, geliştirici:
 * Windows/Berlin). Beklenen metin, `Intl` seçeneklerini yeniden kurarak DEĞİL,
 * yerel `Date` alıcılarından (getDate/getHours…) ve elle yazılmış Türkçe ay
 * adlarından üretilir; bu yüzden biçimleyicinin kendisiyle kendini
 * doğrulayan bir totoloji değildir. Zaman damgaları 12:00 UTC civarında seçildi ki
 * tarih UTC-11…UTC+11 arasındaki her dilimde aynı gün kalsın.
 */

const LONG_MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];
const SHORT_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

const pad = (n: number) => String(n).padStart(2, "0");

const SAMPLES = [
  "2026-01-05T12:00:00Z",
  "2026-02-03T12:07:00Z", // tek haneli dakika: "07"
  "2026-03-29T12:00:00Z", // AB yaz saati geçişi günü
  "2026-07-14T12:00:00Z",
  "2026-10-25T12:00:00Z", // AB kış saati geçişi günü
  "2026-11-07T12:00:00Z",
  "2026-12-31T12:00:00Z",
];

describe("formatLongDateTimeTR", () => {
  it.each(SAMPLES)("yerel alıcılardan kurulan metinle eşleşir: %s", (iso) => {
    const d = new Date(iso);
    const expected = `${d.getDate()} ${LONG_MONTHS[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    expect(formatLongDateTimeTR(iso)).toBe(expected);
  });

  it("gün başında sıfır yok, ay tam adıyla yazılır", () => {
    const out = formatLongDateTimeTR("2026-11-07T12:00:00Z");
    expect(out).toMatch(/^\d{1,2} Kasım 2026 \d{2}:\d{2}$/);
    expect(out).not.toMatch(/^0/);
  });

  it("string, number ve Date girdisi aynı çıktıyı verir", () => {
    const iso = "2026-11-07T12:00:00Z";
    const out = formatLongDateTimeTR(iso);
    expect(formatLongDateTimeTR(Date.parse(iso))).toBe(out);
    expect(formatLongDateTimeTR(new Date(iso))).toBe(out);
  });

  it('geçersiz tarihte eski toLocaleString davranışı korunur: "Invalid Date", fırlatmaz', () => {
    expect(formatLongDateTimeTR("garbage")).toBe("Invalid Date");
    expect(formatLongDateTimeTR("garbage")).toBe(new Date("garbage").toLocaleString("tr-TR"));
  });
});

describe("formatLongDateTimeTR · saat seçenekli eski toLocaleDateString çağrılarıyla eşdeğerlik", () => {
  // ServiceRequestsList ("Oluşturulma") ve AdminFeedbackPage eskiden
  // `toLocaleDateString`'i SAAT seçenekleriyle çağırıyordu. ECMA-402'de
  // `toLocaleDateString` yalnız VARSAYILAN bileşenleri tarihe çeker; verilen
  // hour/minute korunur. Bu blok o çağrıların yardımcıya geçişini kilitler —
  // biçimin doğruluğu yukarıdaki yerel-alıcı testlerinden gelir, buradan değil.
  const LEGACY_DATE_CALL_OPTIONS: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  it.each([...SAMPLES, "garbage"])("eski çağrıyla birebir aynı metni verir: %s", (value) => {
    expect(formatLongDateTimeTR(value)).toBe(new Date(value).toLocaleDateString("tr-TR", LEGACY_DATE_CALL_OPTIONS));
  });
});

describe("formatShortDateTimeTR", () => {
  it.each(SAMPLES)("yerel alıcılardan kurulan metinle eşleşir: %s", (iso) => {
    const d = new Date(iso);
    const expected = `${pad(d.getDate())} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    expect(formatShortDateTimeTR(iso)).toBe(expected);
  });

  it("gün iki haneli, ay kısaltmalıdır", () => {
    // 5 Kasım: gün tek haneli olduğundan "05" biçimi (başta sıfır) denetlenir; ±13 saatte de Kasım içinde kalır.
    expect(formatShortDateTimeTR("2026-11-05T12:00:00Z")).toMatch(/^0[4-6] Kas 2026 \d{2}:\d{2}$/);
  });

  it("geçersiz tarihte Intl.DateTimeFormat gibi RangeError fırlatır (eski radar davranışı)", () => {
    expect(() => formatShortDateTimeTR("garbage")).toThrow(RangeError);
  });
});

// Cadde akış/kafe/profil kartlarının yılsız "07 Kas 14:30" biçimi.
describe("formatShortDayMonthTimeTR", () => {
  it.each(SAMPLES)("yerel alıcılardan kurulan metinle eşleşir: %s", (iso) => {
    const d = new Date(iso);
    const expected = `${pad(d.getDate())} ${SHORT_MONTHS[d.getMonth()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    expect(formatShortDayMonthTimeTR(iso)).toBe(expected);
  });

  it("yıl yazılmaz, gün iki hanelidir", () => {
    expect(formatShortDayMonthTimeTR("2026-11-05T12:00:00Z")).toMatch(/^0[4-6] Kas \d{2}:\d{2}$/);
  });

  it("geçersiz tarihte RangeError fırlatır (eski Cadde biçimleyicileri Intl#format kullanıyordu)", () => {
    expect(() => formatShortDayMonthTimeTR("garbage")).toThrow(RangeError);
  });
});

// İlan listesi ve Çarşı kartlarının yılsız "07 Kas" biçimi.
describe("formatShortDayMonthTR", () => {
  it.each(SAMPLES)("yerel alıcılardan kurulan metinle eşleşir: %s", (iso) => {
    const d = new Date(iso);
    expect(formatShortDayMonthTR(iso)).toBe(`${pad(d.getDate())} ${SHORT_MONTHS[d.getMonth()]}`);
  });

  it("geçersiz tarihte RangeError fırlatır (eski Intl#format davranışı)", () => {
    expect(() => formatShortDayMonthTR("garbage")).toThrow(RangeError);
  });
});

// Diaspora haber detayı ve Çarşı ilan detayının "07 Kasım 2026" biçimi.
describe("formatPaddedLongDateTR", () => {
  it.each(SAMPLES)("yerel alıcılardan kurulan metinle eşleşir: %s", (iso) => {
    const d = new Date(iso);
    expect(formatPaddedLongDateTR(iso)).toBe(`${pad(d.getDate())} ${LONG_MONTHS[d.getMonth()]} ${d.getFullYear()}`);
  });

  it("geçersiz tarihte RangeError fırlatır (eski Intl#format davranışı)", () => {
    expect(() => formatPaddedLongDateTR("garbage")).toThrow(RangeError);
  });
});

// Revizyon istekleri ve grup şikayeti bekleme süresinin "7 Kasım 2026" biçimi.
describe("formatLongDateTR", () => {
  it.each(SAMPLES)("yerel alıcılardan kurulan metinle eşleşir: %s", (iso) => {
    const d = new Date(iso);
    expect(formatLongDateTR(iso)).toBe(`${d.getDate()} ${LONG_MONTHS[d.getMonth()]} ${d.getFullYear()}`);
  });

  it.each([...SAMPLES, "garbage"])("eski toLocaleDateString çağrısıyla birebir aynı metni verir: %s", (value) => {
    expect(formatLongDateTR(value)).toBe(
      new Date(value).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
    );
  });

  it('geçersiz tarihte "Invalid Date" döner, fırlatmaz', () => {
    expect(formatLongDateTR("garbage")).toBe("Invalid Date");
  });
});

// 07.11 inceleme: biçimleyici modül ölçeğinde ÖNBELLEĞE ALINMAZ. `Intl.DateTimeFormat`
// kurulduğu anın saat dilimini sabitler; sekme açıkken işletim sisteminin saat dilimi
// değişirse (yolculuk) eski çağrı yerleri — her çağrıda `toLocaleString` — yeni dilimi
// izliyordu. Önbellekli sürüm modül yüklendiği dilimde takılı kalır.
describe("çalışma anında saat dilimi değişimi", () => {
  const withTimeZone = (run: () => void) => {
    const original = process.env.TZ;
    try {
      run();
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  };

  it("her çağrı o anki varsayılan saat dilimini izler", () => {
    const at = "2026-11-07T12:00:00Z";
    withTimeZone(() => {
      process.env.TZ = "UTC";
      expect(formatLongDateTimeTR(at)).toBe("7 Kasım 2026 12:00");
      expect(formatShortDateTimeTR(at)).toContain("12:00");

      process.env.TZ = "Asia/Tokyo"; // UTC+9, yaz saati yok
      expect(formatLongDateTimeTR(at)).toBe("7 Kasım 2026 21:00");
      expect(formatShortDateTimeTR(at)).toContain("21:00");
    });
  });

  it("tarih-yalnız ve yılsız yardımcılar da o anki dilimin GÜNÜNÜ izler", () => {
    // 23:30 UTC: UTC'de 7 Kasım, Tokyo'da (UTC+9) 8 Kasım 08:30.
    const at = "2026-11-07T23:30:00Z";
    withTimeZone(() => {
      process.env.TZ = "UTC";
      expect(formatShortDayMonthTimeTR(at)).toBe("07 Kas 23:30");
      expect(formatShortDayMonthTR(at)).toBe("07 Kas");
      expect(formatPaddedLongDateTR(at)).toBe("07 Kasım 2026");
      expect(formatLongDateTR(at)).toBe("7 Kasım 2026");

      process.env.TZ = "Asia/Tokyo";
      expect(formatShortDayMonthTimeTR(at)).toBe("08 Kas 08:30");
      expect(formatShortDayMonthTR(at)).toBe("08 Kas");
      expect(formatPaddedLongDateTR(at)).toBe("08 Kasım 2026");
      expect(formatLongDateTR(at)).toBe("8 Kasım 2026");
    });
  });
});

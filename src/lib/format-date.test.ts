import { describe, expect, it } from "vitest";
import { formatLongDateTimeTR, formatShortDateTimeTR } from "@/lib/format-date";

/**
 * Bu testler makinenin saat dilimine BAĞLI DEĞİLDİR (CI: Linux/UTC, geliştirici:
 * Windows/Berlin). Beklenen metin, `Intl` seçeneklerini yeniden kurarak DEĞİL,
 * yerel `Date` alıcılarından (getDate/getHours…) ve elle yazılmış Türkçe ay
 * adlarından üretilir; bu yüzden biçimleyicinin kendisiyle kendini
 * doğrulayan bir totoloji değildir. Zaman damgaları 12:00 UTC seçildi ki tarih
 * UTC-11…UTC+11 arasındaki her dilimde aynı gün kalsın.
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

// 07.11 inceleme: biçimleyici modül ölçeğinde ÖNBELLEĞE ALINMAZ. `Intl.DateTimeFormat`
// kurulduğu anın saat dilimini sabitler; sekme açıkken işletim sisteminin saat dilimi
// değişirse (yolculuk) eski çağrı yerleri — her çağrıda `toLocaleString` — yeni dilimi
// izliyordu. Önbellekli sürüm modül yüklendiği dilimde takılı kalır.
describe("çalışma anında saat dilimi değişimi", () => {
  it("her çağrı o anki varsayılan saat dilimini izler", () => {
    const original = process.env.TZ;
    const at = "2026-11-07T12:00:00Z";
    try {
      process.env.TZ = "UTC";
      expect(formatLongDateTimeTR(at)).toBe("7 Kasım 2026 12:00");
      expect(formatShortDateTimeTR(at)).toContain("12:00");

      process.env.TZ = "Asia/Tokyo"; // UTC+9, yaz saati yok
      expect(formatLongDateTimeTR(at)).toBe("7 Kasım 2026 21:00");
      expect(formatShortDateTimeTR(at)).toContain("21:00");
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });
});

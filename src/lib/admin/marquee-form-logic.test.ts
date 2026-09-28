// AdminMarqueePage form mantığı — güvenlik ağı (C04b).

import { describe, expect, it } from "vitest";

import {
  emptyMarqueeForm,
  formatMarqueeNewsDate,
  marqueeRowToFormState,
  normalizeOptionalText,
  toLocalInputValue,
} from "@/lib/admin/marquee-form-logic";
import type { MarqueeItemRow } from "@/lib/marquee";

const row = (over: Partial<MarqueeItemRow> = {}): MarqueeItemRow =>
  ({
    id: "1",
    type: "news",
    slug: "haber",
    title: "Başlık",
    summary: "Özet",
    detail_content: null,
    image_url: null,
    image_alt: null,
    metric_value: null,
    link_enabled: false,
    sort_order: 3,
    is_active: true,
    published_at: "2026-05-19T09:30:00.000Z",
    ...over,
  }) as MarqueeItemRow;

describe("toLocalInputValue", () => {
  it("datetime-local biçimi üretir (saniye YOK)", () => {
    // Saniyeli değeri `<input type="datetime-local">` sessizce yok sayar ve alan
    // boş görünür.
    expect(toLocalInputValue("2026-05-19T09:30:00.000Z")).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    );
  });

  it("YEREL duvar saatini korur — gidiş-dönüş aynı anı verir", () => {
    // ⚠️ Test saat diliminden BAĞIMSIZ olmalı: sabit bir çıktı beklemek testi
    // yalnız tek makinede doğru kılar. Bunun yerine üretilen yerel metin yerel
    // olarak ayrıştırılıp ÖZGÜN ANLA karşılaştırılıyor.
    const instant = "2026-05-19T09:30:00.000Z";
    const local = toLocalInputValue(instant);

    // `new Date("...T..:..")` (Z'siz) yerel saat olarak ayrıştırılır.
    const roundTrip = new Date(local);
    expect(Math.abs(roundTrip.getTime() - new Date(instant).getTime())).toBeLessThan(60_000);
  });

  it("kaydırma GERÇEKTEN yapılıyor — ham toISOString ile aynı değil (UTC dışı dilimde)", () => {
    const instant = "2026-05-19T09:30:00.000Z";
    const offsetMinutes = new Date(instant).getTimezoneOffset();

    if (offsetMinutes === 0) {
      // Makine UTC'deyse ikisi zaten aynıdır; bu durumda iddia anlamsız olur.
      expect(toLocalInputValue(instant)).toBe(instant.slice(0, 16));
      return;
    }
    expect(toLocalInputValue(instant)).not.toBe(instant.slice(0, 16));
  });

  it("geçersiz tarihte ŞİMDİ döner, boş DEĞİL", () => {
    // Boş alan kullanıcıya tarihin silindiğini düşündürürdü.
    const now = new Date("2026-01-02T03:04:00.000Z");
    expect(toLocalInputValue("tarih değil", now)).toBe("2026-01-02T03:04");
  });
});

describe("emptyMarqueeForm", () => {
  it("her çağrıda YENİ nesne döner", () => {
    expect(emptyMarqueeForm()).not.toBe(emptyMarqueeForm());
  });

  it("varsayılan tür haber ve kayıt aktif başlar", () => {
    const form = emptyMarqueeForm();

    expect(form.type).toBe("news");
    expect(form.is_active).toBe(true);
    expect(form.link_enabled).toBe(false);
  });

  it("yayın tarihi datetime-local biçiminde", () => {
    expect(emptyMarqueeForm(new Date("2026-05-19T09:30:00.000Z")).published_at).toBe(
      "2026-05-19T09:30",
    );
  });
});

describe("marqueeRowToFormState", () => {
  it("tanınmayan türü 'news'e düşürür", () => {
    // ⚠️ Ham değeri geçirmek <Select>'i BOŞ gösterirdi ve kullanıcı kaydettiğinde
    // türü sessizce değiştirmiş olurdu.
    expect(marqueeRowToFormState(row({ type: "bilinmeyen" as never })).type).toBe("news");
  });

  it("tanınan üç türü KORUR", () => {
    for (const type of ["news", "stat", "announcement"] as const) {
      expect(marqueeRowToFormState(row({ type })).type).toBe(type);
    }
  });

  it("null alanları boş dizeye çevirir (kontrollü input boş kalmasın)", () => {
    const form = marqueeRowToFormState(row({ slug: null, image_url: null, metric_value: null }));

    expect(form.slug).toBe("");
    expect(form.image_url).toBe("");
    expect(form.metric_value).toBe("");
  });

  it("sayısal sırayı metne çevirir (input değeri string olmalı)", () => {
    expect(marqueeRowToFormState(row({ sort_order: 7 })).sort_order).toBe("7");
  });
});

describe("normalizeOptionalText", () => {
  it("boş ve boşluklu metni null yapar, gerçek metni kırpar", () => {
    expect(normalizeOptionalText("  ")).toBeNull();
    expect(normalizeOptionalText("")).toBeNull();
    expect(normalizeOptionalText("  Şişli  ")).toBe("Şişli");
  });
});

describe("formatMarqueeNewsDate", () => {
  it("null ve geçersiz tarihte 'Tarih yok' döner", () => {
    expect(formatMarqueeNewsDate(null)).toBe("Tarih yok");
    expect(formatMarqueeNewsDate("tarih değil")).toBe("Tarih yok");
  });

  it("TÜRKÇE ay adı üretir (ortam varsayılanına bırakılmaz)", () => {
    // Dil etiketi verilmezse ay adı İngilizce çıkar ve bunu yalnız o ortamda
    // çalışan fark eder.
    //
    // ⚠️ AY SEÇİMİ ÖNEMLİ: bu testin ilk hâli 19 Mayıs kullanıyordu ve DÜŞTÜ —
    // Türkçe'de Mayıs'ın kısaltması da "May", yani İngilizceyle AYNI. "Mar" da
    // öyle. Bu iki ayla yazılan bir yerelleştirme testi ya yanlış kırmızı verir
    // ya da (tersinde) İngilizce çıktıyı kazara doğrular. Ocak ayırt edicidir:
    // Türkçe "Oca", İngilizce "Jan".
    const formatted = formatMarqueeNewsDate("2026-01-15T09:30:00.000Z");

    expect(formatted).toContain("2026");
    expect(formatted).toContain("Oca");
    expect(formatted).not.toContain("Jan");
  });
});

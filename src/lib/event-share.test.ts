import { describe, expect, it } from "vitest";

import {
  EVENT_SHARE_DESCRIPTION_LIMIT,
  EVENT_SHARE_TARGETS,
  buildEventShareText,
  buildEventShareUrl,
} from "./event-share";

// Sözleşme testi — gevşetme, dosyayı düzelt.
//
// Paylaşım bağlantıları 20 Eylül 2026'ya kadar `EventDetailPage.tsx` içine
// gömülüydü. Liste kartına ve "Etkinliklerim" paneline de eklenince üç kopya
// olacaktı; kopyalar zamanla ayrışır. `events-vocabulary.test.ts` ayrıca bu
// bağlantıların sayfalara geri GÖMÜLMEDİĞİNİ denetler.

describe("paylaşım metni", () => {
  it("başlık ve açıklamayı birleştirir", () => {
    expect(buildEventShareText({ title: "Berlin Buluşması", description: "Aylık networking" })).toBe(
      "Berlin Buluşması\nAylık networking",
    );
  });

  it("açıklama yoksa yalnız başlık döner", () => {
    expect(buildEventShareText({ title: "Berlin Buluşması", description: "   " })).toBe("Berlin Buluşması");
  });

  it("uzun açıklamayı kelime ortasından KESMEZ", () => {
    const description = "kelime ".repeat(80).trim();
    const text = buildEventShareText({ title: "Başlık", description });
    expect(text.length).toBeLessThan(EVENT_SHARE_DESCRIPTION_LIMIT + 30);
    expect(text.endsWith("…")).toBe(true);
    expect(text).not.toContain("kelim…");
  });

  it("Türkçe karakterler korunur", () => {
    const text = buildEventShareText({ title: "Şölen", description: "İzmir'de buluşuyoruz" });
    expect(text).toContain("Şölen");
    expect(text).toContain("buluşuyoruz");
  });
});

describe("paylaşım adresi", () => {
  it("etkinlik adresini origin'den kurar", () => {
    expect(buildEventShareUrl("abc-123", "https://corteqs.net")).toBe("https://corteqs.net/events/abc-123");
  });

  it("sondaki eğik çizgiyi tekrarlamaz", () => {
    expect(buildEventShareUrl("abc", "https://corteqs.net/")).toBe("https://corteqs.net/events/abc");
  });
});

describe("paylaşım hedefleri", () => {
  const share = {
    title: "Berlin Buluşması",
    description: "Aylık networking akşamı",
    url: "https://corteqs.net/events/abc-123",
  };

  it("dört platform tanımlıdır ve anahtarlar tekildir", () => {
    const keys = EVENT_SHARE_TARGETS.map((target) => target.key);
    expect(keys).toEqual(["whatsapp", "linkedin", "x", "facebook"]);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("her bağlantı geçerli bir https adresidir ve etkinlik URL'ini taşır", () => {
    for (const target of EVENT_SHARE_TARGETS) {
      const href = target.buildHref(share);
      expect(() => new URL(href)).not.toThrow();
      expect(new URL(href).protocol).toBe("https:");
      expect(decodeURIComponent(href)).toContain(share.url);
    }
  });

  it("metin ve URL KODLANIR", () => {
    // Kodlanmamış bir `&` ya da `#`, paylaşım metnini sessizce yarıda keser.
    const tricky = { ...share, title: "Kahve & Sohbet #1", description: "A?b=c" };
    for (const target of EVENT_SHARE_TARGETS) {
      const href = target.buildHref(tricky);
      expect(href).not.toContain("& Sohbet");
      expect(href).not.toContain("#1");
    }
  });
});

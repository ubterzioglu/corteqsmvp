import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DEFAULT_EVENT_TYPE,
  EVENT_CATEGORY_OPTIONS,
  EVENT_CATEGORY_VALUES,
  EVENT_TYPE_OPTIONS,
  EVENT_TYPE_VALUES,
  eventTypeLabel,
  isOnlineEventType,
  isPhysicalEventType,
  normalizeEventType,
} from "./events-vocabulary";

// Sözleşme testi — gevşetme, dosyayı düzelt.
//
// 19 Eylül 2026'da herkese açık etkinlik formu kategori/tür DEĞERLERİNİ Türkçe
// karakterlerinden arındırılmış hâlleriyle yazmaya başladı ("yuz yuze", "egitim",
// "kultur", "is"). `events.type` üzerinde CHECK kısıtı olmadığı için değer sessizce
// kaydedildi; etkinlik kendi filtresine düşmedi, detay sayfasında konumu görünmedi.
// Ne lint ne test yakaladı. Bu dosya o sınıfı kapatır.

const EVENT_SOURCE_FILES = [
  "src/components/events/CreateEventFormSection.tsx",
  "src/components/events/EventsHero.tsx",
  "src/pages/EventsPage.tsx",
  "src/pages/EventDetailPage.tsx",
  "src/pages/admin/AdminEventsPage.tsx",
  "src/lib/events-api.ts",
  "src/hooks/use-events.ts",
];

function readSource(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("etkinlik sözlüğü", () => {
  it("tür değerleri Türkçe karakterleriyle yazılıdır", () => {
    expect(EVENT_TYPE_VALUES).toEqual(["yüz yüze", "online", "hybrid"]);
    expect(DEFAULT_EVENT_TYPE).toBe("yüz yüze");
  });

  it("kategori değerleri Türkçe karakterleriyle yazılıdır", () => {
    expect(EVENT_CATEGORY_VALUES).toEqual(["networking", "eğitim", "kültür", "iş", "sosyal", "spor"]);
  });

  it("seçenek listeleri değer birliğiyle birebir örtüşür", () => {
    expect(EVENT_TYPE_OPTIONS.map((option) => option.value)).toEqual([...EVENT_TYPE_VALUES]);
    expect(EVENT_CATEGORY_OPTIONS.map((option) => option.value)).toEqual([...EVENT_CATEGORY_VALUES]);
  });

  it("tür etiketleri ve alan görünürlüğü doğru çözülür", () => {
    expect(eventTypeLabel("yüz yüze")).toBe("Fiziksel");
    expect(eventTypeLabel("online")).toBe("Dijital");
    expect(eventTypeLabel("hybrid")).toBe("Hibrit");
    // Tanınmayan/eski değer eski davranışa düşer.
    expect(eventTypeLabel("bilinmeyen")).toBe("Fiziksel");

    expect(isPhysicalEventType("yüz yüze")).toBe(true);
    expect(isPhysicalEventType("hybrid")).toBe(true);
    expect(isPhysicalEventType("online")).toBe(false);

    expect(isOnlineEventType("online")).toBe(true);
    expect(isOnlineEventType("hybrid")).toBe(true);
    expect(isOnlineEventType("yüz yüze")).toBe(false);
  });

  it("normalizeEventType bilinmeyen değeri varsayılana çeker", () => {
    expect(normalizeEventType("hybrid")).toBe("hybrid");
    expect(normalizeEventType("yuz yuze")).toBe("yüz yüze");
    expect(normalizeEventType(undefined)).toBe("yüz yüze");
    expect(normalizeEventType(42)).toBe("yüz yüze");
  });
});

describe("etkinlik dosyaları sözlükten sapmaz", () => {
  it.each(EVENT_SOURCE_FILES)("%s içinde ASCII'ye düşürülmüş değer yok", (relativePath) => {
    const source = readSource(relativePath);
    expect(source).not.toContain('"yuz yuze"');
    expect(source).not.toContain('"egitim"');
    expect(source).not.toContain('"kultur"');
  });

  it.each(EVENT_SOURCE_FILES)("%s kendi rakip seçenek listesini tanımlamaz", (relativePath) => {
    const source = readSource(relativePath);
    // Etiketler YALNIZ events-vocabulary.ts içinde yazılıdır. Başka bir dosyada
    // görünmeleri, oraya ikinci bir listenin kopyalandığı anlamına gelir.
    expect(source).not.toContain('label: "Fiziksel"');
    expect(source).not.toContain('label: "Hibrit"');
    expect(source).not.toContain('label: "Kültür & Sanat"');
  });

  it("etkinlik sayfaları tür karşılaştırmasını elle yapmaz", () => {
    for (const relativePath of ["src/pages/EventsPage.tsx", "src/pages/EventDetailPage.tsx"]) {
      const source = readSource(relativePath);
      expect(source).not.toContain('event.type === "yüz yüze"');
    }
  });
});

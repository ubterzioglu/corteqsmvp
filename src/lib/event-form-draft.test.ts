import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  EVENT_FORM_DRAFT_TTL_MS,
  forgetEventFormDraft,
  readEventFormDraft,
  rememberEventFormDraft,
  type EventFormDraft,
} from "./event-form-draft";

const STORAGE_KEY = "corteqs.events.createDraft";

function makeDraft(overrides: Partial<EventFormDraft> = {}): EventFormDraft {
  return {
    title: "Berlin Türk Girişimciler Buluşması",
    description: "Aylık networking akşamı",
    category: "networking",
    type: "yüz yüze",
    eventDate: "2026-10-01",
    startTime: "19:00",
    endTime: "22:00",
    timezone: "Europe/Berlin",
    country: "Almanya",
    city: "Berlin",
    location: "Kreuzberg",
    onlineUrl: "",
    price: "15",
    maxAttendees: "60",
    coverImage: "",
    tags: ["Networking", "Berlin"],
    organizerName: "Ayşe Yılmaz",
    registrationUrl: "",
    ...overrides,
  };
}

describe("etkinlik formu taslağı", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("yazılan taslağı aynen geri verir", () => {
    const draft = makeDraft();
    rememberEventFormDraft(draft);
    expect(readEventFormDraft()).toEqual(draft);
  });

  it("taslak yoksa null döner", () => {
    expect(readEventFormDraft()).toBeNull();
  });

  it("unutulan taslak geri gelmez", () => {
    rememberEventFormDraft(makeDraft());
    forgetEventFormDraft();
    expect(readEventFormDraft()).toBeNull();
  });

  it("TTL dolduktan sonra taslak düşer", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-19T20:00:00Z"));
    rememberEventFormDraft(makeDraft());

    vi.setSystemTime(new Date("2026-09-19T20:00:00Z").getTime() + EVENT_FORM_DRAFT_TTL_MS + 1);
    expect(readEventFormDraft()).toBeNull();
  });

  it("bozuk JSON çökmeden null döner", () => {
    window.sessionStorage.setItem(STORAGE_KEY, "{bu json değil");
    expect(readEventFormDraft()).toBeNull();
  });

  it("bilinmeyen tür değeri varsayılana çekilir", () => {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...makeDraft(), type: "yuz yuze", at: Date.now() }),
    );
    expect(readEventFormDraft()?.type).toBe("yüz yüze");
  });

  it("eksik alanlar boşa düşer, yarım taslak yine de okunur", () => {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ title: "Sadece başlık", at: Date.now() }));
    const draft = readEventFormDraft();
    expect(draft?.title).toBe("Sadece başlık");
    expect(draft?.description).toBe("");
    expect(draft?.tags).toEqual([]);
  });

  it("depolama erişimi atarsa hiçbir çağrı fırlatmaz", () => {
    const blow = () => {
      throw new Error("SecurityError");
    };
    vi.spyOn(window.sessionStorage.__proto__, "getItem").mockImplementation(blow);
    vi.spyOn(window.sessionStorage.__proto__, "setItem").mockImplementation(blow);
    vi.spyOn(window.sessionStorage.__proto__, "removeItem").mockImplementation(blow);

    expect(() => rememberEventFormDraft(makeDraft())).not.toThrow();
    expect(() => forgetEventFormDraft()).not.toThrow();
    expect(readEventFormDraft()).toBeNull();
  });
});

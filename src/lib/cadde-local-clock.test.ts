import { describe, expect, it } from "vitest";

import { readCaddeClock, resolveCaddeClockTarget } from "@/lib/cadde-local-clock";

const CITIES = [
  { name: "Istanbul", timezone: "Europe/Istanbul" },
  { name: "Berlin", timezone: "Europe/Berlin" },
  { name: "Münih", timezone: "Europe/Berlin" },
  { name: "Konya", timezone: null },
];

describe("resolveCaddeClockTarget", () => {
  it("seçili filtre şehrini profil şehrine tercih eder", () => {
    expect(resolveCaddeClockTarget(["Berlin"], "Istanbul", CITIES)).toEqual({
      cityName: "Berlin",
      timeZone: "Europe/Berlin",
    });
  });

  it("filtre boşken profil şehrine düşer", () => {
    expect(resolveCaddeClockTarget([], "Berlin", CITIES)).toEqual({
      cityName: "Berlin",
      timeZone: "Europe/Berlin",
    });
  });

  // Kök neden koruması: profil "İstanbul", katalog "Istanbul" yazıyor. Çıplak ===
  // karşılaştırması bu çifti kaçırırdı — canlıda tam olarak bu sınıf hata yaşandı.
  it("Türkçe fold ile eşleşir — İstanbul ↔ Istanbul", () => {
    expect(resolveCaddeClockTarget(["İSTANBUL"], null, CITIES)?.cityName).toBe("Istanbul");
    expect(resolveCaddeClockTarget([], "istanbul", CITIES)?.cityName).toBe("Istanbul");
  });

  it("saat dilimi olmayan şehri atlar ve sıradakine geçer", () => {
    expect(resolveCaddeClockTarget(["Konya", "Berlin"], null, CITIES)?.cityName).toBe("Berlin");
  });

  it("hiçbiri çözülmezse null döner — yanlış şehrin saati gösterilmez", () => {
    expect(resolveCaddeClockTarget(["Vancouver"], "Belirtilmedi", CITIES)).toBeNull();
    expect(resolveCaddeClockTarget([], null, CITIES)).toBeNull();
    expect(resolveCaddeClockTarget(["  "], "", CITIES)).toBeNull();
  });
});

describe("readCaddeClock", () => {
  it("saati hedef saat diliminde okur, yerel makineninkinde değil", () => {
    const noonUtc = new Date("2026-08-05T12:00:00Z");
    expect(readCaddeClock(noonUtc, "UTC")?.time).toBe("12:00");
    // Europe/Istanbul yaz saatinde UTC+3.
    expect(readCaddeClock(noonUtc, "Europe/Istanbul")?.time).toBe("15:00");
  });

  it("gün/gece eşiklerini kapsayıcı-başlangıç, dışlayıcı-bitiş uygular", () => {
    expect(readCaddeClock(new Date("2026-08-05T05:59:00Z"), "UTC")?.isDay).toBe(false);
    expect(readCaddeClock(new Date("2026-08-05T06:00:00Z"), "UTC")?.isDay).toBe(true);
    expect(readCaddeClock(new Date("2026-08-05T19:59:00Z"), "UTC")?.isDay).toBe(true);
    expect(readCaddeClock(new Date("2026-08-05T20:00:00Z"), "UTC")?.isDay).toBe(false);
  });

  it("saat 24 saatlik ve iki haneli biçimde gelir", () => {
    expect(readCaddeClock(new Date("2026-08-05T04:07:00Z"), "UTC")?.time).toBe("04:07");
    expect(readCaddeClock(new Date("2026-08-05T23:45:00Z"), "UTC")?.time).toBe("23:45");
  });

  // Değer veritabanından geliyor; tek bozuk satır Intl'den RangeError fırlatıp
  // tüm Cadde sayfasını düşürebilirdi.
  it("geçersiz saat diliminde çökmez, null döner", () => {
    expect(readCaddeClock(new Date("2026-08-05T12:00:00Z"), "Mars/Olympus")).toBeNull();
    expect(readCaddeClock(new Date("2026-08-05T12:00:00Z"), "")).toBeNull();
  });
});

/**
 * Workshop m133 — akışın üstündeki kapsam şeridinde gösterilen yerel saat.
 *
 * Madde: "feedin üzerinde şehir ülke göstergesinin yanında dijital bir saat, gün içiyse
 * güneşle battıysa ayla beraber çıkabilir."
 *
 * DİKKAT — bu, 04.08.2026'da `0ec5d9b` ile TAMAMEN KALDIRILAN "Dünya saatleri" şeridi
 * DEĞİLDİR. O şerit beş şehrin analog kadranıydı (m54/m55/m56 — panoda hâlâ ✓ işaretli
 * ama tarif ettikleri bileşen artık yok). Bu ise tek şehrin dijital saati. Silinen şeridi
 * geri getirmek isteyen olursa bunun onun yerine geçtiğini bilsin.
 *
 * Saat dilimi verisi HAZIR: `cadde_cities.timezone` (bkz. listCaddeCities). Yeni sorgu,
 * yeni tablo veya koordinat altyapısı gerekmiyor.
 */

import { trFold } from "@/lib/text-normalization";

/** Saatin ait olduğu şehir ve IANA saat dilimi. */
export type CaddeClockTarget = {
  cityName: string;
  timeZone: string;
};

/** Bir okuma anındaki saat metni ve gün/gece ayrımı. */
export type CaddeClockReading = {
  /** "14:32" — 24 saatlik, sabit iki haneli. */
  time: string;
  isDay: boolean;
};

/**
 * Gün/gece eşiği SABİT saatlerdir, gerçek gün doğumu/batımı DEĞİL.
 * Gerçek hesap enlem/boylam ister; profilde de katalogda da koordinat yok. Ekvatordan
 * uzak şehirlerde kışın 17:00 karanlıktır ve ikon yanlış kalır — bilinçli kabul edilen
 * sapma. Koordinat altyapısı gelirse burası gerçek hesapla değiştirilebilir.
 */
export const CADDE_CLOCK_DAY_START_HOUR = 6;
export const CADDE_CLOCK_DAY_END_HOUR = 20;

type CityLike = {
  name: string;
  timezone?: string | null;
};

/**
 * Saatin hangi şehre ait olacağını çözer.
 *
 * Sıra: önce kullanıcının seçtiği filtre şehri, o çözülmezse profilde kayıtlı şehir.
 * Birden fazla şehir seçiliyse ÇÖZÜLEN İLKİ kullanılır — akışın üstünde tek bir saat
 * var, "hangi şehir" sorusunun tek cevabı olmalı.
 *
 * Eşleşme `trFold` ile yapılır (SQL tarafındaki `cadde_fold_text`'in TS aynası): profil
 * "İstanbul" derken katalog "Istanbul" yazıyor olabilir. Çıplak `===` karşılaştırması
 * bu yüzden KULLANILMAZ — CLAUDE.md'deki hedef eşleştirme kuralının aynısı.
 *
 * Hiçbiri çözülmezse `null` döner ve saat hiç çizilmez; yanlış şehrin saatini göstermek
 * saat göstermemekten kötüdür.
 */
export function resolveCaddeClockTarget(
  selectedCities: readonly string[],
  profileCity: string | null | undefined,
  cities: readonly CityLike[],
): CaddeClockTarget | null {
  const candidates = [...selectedCities, profileCity ?? ""]
    .map((value) => value.trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    const key = trFold(candidate);
    const match = cities.find((city) => trFold(city.name) === key);
    if (match?.timezone) {
      return { cityName: match.name, timeZone: match.timezone };
    }
  }

  return null;
}

/**
 * Verilen anı hedef saat diliminde okur.
 *
 * `Intl.DateTimeFormat` geçersiz bir saat dilimi için RangeError FIRLATIR ve bu değer
 * veritabanından geliyor — tek bozuk satır tüm Cadde sayfasını düşürebilirdi. Bu yüzden
 * hata yutulur ve `null` dönülür (saat çizilmez), sayfa ayakta kalır.
 */
export function readCaddeClock(now: Date, timeZone: string): CaddeClockReading | null {
  try {
    const parts = new Intl.DateTimeFormat("tr-TR", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);

    const hour = parts.find((part) => part.type === "hour")?.value;
    const minute = parts.find((part) => part.type === "minute")?.value;
    if (!hour || !minute) return null;

    const hourNumber = Number(hour);
    if (!Number.isFinite(hourNumber)) return null;

    return {
      time: `${hour}:${minute}`,
      isDay: hourNumber >= CADDE_CLOCK_DAY_START_HOUR && hourNumber < CADDE_CLOCK_DAY_END_HOUR,
    };
  } catch {
    return null;
  }
}

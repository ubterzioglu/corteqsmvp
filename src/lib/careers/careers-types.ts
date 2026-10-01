/**
 * Kariyer sayfası (`/kariyer`) ilan verisinin tipleri — KR01.
 *
 * Kapsam: **herkese açık ilan metni**. İç işe alım hattı (aday, görüşme, teklif)
 * bu modülün işi değildir, bkz. `src/lib/kadro/` ve `careers-data.ts` başındaki not.
 */

export const CAREER_AREA_IDS = ["ops", "biz", "mkt", "prd", "tech"] as const;

export type CareerAreaId = (typeof CAREER_AREA_IDS)[number];

export type CareerArea = {
  id: CareerAreaId;
  /** Kullanıcıya görünen Türkçe başlık. */
  label: string;
};

export type CareerJob = {
  /** Sayfa içi çapa ve başvuru formunun `position` değeri; benzersiz. */
  id: string;
  area: CareerAreaId;
  /** Türkçe unvan (kullanıcıya görünen ad). */
  tr: string;
  /** İngilizce karşılığı — ilan kartında ikincil satır. */
  en: string;
  /** "Kurucu ortak adayı", "Komisyon ağırlıklı" gibi rozetler; boş olabilir. */
  badges: string[];
  intro: string;
  /** "Ne yapacaksın" maddeleri — boş olamaz. */
  tasks: string[];
  /** "Seni nasıl hayal ediyoruz" maddeleri — boş olamaz. */
  profile: string[];
  /** "Artı olur" metni. */
  plus: string;
  /** Kime raporlar + ilerleme yolu. */
  report: string;
  /** Çalışma/ödeme modeli. */
  model: string;
};

export type CareerInternship = {
  id: string;
  tr: string;
  en: string;
  intro: string;
  tasks: string[];
  profile: string[];
  model: string;
};

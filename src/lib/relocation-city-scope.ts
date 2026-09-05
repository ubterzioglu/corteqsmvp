// Taşınma araçlarında şehir sorusunun ülke kapsamını üretir (WS takip işi, 2026-09-05).
//
// Sorun: `profession_salary` aracında kullanıcı 4. soruda ("Hangi ülkeleri karşılaştırmak
// istiyorsun?", `target_countries`, en fazla 3 ülke) ülkelerini zaten seçiyor. 12. sorudaki
// şehir drill-down'ı bu cevabı OKUMUYORDU: `QuestionStepper` cevapları kendi state'inde
// tutuyor, `QuestionRenderer` ise yalnız sıradaki sorunun kendi değerini alıyordu. Sonuç:
// kullanıcı ülkesini ikinci kez seçmeden hiçbir şehir göremiyordu.
//
// Bu modül ayrı bir dosyada, çünkü `QuestionStepper` bir `.tsx` bileşeni; bileşen dışı
// sembol export etmek `react-refresh/only-export-components` uyarısı üretir ve lint taban
// çizgisi 0 problem (bkz. `src/lib/relocation-country-options.ts`, aynı gerekçe).

import type { ToolAnswerValue } from "@/lib/relocation-tools-types";

/** 4. sorunun anahtarı. Şehir kapsamı YALNIZ bu cevaptan türer. */
export const TARGET_COUNTRIES_QUESTION_KEY = "target_countries";

/** ISO 3166-1 alpha-2: tam iki harf. Şehir adı yazılmış eski cevapları eler. */
const ISO_ALPHA2 = /^[A-Z]{2}$/;

/**
 * `target_countries` cevabını ISO alpha-2 kod listesine çevirir.
 *
 * Cevap iki biçimde gelebilir: `CountryMultiCombobox` "DE,NL" üretir, ama sorunun seed
 * yardım metni ("ISO ülke kodları, virgülle") yüzünden elle "DE, NL" yazılmış eski
 * cevaplar da var; dizi biçimi de savunmacı olarak kabul edilir.
 *
 * Kod TEKNİK bir değerdir, bu yüzden `toUpperCase()` burada doğrudur — Türkçe i/İ kuralı
 * yalnız kullanıcıya görünen metinler için geçerlidir (CLAUDE.md "Türkçe Metin Kuralları").
 *
 * Boş sonuç "daraltma yok" demektir, "sonuç yok" değil: çağıran taraf tam ülke listesini
 * gösterir. Sorunun kendi yardım metni de "boş = hepsi" diyor.
 */
export function cityScopeFromAnswers(answers: Record<string, ToolAnswerValue>): string[] {
  const raw = answers[TARGET_COUNTRIES_QUESTION_KEY];
  const parts = Array.isArray(raw)
    ? raw.map(String)
    : typeof raw === "string"
      ? raw.split(",")
      : [];

  const seen = new Set<string>();
  for (const part of parts) {
    const code = part.trim().toUpperCase();
    if (ISO_ALPHA2.test(code)) seen.add(code);
  }
  return Array.from(seen);
}

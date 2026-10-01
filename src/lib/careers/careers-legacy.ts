/**
 * Önceki dönem kariyer ilanları (KR07).
 *
 * Bu dört ilan `/kariyer` sayfasında aylardır yayındaydı. **Silinmedi** —
 * yeni 17 ilanın altında ayrı bir bölümde, "önceki dönem ilanı" ibaresiyle
 * duruyor ve başvuruları yeni `career_applications` tablosuna düşüyor.
 *
 * ⚠️ Bu kimlikler başvuru formunun `position` seçeneğinde de yer ALMALIDIR:
 * aksi hâlde eski bir ilandan gelen kullanıcıya boş bir pozisyon kutusu
 * gösterilir ve seçim sessizce kaybolur. `careers-legacy.test.ts` ikisini
 * birbirine kilitler.
 *
 * ⚠️ **Kaldırma koşulu (karar sonraya bırakıldı):** bu dört ilan, yeni 17 ilan
 * üzerinden en az bir tam başvuru döngüsü tamamlanana ve ekip "artık
 * başvuru gelmiyor" diyene kadar durur. Karar verildiğinde bu dosya ve
 * `Career.tsx`'teki `jobs` dizisi birlikte silinir.
 */

export type LegacyCareerPosition = {
  id: string;
  /** Başvuru formunun seçeneğinde görünen ad. */
  title: string;
};

export const LEGACY_CAREER_POSITIONS: LegacyCareerPosition[] = [
  { id: "global-local-contributor", title: "Global Contributor / Local Contributor" },
  { id: "content-creator", title: "İçerik Üreticisi" },
  { id: "global-content-lead", title: "Global İçerik Lideri" },
  { id: "technical-core-team", title: "Teknik Çekirdek Ekip" },
];

export const LEGACY_POSITION_NOTE = "önceki dönem ilanı";

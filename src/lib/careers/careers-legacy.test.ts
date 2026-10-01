/**
 * KR07 sözleşmesi: önceki dönem ilanları silinmedi ve başvuru yolu kopmadı.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. Eski ilan kimliğinin başvuru formunun seçeneklerinde BULUNMAMASI —
 *      kullanıcı "Bu pozisyona başvur"a basar, forma gider, pozisyon kutusu
 *      boş görünür ve seçim sessizce kaybolur.
 *   2. Eski ilanların eski ilgi formuna (`InterestForm`) bağlı kalması —
 *      başvuru yeni `career_applications` tablosuna hiç düşmez.
 *   3. Eski ilanların sessizce silinmesi (karar sonraya bırakıldı).
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { LEGACY_CAREER_POSITIONS, LEGACY_POSITION_NOTE } from "@/lib/careers/careers-legacy";
import { CAREER_JOBS } from "@/lib/careers/careers-data";

const pageSource = () => readFileSync("src/pages/Career.tsx", "utf8");
const formSource = () => readFileSync("src/components/career/CareerApplicationForm.tsx", "utf8");

describe("önceki dönem ilanları", () => {
  it("dört ilan da sayfada duruyor", () => {
    const page = pageSource();

    expect(LEGACY_CAREER_POSITIONS).toHaveLength(4);
    for (const job of LEGACY_CAREER_POSITIONS) {
      expect(page, `${job.id} sayfadan silinmiş`).toContain(`id: "${job.id}"`);
    }
  });

  it("eski kimlikler yeni ilanlarla çakışmaz", () => {
    const newIds = new Set(CAREER_JOBS.map((job) => job.id));

    for (const job of LEGACY_CAREER_POSITIONS) {
      expect(newIds.has(job.id), `${job.id} hem eski hem yeni listede`).toBe(false);
    }
  });

  it("başvuru formu eski kimlikleri bir seçenek grubunda listeliyor", () => {
    // ⚠️ Bu iddia önce `toContain("LEGACY_CAREER_POSITIONS")` idi ve mutasyonu
    // KAÇIRDI: listeyi çizen `map` boşaltılsa bile IMPORT SATIRI o adı taşıdığı
    // için metin testi yeşil kalıyordu. Artık gerçek kullanım aranıyor; seçeneklerin
    // kullanıcıya göründüğü davranış testi `CareerApplicationForm.test.tsx`'te.
    const form = formSource();

    expect(form).toContain("<optgroup label=\"Önceki dönem ilanları\">");
    expect(form).toContain("{LEGACY_CAREER_POSITIONS.map(");
  });

  it("eski ilanlar yeni başvuru akışına bağlı — eski ilgi formuna DEĞİL", () => {
    const page = pageSource();

    expect(page).toContain("handleApplyToPosition(job.id)");
    expect(page).not.toContain("InterestForm");
  });

  it("her kartta 'önceki dönem ilanı' ibaresi var", () => {
    // ⚠️ Çıpa `{LEGACY_POSITION_NOTE}` — yani JSX'te GERÇEKTEN çizilen yer.
    // Yalnız `"LEGACY_POSITION_NOTE"` aranması mutasyonu kaçırdı: ibare
    // `{null}` ile değiştirildiğinde bile import satırı adı taşıyordu.
    expect(LEGACY_POSITION_NOTE).toBe("önceki dönem ilanı");
    expect(pageSource()).toContain("{LEGACY_POSITION_NOTE}");
  });

  it("kimlik ve başlıklar boş değil", () => {
    for (const job of LEGACY_CAREER_POSITIONS) {
      expect(job.id).toMatch(/^[a-z0-9-]+$/);
      expect(job.title.trim()).not.toBe("");
    }
  });
});

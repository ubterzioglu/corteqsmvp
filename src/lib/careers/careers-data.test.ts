/**
 * KR01 kabul sözleşmesi: 17 ilan, `id`'ler benzersiz, `tasks`/`profile` boş değil,
 * `area` geçerli.
 *
 * Bu veri ilerideki `/kariyer` sayfasının TEK kaynağıdır (KR04–KR06). Sayfa
 * yazılmadan önce bozulursa hata ancak canlıda, boş bir ilan kartı olarak görünür —
 * bu yüzden sözleşme veriyle aynı batch'te kilitlendi.
 */
import { describe, expect, it } from "vitest";

import { CAREER_AREAS, CAREER_INTERNSHIP, CAREER_JOBS } from "@/lib/careers/careers-data";
import { CAREER_AREA_IDS } from "@/lib/careers/careers-types";

describe("kariyer ilan verisi", () => {
  it("17 ilan taşır ve id'ler benzersizdir", () => {
    expect(CAREER_JOBS).toHaveLength(17);
    expect(new Set(CAREER_JOBS.map((job) => job.id)).size).toBe(CAREER_JOBS.length);
  });

  it("her ilanın alanı tanımlı bir bölümdür", () => {
    const areaIds = new Set<string>(CAREER_AREA_IDS);

    expect(CAREER_AREAS.map((area) => area.id).sort()).toEqual([...CAREER_AREA_IDS].sort());
    for (const job of CAREER_JOBS) expect(areaIds.has(job.area)).toBe(true);
  });

  it("hiçbir bölüm ilansız kalmaz", () => {
    // Boş bölüm, sayfada başlığı olup içeriği olmayan bir blok demektir.
    for (const area of CAREER_AREAS) {
      expect(CAREER_JOBS.some((job) => job.area === area.id)).toBe(true);
    }
  });

  it("metin alanları dolu, liste alanları boş değil", () => {
    for (const job of CAREER_JOBS) {
      for (const field of ["id", "tr", "en", "intro", "plus", "report", "model"] as const) {
        expect(job[field].trim(), `${job.id}.${field}`).not.toBe("");
      }
      expect(job.tasks.length, `${job.id}.tasks`).toBeGreaterThan(0);
      expect(job.profile.length, `${job.id}.profile`).toBeGreaterThan(0);
      for (const entry of [...job.tasks, ...job.profile, ...job.badges]) {
        expect(entry.trim(), `${job.id} madde`).not.toBe("");
      }
    }
  });

  it("staj programı da aynı doluluk kuralına uyar", () => {
    for (const field of ["id", "tr", "en", "intro", "model"] as const) {
      expect(CAREER_INTERNSHIP[field].trim(), `intern.${field}`).not.toBe("");
    }
    expect(CAREER_INTERNSHIP.tasks.length).toBeGreaterThan(0);
    expect(CAREER_INTERNSHIP.profile.length).toBeGreaterThan(0);
    // Staj kaydı ilan listesine karışmamalı: ayrı tip, ayrı bölüm.
    expect(CAREER_JOBS.some((job) => job.id === CAREER_INTERNSHIP.id)).toBe(false);
  });

  it("bölüm etiketleri birebir korunur (Türkçe harf kırpılmasın)", () => {
    // `verify:text` yalnız kodlama ve mojibake denetler, EKSİK HARFİ değil
    // (CLAUDE.md → Türkçe Metin Kuralları md. 6).
    // ⚠️ Bu iddia önce "metnin herhangi bir yerinde 'Ürün' geçiyor mu" biçimindeydi
    // ve mutasyon turunda KAÇIRDI: etiket "Urun"a düşürüldüğünde bile bir ilan
    // başlığındaki "Ürün Müdürü" testi yeşil tutuyordu. Birebir liste karşılaştırması
    // o boşluğu kapatır.
    expect(CAREER_AREAS).toEqual([
      { id: "ops", label: "Operasyon ve ağ" },
      { id: "biz", label: "İş ortaklıkları" },
      { id: "mkt", label: "Pazarlama, içerik ve topluluk" },
      { id: "prd", label: "Ürün" },
      { id: "tech", label: "Teknoloji" },
    ]);
  });
});

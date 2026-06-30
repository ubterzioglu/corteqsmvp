import { describe, expect, it } from "vitest";

import {
  VIZE_QUESTIONS,
  VIZE_RESULTS,
  VIZE_START_QUESTION,
  getVizeQuestion,
  getVizeResult,
  isVizeResultRef,
  vizeResultIdFromRef,
} from "@/lib/germany-vize-data";

// Karar ağacı bütünlüğü: her 'next' geçerli bir soruya veya sonuca çözülmeli (dead-end yok).

describe("VIZE karar ağacı bütünlüğü", () => {
  it("başlangıç sorusu mevcut", () => {
    expect(getVizeQuestion(VIZE_START_QUESTION)).not.toBeNull();
  });

  it("soru id'leri benzersiz", () => {
    const ids = VIZE_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("sonuç id'leri benzersiz", () => {
    const ids = VIZE_RESULTS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("her option 'next' geçerli soru veya sonuca çözülür (dead-end yok)", () => {
    for (const q of VIZE_QUESTIONS) {
      expect(q.options.length).toBeGreaterThan(0);
      for (const opt of q.options) {
        if (isVizeResultRef(opt.next)) {
          const rid = vizeResultIdFromRef(opt.next);
          expect(getVizeResult(rid), `${q.id}/${opt.key} → RESULT:${rid} bulunamadı`).not.toBeNull();
        } else {
          expect(getVizeQuestion(opt.next), `${q.id}/${opt.key} → ${opt.next} sorusu bulunamadı`).not.toBeNull();
        }
      }
    }
  });

  it("her sonuç ulaşılabilir (en az bir option ona işaret eder)", () => {
    const reachable = new Set<string>();
    for (const q of VIZE_QUESTIONS) {
      for (const opt of q.options) {
        if (isVizeResultRef(opt.next)) reachable.add(vizeResultIdFromRef(opt.next));
      }
    }
    for (const r of VIZE_RESULTS) {
      expect(reachable.has(r.id), `Sonuç ${r.id} hiçbir soruya bağlı değil`).toBe(true);
    }
  });

  it("her sonuçta başlık, şartlar ve adımlar dolu", () => {
    for (const r of VIZE_RESULTS) {
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.requirements.length).toBeGreaterThan(0);
      expect(r.steps.length).toBeGreaterThan(0);
    }
  });

  it("örnek yol: çalışma + iş teklifi + diploma + yüksek maaş → Mavi Kart", () => {
    // Q02=work→Q03; Q03=yes→Q04; Q04=yes→Q05; Q05=high→RESULT:BLUE_CARD
    let node = getVizeQuestion(VIZE_START_QUESTION)!;
    const path = [
      { q: "Q02", key: "work" },
      { q: "Q03", key: "yes" },
      { q: "Q04", key: "yes" },
      { q: "Q05", key: "high" },
    ];
    let finalResult = "";
    for (const step of path) {
      expect(node.id).toBe(step.q);
      const opt = node.options.find((o) => o.key === step.key)!;
      if (isVizeResultRef(opt.next)) {
        finalResult = vizeResultIdFromRef(opt.next);
        break;
      }
      node = getVizeQuestion(opt.next)!;
    }
    expect(finalResult).toBe("BLUE_CARD");
  });
});

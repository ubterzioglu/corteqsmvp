import { describe, expect, it } from "vitest";

import { buildExplanations } from "@/lib/relocation-explanations";

describe("buildExplanations", () => {
  it("yüksek bileşen için olumlu, düşük için uyarı cümlesi üretir", () => {
    const out = buildExplanations({ community_fit: 0.91, budget_fit: 0.3 }, 3);
    expect(out).toContain("Türk topluluğu ve Türkçe destekli servis yoğunluğu yüksek");
    expect(out).toContain("Konut bütçesi sınırda — erken arama önerilir");
  });

  it("limit kadar cümle döner, en uç bileşen önce", () => {
    const out = buildExplanations(
      {
        budget_fit: 1.0, // en uç (|1.0-0.5|=0.5)
        bureaucracy_ease: 0.5, // nötr — atlanır
        healthcare_access: 0.1, // düşük (|0.1-0.5|=0.4)
        gsm_coverage: 0.6, // ne yüksek ne düşük — atlanır
      },
      2,
    );
    expect(out).toHaveLength(2);
    expect(out[0]).toBe("Konut bütçenize rahat uyuyor"); // budget en uçta → önce
    expect(out[1]).toBe("Sağlık erişimi sınırlı — randevu için erken planlayın");
  });

  it("hepsi nötr ise boş döner", () => {
    expect(buildExplanations({ budget_fit: 0.5, gsm_coverage: 0.55 })).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";

import { CAFE_OCCUPANCY_DENOMINATOR_THRESHOLD, formatCafeOccupancy } from "./cadde-cafe-occupancy";

describe("formatCafeOccupancy", () => {
  it("boş odada paydayı GİZLER — kritiğin asıl şikâyeti buydu", () => {
    // "2/100 üye" boşluğu vurguluyordu; artık yalnız gerçek sayı yazılıyor.
    expect(formatCafeOccupancy(2, 100)).toBe("2 üye");
  });

  it("doluluk eşiğe ulaşınca paydayı gösterir", () => {
    expect(formatCafeOccupancy(20, 100)).toBe("20/100 üye");
    expect(formatCafeOccupancy(45, 100)).toBe("45/100 üye");
  });

  it("eşiğin hemen altında paydayı hâlâ gizler", () => {
    expect(formatCafeOccupancy(19, 100)).toBe("19 üye");
  });

  it("kapasite tanımsız ya da sıfırsa payda zaten yoktur", () => {
    expect(formatCafeOccupancy(3, null)).toBe("3 üye");
    expect(formatCafeOccupancy(3, undefined)).toBe("3 üye");
    expect(formatCafeOccupancy(3, 0)).toBe("3 üye");
  });

  it("küçük kapasiteli odada da oran kuralı geçerlidir", () => {
    // 1/4 = %25 → eşiğin üstünde, payda anlamlı.
    expect(formatCafeOccupancy(1, 4)).toBe("1/4 üye");
    // 1/10 = %10 → altında.
    expect(formatCafeOccupancy(1, 10)).toBe("1 üye");
  });

  it("dolu odayı olduğu gibi yazar", () => {
    expect(formatCafeOccupancy(100, 100)).toBe("100/100 üye");
  });

  it("eşik sabiti belgelenen değerdedir", () => {
    // Değeri değiştirmek ürün kararıdır; testi sessizce kaydırmayın.
    expect(CAFE_OCCUPANCY_DENOMINATOR_THRESHOLD).toBe(0.2);
  });
});

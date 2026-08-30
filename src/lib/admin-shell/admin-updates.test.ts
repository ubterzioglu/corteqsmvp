import { describe, expect, it } from "vitest";

import { ADMIN_UPDATES } from "./admin-updates";

describe("ADMIN_UPDATES", () => {
  it("kalan işler turunu en yeni günlük kayıt olarak gösterir", () => {
    const latest = ADMIN_UPDATES[0];
    const detail = latest.items.join(" ");

    expect(latest.id).toBe("20260830-kalan-isler-temizlendi");
    expect(latest.date).toBe("30 Ağustos 2026");
    expect(detail).toContain("Contributor");
    expect(detail).toContain("0 uyarı");
    expect(detail).toContain("22/22");
    expect(detail).toContain("Referral QR");
    expect(detail).toContain("0 güvenlik açığı");
  });
});

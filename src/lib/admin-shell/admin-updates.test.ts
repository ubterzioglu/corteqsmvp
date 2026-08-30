import { describe, expect, it } from "vitest";

import { ADMIN_UPDATES } from "./admin-updates";

describe("ADMIN_UPDATES", () => {
  it("31 Ağustos sprint özetini en yeni günlük kayıt olarak gösterir", () => {
    const latest = ADMIN_UPDATES[0];
    const detail = latest.items.join(" ");

    expect(latest.id).toBe("20260830-limit-sprinti-canliya-alindi");
    expect(latest.date).toBe("30 Ağustos 2026");
    expect(detail).toContain("VIP");
    expect(detail).toContain("WhatsApp");
    expect(detail).toContain("1.676");
    expect(detail).toContain("kapalı");
  });
});

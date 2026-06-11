import { describe, expect, it } from "vitest";

import { notificationDeepLink } from "@/lib/cadde-notifications-api";

describe("notificationDeepLink (spec §17.2 entity deep link)", () => {
  it("cafe ve çarşı bildirimleri kendi detay sayfalarına gider", () => {
    expect(notificationDeepLink({ type: "cadde.cafe.joined", entityType: "cafe", entityId: "c1" })).toBe("/cadde/cafe/c1");
    expect(notificationDeepLink({ type: "x", entityType: "carsi_item", entityId: "i1" })).toBe("/cadde/carsi/i1");
  });

  it("kampanya bildirimi profile, post bildirimi Cadde'ye gider", () => {
    expect(notificationDeepLink({ type: "cadde.promotion.approved", entityType: "promotion", entityId: "p1" })).toBe("/profile");
    expect(notificationDeepLink({ type: "cadde.comment.created", entityType: "post", entityId: "p2" })).toBe("/cadde");
  });

  it("bilinmeyen tip Cadde köküne düşer", () => {
    expect(notificationDeepLink({ type: "unknown", entityType: null, entityId: null })).toBe("/cadde");
  });
});

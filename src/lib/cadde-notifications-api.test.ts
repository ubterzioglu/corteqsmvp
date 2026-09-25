import { describe, expect, it } from "vitest";

import {
  CADDE_CAFE_OPENED_NOTIFICATION_TYPE,
  notificationDeepLink,
  notificationUsesCafeIcon,
} from "@/lib/cadde-notifications-api";

describe("cadde.cafe.opened bildirimi", () => {
  it("yeni Cafe bildirimi Cafe detay sayfasına derin bağlantı verir", () => {
    expect(CADDE_CAFE_OPENED_NOTIFICATION_TYPE).toBe("cadde.cafe.opened");
    expect(
      notificationDeepLink({ type: CADDE_CAFE_OPENED_NOTIFICATION_TYPE, entityType: "cafe", entityId: "cafe-9" }),
    ).toBe("/cadde/cafe/cafe-9");
  });

  it("Cafe bildirimleri Cafe simgesini kullanır, diğerleri kullanmaz", () => {
    expect(notificationUsesCafeIcon({ type: CADDE_CAFE_OPENED_NOTIFICATION_TYPE, entityType: "cafe" })).toBe(true);
    expect(notificationUsesCafeIcon({ type: "cadde.cafe.expiring", entityType: null })).toBe(true);
    expect(notificationUsesCafeIcon({ type: "cadde.comment.created", entityType: "post" })).toBe(false);
    expect(notificationUsesCafeIcon({ type: "x", entityType: "carsi_item" })).toBe(false);
  });
});

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

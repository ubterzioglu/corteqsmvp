import { describe, expect, it } from "vitest";

import { normalizeCaddeReportDetails } from "@/lib/cadde-engagement-api";
import {
  normalizeCaddeHashtagRows,
  normalizeCaddeMentionRows,
} from "@/lib/cadde-feed-location-api";
import {
  mapCaddeBillboardRow,
  mapCaddeSponsoredRow,
} from "@/lib/cadde-promotion-api";
import {
  mapCaddePersonRow,
  normalizeCaddeInterestKeys,
} from "@/lib/cadde-search-interests-api";
import type { CaddeBillboardRow, CaddeSponsoredRow } from "@/lib/cadde-types";

describe("Cadde feed/location pure adapters", () => {
  it("malformed hashtag ve mention değerlerini güvenli biçimde eler", () => {
    expect(normalizeCaddeHashtagRows([
      { tag: "berlin", displayTag: "Berlin" },
      { tag: "istanbul" },
      { tag: "" },
      null,
    ])).toEqual([
      { tag: "berlin", displayTag: "Berlin" },
      { tag: "istanbul", displayTag: "istanbul" },
    ]);

    expect(normalizeCaddeMentionRows([
      { type: "user", id: "user-1", label: "Ayşe" },
      { type: "unknown", id: "bad" },
      { type: "cafe", id: 42 },
    ])).toEqual([{ type: "user", id: "user-1", label: "Ayşe" }]);
  });
});

describe("Cadde promotion pure adapters", () => {
  it("veritabanı satırlarını UI modellerine dönüştürür", () => {
    const billboard: CaddeBillboardRow = {
      id: "billboard-1",
      card_type: "consultant",
      title: "Başlık",
      subtitle: null,
      description: "Açıklama",
      badge_text: "Yeni",
      cta_label: "İncele",
      cta_url: "/cadde",
      image_url: null,
      content_mode: "real",
      status: "published",
      country_id: null,
      city_id: null,
      is_featured: true,
      sort_order: 1,
    };
    const sponsored: CaddeSponsoredRow = {
      id: "sponsored-1",
      placement_key: "feed-inline",
      title: "Sponsor",
      description: "Açıklama",
      badge_text: null,
      cta_label: "Git",
      cta_url: "/pricing",
      image_url: null,
      content_mode: "real",
      status: "published",
      country_id: null,
      city_id: null,
      sort_order: 2,
    };

    expect(mapCaddeBillboardRow(billboard)).toMatchObject({
      id: "billboard-1",
      type: "consultant",
      isFeatured: true,
    });
    expect(mapCaddeSponsoredRow(sponsored)).toEqual({
      id: "sponsored-1",
      title: "Sponsor",
      description: "Açıklama",
      badgeText: null,
      ctaLabel: "Git",
      ctaUrl: "/pricing",
      imageUrl: null,
    });
  });
});

describe("Cadde search/interests pure adapters", () => {
  it("kişi sonucunu daraltır ve boolean alanını katı yorumlar", () => {
    expect(mapCaddePersonRow({
      user_id: "user-1",
      full_name: "Ayşe Kaya",
      city: "Berlin",
      country: null,
      has_profile: 1,
    })).toEqual({
      userId: "user-1",
      fullName: "Ayşe Kaya",
      city: "Berlin",
      country: null,
      hasProfile: false,
    });
  });

  it("ilgi anahtarlarını kırpar, boşları eler ve tekrarları kaldırır", () => {
    expect(normalizeCaddeInterestKeys([" teknoloji ", "", "teknoloji", "girişim"])).toEqual([
      "teknoloji",
      "girişim",
    ]);
  });
});

describe("Cadde engagement pure adapters", () => {
  it("şikayet detayını kırpar ve boş değeri null yapar", () => {
    expect(normalizeCaddeReportDetails("  Ek bilgi  ")).toBe("Ek bilgi");
    expect(normalizeCaddeReportDetails("   ")).toBeNull();
    expect(normalizeCaddeReportDetails()).toBeNull();
  });
});

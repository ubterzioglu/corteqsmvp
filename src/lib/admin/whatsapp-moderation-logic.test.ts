// WhatsApp moderasyonu saf mantığı — güvenlik ağı (C04).

import { describe, expect, it } from "vitest";

import {
  LANDING_CATEGORY_OPTIONS,
  LANDING_STATUS_BADGE_CLASS,
  LANDING_STATUS_LABEL,
  approvalFlagsFor,
  buildAdminContact,
  platformLabelsByRowId,
} from "@/lib/admin/whatsapp-moderation-logic";

describe("approvalFlagsFor", () => {
  it("üye ve yönetici BİRBİRİNİ DIŞLAR", () => {
    // ⚠️ Asıl kural bu: "üye"yi seçmek yöneticiyi TEMİZLEMELİ. İkisi birden açık
    // kalırsa kayıt listede iki rozetle çizilir ve bu gözden kaçar.
    expect(approvalFlagsFor("member")).toEqual({ memberApproved: true, adminApproved: false });
    expect(approvalFlagsFor("admin")).toEqual({ memberApproved: false, adminApproved: true });
  });

  it("seçim yoksa ikisi de kapalıdır", () => {
    expect(approvalFlagsFor("none")).toEqual({ memberApproved: false, adminApproved: false });
  });

  it("hiçbir seçimde iki bayrak birden açılamaz", () => {
    for (const choice of ["member", "admin", "none"] as const) {
      const flags = approvalFlagsFor(choice);
      expect(flags.memberApproved && flags.adminApproved).toBe(false);
    }
  });
});

describe("buildAdminContact", () => {
  it("iki alanı ayrı satıra yazar", () => {
    expect(buildAdminContact({ email: "a@b.c", phone: "+905551112233" })).toBe(
      "E-posta: a@b.c\nTelefon: +905551112233",
    );
  });

  it("boş alan SATIR AÇMAZ (yarım 'Telefon: ' satırı oluşmaz)", () => {
    expect(buildAdminContact({ email: "a@b.c", phone: "" })).toBe("E-posta: a@b.c");
    expect(buildAdminContact({ email: "   ", phone: "555" })).toBe("Telefon: 555");
  });

  it("ikisi de boşsa boş metin döner", () => {
    expect(buildAdminContact({ email: "", phone: "  " })).toBe("");
  });

  it("değerlerin başındaki/sonundaki boşluğu kırpar", () => {
    expect(buildAdminContact({ email: "  a@b.c  ", phone: "" })).toBe("E-posta: a@b.c");
  });
});

describe("platformLabelsByRowId", () => {
  it("dbId varsa onu, yoksa id'yi anahtar yapar", () => {
    const map = platformLabelsByRowId([
      { id: "i1", dbId: "d1", platform: "WhatsApp" },
      { id: "i2", dbId: null, platform: "Telegram" },
    ]);

    expect(map.d1).toBe("WhatsApp");
    expect(map.i2).toBe("Telegram");
  });

  it("boş/boşluklu platformu 'Belirtilmedi' yapar", () => {
    const map = platformLabelsByRowId([
      { id: "a", platform: "   " },
      { id: "b", platform: null },
    ]);

    expect(map.a).toBe("Belirtilmedi");
    expect(map.b).toBe("Belirtilmedi");
  });
});

describe("sözlükler", () => {
  it("her durum için hem etiket hem rozet sınıfı tanımlı", () => {
    // Biri eklenip öbürü unutulursa arayüzde renksiz ya da etiketsiz rozet çıkar.
    for (const status of ["pending", "approved", "rejected"] as const) {
      expect(LANDING_STATUS_LABEL[status]?.length ?? 0).toBeGreaterThan(0);
      expect(LANDING_STATUS_BADGE_CLASS[status]?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("kategori listesinde tekrar eden değer yok", () => {
    const values = LANDING_CATEGORY_OPTIONS.map((option) => option.value);

    expect(new Set(values).size).toBe(values.length);
  });

  it("'girisim' takma adı listede DURUR", () => {
    // Kaydederken 'yatirim'a çevrilir ama listeden kaldırılırsa geçmiş kayıtların
    // etiketi çözülemez.
    expect(LANDING_CATEGORY_OPTIONS.some((option) => option.value === "girisim")).toBe(true);
  });
});

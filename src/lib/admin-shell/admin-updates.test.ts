import { describe, expect, it } from "vitest";

import { ADMIN_UPDATES } from "./admin-updates";

describe("ADMIN_UPDATES", () => {
  // Yeni kayıt EN ÜSTE eklenir: okunmamış rozeti ve /admin/about sıralaması bu
  // sıraya güvenir. Kimlikler benzersiz olmalı — okundu takibi id ile yapılır.
  it("kayıtları en yeniden eskiye sıralar ve kimlikleri benzersizdir", () => {
    expect(ADMIN_UPDATES[0].id).toBe("20260906-buyuk-temizlik");
    expect(ADMIN_UPDATES[0].date).toBe("6 Eylül 2026");

    const ids = ADMIN_UPDATES.map((update) => update.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("büyük temizliği günlük dille duyurur ve kullanıcı etkisini net söyler", () => {
    const update = ADMIN_UPDATES.find(({ id }) => id === "20260906-buyuk-temizlik");
    const detail = update?.items.join(" ") ?? "";

    // En kritik cümle: okuyan kişi "bir şeyim silindi mi" diye korkmamalı.
    expect(detail).toContain("KULLANICININ GÖREBİLDİĞİ HİÇBİR ŞEY SİLİNMEDİ");
    // Test sayısının DÜŞMESİ açıklanmalı; açıklanmazsa kötü haber gibi okunur.
    expect(detail).toContain("TEST SAYISI NEDEN AZALDI");
    expect(detail).toMatch(/KONTROLLER:.*1\.816/);
  });

  it("günün ikinci partisini günlük dille, ölçülen sonuçlarla duyurur", () => {
    const update = ADMIN_UPDATES.find(
      ({ id }) => id === "20260905-ikinci-parti-cadde-carsi-araclar",
    );
    const detail = update?.items.join(" ") ?? "";

    // Üç sessiz canlı kusur da adıyla anlatılmalı: bunlar build/test kırmadan
    // aylarca sürebilen sınıf, duyuruda kaybolmamalı.
    expect(detail).toContain("YAZI TİPLERİ AYLARDIR HİÇ YÜKLENMİYORDU");
    expect(detail).toContain("6 ÜYE HİÇ PAYLAŞIM YAPAMIYORDU");
    expect(detail).toContain("'EK HEDEF' DÜĞMESİ PAYLAŞIMI KAYBETTİRİYORDU");

    // Sayılar ölçülmüş olmalı — "iyileştirildi" demek yetmez.
    expect(detail).toContain("107");
    expect(detail).toContain("113");
    expect(detail).toMatch(/KONTROLLER:.*1\.881/);
  });

  it("profil formu ilk partisini günlük dille duyurur", () => {
    const update = ADMIN_UPDATES.find(({ id }) => id === "20260905-profil-formu-ilk-parti");
    const detail = update?.items.join(" ") ?? "";

    // Madde başlıkları büyük harfle yazılır ("TELEFON ARTIK…", "BİZİ NEREDEN BULDUNUZ?").
    // Türkçe'de bare toLowerCase güvenli değil (İ→i̇), o yüzden aramayı metinde geçtiği
    // hâliyle yapıyoruz.
    expect(detail).toContain("TELEFON");
    expect(detail).toContain("Yalnız sen");
    expect(detail).toContain("NEREDEN BULDUNUZ");
    // Telefon alanının "yok olan alanı var etme" işi olduğu kaydı: 78 rol + 116 üye.
    expect(detail).toContain("78 aktif rol");
    expect(detail).toContain("116");
  });

  it("3 Eylül Profiller toplantısının panele işlendiğini duyurur", () => {
    const update = ADMIN_UPDATES.find(
      ({ id }) => id === "20260904-profil-toplantisi-ve-workshop-panosu",
    );
    const detail = update?.items.join(" ") ?? "";

    expect(detail).toContain("24 kayıt");
    expect(detail).toContain("B+B");
    expect(detail).toContain("Profil Workshop");
    expect(detail).toContain("26 madde");
  });

  it("TOP 10 HOT FIX listesinin sınır kuralını günlük dille anlatır", () => {
    const update = ADMIN_UPDATES.find(
      ({ id }) => id === "20260903-top-10-hot-fix-ve-yonetici-yetkisi",
    );
    const detail = update?.items.join(" ") ?? "";

    expect(update?.date).toBe("3 Eylül 2026");
    expect(detail).toContain("EN FAZLA 10 AÇIK MADDE");
    // Ana tablodan ayıran davranış: tamamlanan madde listede kalır, slot işgal etmez.
    expect(detail).toContain("listeden kaybolmuyor");
    expect(detail).toContain("SuperAdmin");
  });

  it("30 Ağustos'tan eksik kalan teknik işleri günlük kayıtlarda korur", () => {
    const update = ADMIN_UPDATES.find(
      ({ id }) => id === "20260831-30-agustos-eksik-teknik-isler",
    );
    const normalizedDetail = (update?.items.join(" ") ?? "").toLocaleLowerCase("tr-TR");

    expect(update?.date).toBe("31 Ağustos 2026");
    expect(normalizedDetail).toContain("migration");
    expect(normalizedDetail).toContain("supabase sdk");
    expect(normalizedDetail).toContain("veri sınırları");
    expect(normalizedDetail).toContain("test gürültüsü");
    expect(normalizedDetail).toContain("çoklu giriş");
  });

  it("kalan işler turunu günlük kayıtlarda korur", () => {
    const update = ADMIN_UPDATES.find(({ id }) => id === "20260830-kalan-isler-temizlendi");
    const detail = update?.items.join(" ") ?? "";

    expect(update?.date).toBe("30 Ağustos 2026");
    expect(detail).toContain("Contributor");
    expect(detail).toContain("0 uyarı");
    expect(detail).toContain("22/22");
    expect(detail).toContain("Referral QR");
    expect(detail).toContain("0 güvenlik açığı");
    expect(detail.toLocaleLowerCase("tr-TR")).toContain(
      "kendi hesabından kaynak gönderebiliyor",
    );
  });
});

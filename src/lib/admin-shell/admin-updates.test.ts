import { describe, expect, it } from "vitest";

import { ADMIN_UPDATES } from "./admin-updates";

describe("ADMIN_UPDATES", () => {
  // Yeni kayıt EN ÜSTE eklenir: okunmamış rozeti ve /admin/about sıralaması bu
  // sıraya güvenir. Kimlikler benzersiz olmalı — okundu takibi id ile yapılır.
  it("kayıtları en yeniden eskiye sıralar ve kimlikleri benzersizdir", () => {
    expect(ADMIN_UPDATES[0].id).toBe("20260913-dort-domain-daha-api-katmanina-tasindi");
    expect(ADMIN_UPDATES[0].date).toBe("13 Eylül 2026");

    const ids = ADMIN_UPDATES.map((update) => update.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("13 Eylül üçüncü parti kaydı taşınan dört ekranı ve dokunulmayan bulguları birlikte söyler", () => {
    const update = ADMIN_UPDATES.find(
      ({ id }) => id === "20260913-dort-domain-daha-api-katmanina-tasindi",
    );
    const detail = update?.items.join(" ") ?? "";

    // Taşınan dört ekran adıyla geçmeli — biri düşerse duyuru eksik kalır.
    expect(detail).toContain("Hoş Geldin Paketi");
    expect(detail).toContain("Hizmet Talebi");
    expect(detail).toContain("Kaynak/Link yöneticisi");
    expect(detail).toContain("Mesaj Kutusu");

    // Davranış değiştirmediği açıkça söylenmeli — "taşıma" ile "düzeltme" karışmasın.
    expect(detail).toContain("BİLEREK DOKUNULMAYAN BİR KUSUR");

    // Denetim hatası (yanlış pozitif) dürüstçe yazılmalı.
    expect(detail).toContain("hoş geldin mailinde kullanılıyormuş");

    // Kullanıcı kararı ("dokunma, rapor et") kayda geçmeli — silme YAPILMADI.
    expect(detail).toContain("şimdilik dokunma, sadece rapor et");
    expect(detail).toContain("İKİ ESKİ YEDEK KLASÖRÜ BULUNDU");
  });

  it("13 Eylül ikinci parti kaydı tip denetimi borcunun sıfırlandığını ölçümle söyler", () => {
    const update = ADMIN_UPDATES.find(({ id }) => id === "20260913-tip-denetimi-borcu-sifira-indi");
    const detail = update?.items.join(" ") ?? "";

    // Sayı dizisi (109→...→0) duyuruda geçmeli, "düzeltildi" demek yetmez.
    expect(detail).toContain("109");
    expect(detail).toContain("SIFIRA indi");

    // Sponsorlu kart bulgusu bilerek dokunulmadan bırakıldı — bu açıkça yazılmalı.
    expect(detail).toContain("ŞİMDİLİK dokunulmadı");

    // Kapatılamayan araştırma dürüstçe "bulunamadı" diye yazılmalı, "çözüldü" değil.
    expect(detail).toContain("BULUNAMADI");
  });

  it("13 Eylül ilk parti kaydı unutulmuş çalışma kopyasını ve çelişki bulgusunu söyler", () => {
    const update = ADMIN_UPDATES.find(
      ({ id }) => id === "20260913-worktree-kurtarma-async-cafe-ve-gozle-denetim",
    );
    const detail = update?.items.join(" ") ?? "";

    expect(detail).toContain("CAFE ODALARI ARTIK GÜNLERCE AÇIK KALIYOR");
    expect(detail).toContain("TEPKİ SEÇENEKLERİ 5'TEN 3'E İNDİ");

    // Çelişki bulgusu ("Canlı" derken altı "asenkron" diyordu) adıyla geçmeli.
    expect(detail).toContain("GÖZLE DENETİMDE GERÇEK BİR ÇELİŞKİ BULUNDU");
    expect(detail).toContain("'Canlı' yazısı 'Açık' olarak düzeltildi");
  });

  it("WhatsApp grup kaydı 'zaten yapılmış' bulgusunu ve ölçümleri birlikte söyler", () => {
    const update = ADMIN_UPDATES.find(({ id }) => id === "20260910-whatsapp-grup-maddeleri");
    const detail = update?.items.join(" ") ?? "";

    // ⚠️ Kaydın ASIL değeri bu: maddeler "yapılacak iş" diye yazılmıştı ama özellik
    // canlıda çalışıyor. Bu cümle düşerse yapılmış iş yeniden yaptırılır.
    expect(detail).toContain("BU BEŞ MADDE ZATEN YAPILMIŞ");
    expect(detail).toContain("CANLIDA ÇALIŞIYOR");

    // Sorular bu ölçümlere dayanıyor; ölçüm düşerse sorular dayanaksız kalır.
    expect(detail).toContain("10'unda şehir alanı 'Genel'");
    expect(detail).toContain("GCC-Global");
    expect(detail).toContain("tek bir tane bile yok");

    // Kapsam: 9 madde × 6 soru. Sayı duyuruda geçmeli, "sorular eklendi" yetmez.
    expect(detail).toContain("54 soru");

    // Todo'ların silinmediği açıkça yazılmalı — okuyan kişi kaybolduğunu sanmasın.
    expect(detail).toContain("TODO'LAR SİLİNMEDİ");
  });

  it("10 Eylül kaydı kök nedeni, ölçümü ve doğrulanmamış olanı birlikte söyler", () => {
    const update = ADMIN_UPDATES.find(({ id }) => id === "20260910-gorsel-dil-ve-acil-liste");
    const detail = update?.items.join(" ") ?? "";

    // Günün kök teşhisi tek tek kusurlar değil, kuralsızlıktı. Ölçülen iki sayı
    // (9 yarıçap · 13 rozet) duyurunun kanıtı — düşerse duyuru iddiaya döner.
    expect(detail).toContain("DOKUZ farklı köşe yuvarlaklığı");
    expect(detail).toContain("ONÜÇ farklı rozet stili");

    // Erişilebilirlik düzeltmesi ölçümle anlatılmalı, "iyileştirildi" ile değil.
    expect(detail).toContain("2.56");
    expect(detail).toContain("4.5");

    // Radar maddesi bu turun en önemli bulgusu: "kapalı" sanılan iş aslında
    // yedi haftadır sessizce bozuk. Duyurudan düşerse yanlış iş planlanır.
    expect(detail).toContain("20 Temmuz'dan beri");

    // Kendi kusurumu kendim buldum — bunu duyurudan çıkarmak, düzeltmeyi
    // hiç olmamış bir sorunun çözümü gibi göstermek olur.
    expect(detail).toContain("BİR KUSURU KENDİM YAPIP KENDİM BULDUM");

    // ⚠️ Gün boyunca yapılan işin tamamı görsel; otomatik test yerleşimi ölçemez.
    expect(detail).toContain("GÖZLE KONTROL BEKLİYOR");
  });

  it("9 Eylül kaydı ölçümü, kapsamı ve DOĞRULANMAMIŞ olanı birlikte söyler", () => {
    const update = ADMIN_UPDATES.find(({ id }) => id === "20260909-cadde-sadelestirme");
    const detail = update?.items.join(" ") ?? "";

    // Günün asıl işi: boş şehirde çıkmaz yerine dolu bir alternatif.
    expect(detail).toContain("BOŞ ŞEHİRDE ARTIK ÇIKMAZ YOK");
    // İddia değil ölçüm: %83 rakamı canlı veriden geldi, duyuruda da geçmeli.
    expect(detail).toContain("58 şehrimizin yalnız 10'unda");

    // Ekranda duran yanlış cümlenin kaldırıldığı duyurulmalı — kullanıcı ona
    // güvenip bekliyordu.
    expect(detail).toContain("EKRANDA DURAN BİR YANLIŞ CÜMLE KALDIRILDI");

    // ⚠️ EN ÖNEMLİ İDDİA: gün boyu yapılan iş görsel ve gözle görülmedi.
    // Bunu duyurudan düşürmek, doğrulanmamış işi doğrulanmış gibi sunmak olur.
    expect(detail).toContain("GÖZLE KONTROL BEKLİYOR");
    expect(detail).toContain("ekranda ölçülmedi");
  });

  it("geriye dönük kaydı 'ne zaman yapıldı / şu an canlı mı' sorularını kapatarak yazar", () => {
    const update = ADMIN_UPDATES.find(({ id }) => id === "20260907-atlanan-uc-duzeltme");
    const detail = update?.items.join(" ") ?? "";

    // Bu kayıt 5 Eylül işini 7 Eylül'de duyuruyor. Tarih farkı açıklanmazsa okuyan
    // kişi "bugün mü bozuldu?" diye okur — geriye dönük olduğu ilk maddede yazmalı.
    expect(detail).toContain("BU KAYIT NEDEN GERİYE DÖNÜK");
    // Yayın durumu ölçülerek yazıldı; "muhtemelen canlıdadır" demek bu repoda
    // tekrar eden bir yanılgı sınıfı (bkz. canlı bundle doğrulaması).
    expect(detail).toContain("TAHMİN DEĞİL, ÖLÇÜLDÜ");

    // Üç düzeltmenin her biri adıyla geçmeli; biri düşerse duyuru eksik kalır.
    expect(detail).toContain("DİZİN ARAMASINDA YÖNETİCİ HESABI ÇIKIYORDU");
    expect(detail).toContain("TAŞINMA TESTİ SONUCUNDAKİ DÜĞMELER TIKLANMIYORDU");
    expect(detail).toContain("CAFE BAŞLIĞI ARTIK HANGİ KONUMU GÖSTERDİĞİNİ SÖYLÜYOR");

    // Kapatılmamış iş dürüstçe yazılmalı: tıklama ölçümü hâlâ beslenmiyor.
    expect(detail).toContain("canlıda henüz üretilmiyor");
    // Ölçüm yerine şablon bırakılmış olmasın.
    expect(detail).not.toContain("KONTROL_TEST_SAYISI");
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

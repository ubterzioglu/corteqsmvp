import { describe, expect, it } from "vitest";

import { ADMIN_UPDATES } from "./admin-updates";

describe("ADMIN_UPDATES", () => {
  // Yeni kayıt EN ÜSTE eklenir: okunmamış rozeti ve /admin/about sıralaması bu
  // sıraya güvenir. Kimlikler benzersiz olmalı — okundu takibi id ile yapılır.
  // Not: bu test eskiden en üstteki kaydın id'sini SABİT yazıyordu. O hâliyle
  // sıralamayı hiç ölçmüyordu; yalnızca "birisi yeni kayıt ekleyince testi de
  // güncelledi mi" diye soruyordu ve her duyuruda kırılıyordu (19 Eylül'de de
  // kırıldı). Kontrol, maddenin gerçek sözleşmesine çevrildi: id'ler YYYYMMDD
  // önekiyle başlar, liste bu önege göre azalan sıradadır ve id'ler benzersizdir.
  it("kayıtları en yeniden eskiye sıralar ve kimlikleri benzersizdir", () => {
    const ids = ADMIN_UPDATES.map((update) => update.id);

    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(id).toMatch(/^\d{8}-/);
    }

    const dayOf = (id: string) => id.slice(0, 8);
    for (let i = 1; i < ids.length; i += 1) {
      // Aynı gün birden çok kayıt olabilir; bu yüzden ">=" değil "<=" ile geriye bakılır.
      expect(dayOf(ids[i]) <= dayOf(ids[i - 1])).toBe(true);
    }

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("14 Eylül toplu özet kaydı kapanan todo'ları sayar ama 'yapıldı' sanılmasını ENGELLER", () => {
    const update = ADMIN_UPDATES.find(
      ({ id }) => id === "20260914-13-eylul-toplu-ozet-ve-kapanan-todolar",
    );
    const detail = update?.items.join(" ") ?? "";

    // ⚠️ EN KRİTİK CÜMLE: 57 madde "kapandı" ≠ 57 iş yapıldı. Bir kısmı
    // "artık geçerli değil" denilerek kapatıldı. Bu uyarı düşerse duyuru
    // olduğundan çok daha fazla iş bitmiş gibi okunur.
    expect(detail).toContain("57 İŞ YAPILDI DEMEK DEĞİL");
    expect(detail).toContain("artık geçerli değil");

    // Üç grubun sayısı ayrı ayrı yazılmalı: 22 yapıldı + 21 iptal + 12 birleşti.
    // Tek bir "57 kapandı" rakamı bu ayrımı gizler.
    expect(detail).toContain("22 madde GERÇEKTEN YAPILDI");
    expect(detail).toContain("21 madde 'artık geçerli değil' denilerek İPTAL EDİLDİ");
    expect(detail).toContain("12 madde de benzerleriyle tek maddede BİRLEŞTİRİLDİ");

    // Üç grubun madde madde dökümü de bulunmalı — özet sayı yetmez.
    expect(detail).toContain("A GRUBU");
    expect(detail).toContain("B GRUBU");
    expect(detail).toContain("C GRUBU");

    // İptal edilenlerin YAPILMADIĞI açıkça yazılmalı.
    expect(detail).toContain("Bunlar YAPILMADI");

    // Kapatılanların kalıcı silinmediği ve gerekçe dosyasının yeri yazılmalı.
    expect(detail).toContain("docs/notes/2026-09-13-komuta-merkezi-iptal-edilenler.md");
    expect(detail).toContain("yeniden açılabilir");

    // Hiç duyurulmamış güvenlik düzeltmesi bu kaydın asıl katkılarından biri.
    expect(detail).toContain("GHSA-w9m9-85wc-3x92");

    // Açık kalan 11 maddenin gerekçeli olduğu yazılmalı — "hepsi bitti" sanılmasın.
    expect(detail).toContain("AÇIK KALAN 11 MADDE");

    // Devir notunun adı ve içindeki en değerli bilgi (üç sessiz kırılma) geçmeli.
    expect(detail).toContain("docs/handover/2026-09-13-buyuk-dosya-temizligi.md");
    expect(detail).toContain("ÜÇ SESSİZ KIRILMA NOKTASI");

    // Yanlış ölçümün düzeltildiği dürüstçe yazılmalı.
    expect(detail).toContain("ölçüm YANLIŞTI");

    // ⚠️ Hiçbiri canlıda değil ve gözle görülmedi.
    expect(detail).toContain("HENÜZ CANLIDA DEĞİL");
  });

  // Panel (AdminUpdatesCard + /admin/about) kayıtları DÜZ METİN olarak çizer,
  // markdown render ETMEZ. `**kalın**` yazarsan ekranda yıldızlar görünür.
  // 14.09.2026'da tam olarak bu oldu ve ancak görsel QA ekran görüntüsünde fark
  // edildi — hiçbir otomatik test yakalamıyordu, bu yüzden buraya kilitlendi.
  it("hiçbir kayıtta markdown işareti bırakmaz (panel düz metin çizer)", () => {
    const offenders = ADMIN_UPDATES.flatMap((update) =>
      [update.title, ...update.items]
        .filter((text) => text.includes("**") || /(^|\s)__\S/.test(text))
        .map((text) => `${update.id}: ${text.slice(0, 80)}`),
    );

    expect(offenders).toEqual([]);
  });

  it("13 Eylül sekizinci parti kaydı büyük dosya temizliğini ve YAPILMAYANI birlikte söyler", () => {
    const update = ADMIN_UPDATES.find(({ id }) => id === "20260913-buyuk-dosya-temizligi");
    const detail = update?.items.join(" ") ?? "";

    // Ölçüm duyurunun kanıtı: "iyileştirildi" demek yetmez, sayı geçmeli.
    expect(detail).toContain("16.615");
    expect(detail).toContain("13'ten 5'e");

    // ⚠️ EN KRİTİK CÜMLE: bu bir düzenleme işiydi. Bu düşerse okuyan kişi
    // ekranlarda bir değişiklik arar ve bulamayınca "yapılmamış" sanır.
    expect(detail).toContain("KULLANICI TARAFINDA HİÇBİR ŞEY DEĞİŞMEDİ");

    // Testin yakalayamadığı üç sessiz arıza sınıfı duyuruda kalmalı.
    expect(detail).toContain("ÜÇ SESSİZ ARIZA ÖNLENDİ");

    // Kendi ölçüm hatalarım duyurudan düşerse, düzeltme hiç olmamış bir
    // sorunun çözümü gibi görünür.
    expect(detail).toContain("KENDİ ÖLÇÜM HATALARIM");

    // Cadde'ye bilerek dokunulmadığı yazılmalı — yoksa "unutulmuş" sanılır.
    expect(detail).toContain("KASITEN ellenmedi");

    // ⚠️ Taşımanın hiçbiri tarayıcıda görülmedi; bunu duyurudan çıkarmak
    // doğrulanmamış işi doğrulanmış gibi sunmak olur.
    expect(detail).toContain("GÖZLE KONTROL VE YAYIN BEKLİYOR");
  });

  it("13 Eylül yedinci parti kaydı Cadde WS1/WS2/WS3 workshop kapanışını ölçümle söyler", () => {
    const update = ADMIN_UPDATES.find(({ id }) => id === "20260913-workshop-panolari-tamamen-kapandi");
    const detail = update?.items.join(" ") ?? "";

    // Kapsam: 56 maddenin tamamı, sadece 1 tanesi (m134) bilerek açık kaldı.
    expect(detail).toContain("56 workshop maddesinin");
    expect(detail).toContain("BİLEREK DOKUNULMADI");

    // Kod kanıtıyla soru sormadan kapatılan iki madde: telefona göre DEĞİL,
    // ülke bilgisine göre çalıştığı açıkça yazılmalı — aksi hâlde bilinen
    // "+90 numaralı üye Berlin'de yaşıyor olabilir" tuzağı tekrar ediyormuş sanılır.
    expect(detail).toContain("TELEFON NUMARASINA GÖRE DEĞİL");
    expect(detail).toContain("is_tr_resident");

    // Yeni Komuta Merkezi todo'suna taşınan üç madde adıyla geçmeli.
    expect(detail).toContain("Proje kütüphanesi + NDA erişim yapısı + takım eşleştirme");

    // Dürüst not: üretim kodu değişmedi, sadece DB kayıtları.
    expect(detail).toContain("üretim kodu değişmedi");
  });

  it("13 Eylül altıncı parti kaydı 76 maddelik triyajın sonucunu ölçümle söyler", () => {
    const update = ADMIN_UPDATES.find(({ id }) => id === "20260913-komuta-merkezi-76-madde-triyaji");
    const detail = update?.items.join(" ") ?? "";

    // Sayılar (21 + 55 = 76, sonuçta 91 tamamlandı / 20 açık) ölçülmüş olmalı.
    expect(detail).toContain("21 MADDE GERÇEK KANITLA KAPATILDI");
    expect(detail).toContain("35 madde 'artık geçerli değil' denip kapatıldı");
    expect(detail).toContain("12 MADDE 'HÂLÂ GEÇERLİ' ONAYI ALDI");
    expect(detail).toContain("20 MADDE GEREKÇELİ OLARAK AÇIK KALDI");

    // İptal edilenlerin kalıcı silinmediği, gerekçe dosyasının varlığı acıkça yazılmalı.
    expect(detail).toContain("docs/notes/2026-09-13-komuta-merkezi-iptal-edilenler.md");
    expect(detail).toContain("kalıcı olarak reddedilmiş değil");
  });

  it("13 Eylül beşinci parti kaydı Radar tanısını ve Komuta Merkezi temizliğini ölçümle söyler", () => {
    const update = ADMIN_UPDATES.find(
      ({ id }) => id === "20260913-acil-liste-radar-tamiri-ve-komuta-merkezi-temizligi",
    );
    const detail = update?.items.join(" ") ?? "";

    // Radar bulgusu bu partinin en önemli maddesi — kök neden ve ölçüm ("20 Temmuz")
    // duyurudan düşerse yanlış anlaşılır (sanki hâlâ araştırılıyor gibi okunur).
    expect(detail).toContain("RADAR 2 AYDIR SESSİZCE BOZUKMUŞ");
    expect(detail).toContain("20 Temmuz'dan beri");
    expect(detail).toContain("yarın sabahki (05:00) gerçek çalışmayla doğrulanacak");

    // Sayı (21 madde) ölçülmüş olmalı, "birkaç madde kapatıldı" demek yetmez.
    expect(detail).toContain("21 MADDE");

    // Dokunulmayan 55 maddenin nedeni dürüstçe yazılmalı — hepsi bitti sanılmasın.
    expect(detail).toContain("GERİYE KALAN 55 MADDE BİLEREK DOKUNULMADI");
    expect(detail).toContain("hâlâ canlıda kapalı");
  });

  it("13 Eylül dördüncü parti kaydı taşınan sekiz ekranı ve Komuta Merkezi senkronunu söyler", () => {
    const update = ADMIN_UPDATES.find(
      ({ id }) => id === "20260913-on-madde-daha-ve-komuta-merkezi-senkronu",
    );
    const detail = update?.items.join(" ") ?? "";

    expect(detail).toContain("MVP Yapısal Liste");
    expect(detail).toContain("Referral");
    expect(detail).toContain("GÖZLE GÖRÜNÜR HİÇBİR DEĞİŞİKLİK YOK");

    // Komuta Merkezi karar maddesinin kapatıldığı açıkça yazılmalı.
    expect(detail).toContain("KOMUTA MERKEZİ'NDE BİR KARAR MADDESİ KAPATILDI");
    expect(detail).toContain("Tamamlandı");

    // Burak'ın kendi onayının beklediği ve madde 134'ün hâlâ açık olduğu dürüstçe yazılmalı.
    expect(detail).toContain("Burak'ın kendi onay kutusu bekliyor");
    expect(detail).toContain("madde 134");
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

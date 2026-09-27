-- Seed ek: 17 Eylül 2026 (T22) — toplantının GERÇEK çıktıları.
--
-- ⚠️ İlk T22 seed'i (20260927120000) bir TRANSKRİPT DEĞİL, konuşma öncesi
-- hazırlanmış SORU listesiydi; o dosyanın kendi başlığında da bu yazılıdır.
-- 27 Eylül'de toplantının resmi çıktı listesi geldi. Bu dosya:
--   (1) hazırlık notundaki üç sorudan CEVAPLANAN ikisini günceller,
--   (2) 7 karar + 9 UBT + 6 Burak maddesini ekler.
-- T22 toplamı: 5 + 22 = 27 satır.
--
-- Cevaplanan sorular:
--   · Profil menüsü  → KARAR: sol dikey menüye geçilecek (mobilde çekmece).
--   · Etkinlik nedir → zaten Tamamlandi işaretliydi, kapsamı kararla netleşti.
--   · Google Auth    → karar ÇIKMADI, UBT'ye "incele ve çöz" işi olarak verildi.
--
-- ⚠️ 28 Eylül toplantısı: Pazartesi, TSİ 13:00 / Almanya 12:00. Ana gündem
--    Cadde–Profil ilişkisi. Bu seed 27 Eylül'de yazıldı, yani toplantı YARIN.

do $$
declare
  v_eklenen int;
begin
  if exists (
    select 1 from public.command_center_items
    where item_type = 'meeting_note'
      and legacy_source_code = 'T22'
      and legacy_source_title = 'KARAR: profil menüsü solda dikey olacak, mobilde çekmece açılacak'
  ) then
    raise notice 'T22 gerçek çıktı seed already present, skipping.';
    return;
  end if;

  -- (1) Hazırlık notundaki soruyu cevabıyla kapat.
  update public.command_center_items
  set status = 'Tamamlandi',
      detail = detail || ' ✅ CEVAPLANDI (17 Eylül toplantısı): sol dikey menüye geçilecek, mobilde çekmece açılacak. Ayrıntı aynı toplantının KARAR satırında.'
  where item_type = 'meeting_note'
    and legacy_source_code = 'T22'
    and legacy_source_title = 'SORU: profil menüsü sola mı taşınsın, telefonda ne görünsün?';

  update public.command_center_items
  set detail = detail || ' ⚠️ Toplantıda KARARA BAĞLANMADI: "ekstra ücret/onay konusunu incele ve çöz" diye UBT''ye iş olarak verildi. Onay hâlâ bekliyor.'
  where item_type = 'meeting_note'
    and legacy_source_code = 'T22'
    and legacy_source_title = 'SORU: Google girişi için aylık ek maliyet onaylanıyor mu?';

  insert into public.command_center_items
    (item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
     legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category, legacy_source_title, sort_order)
  values
    -- ── Kararlar ───────────────────────────────────────────────────────────────
    ('meeting_note', 'KARAR: profil menüsü solda dikey olacak, mobilde çekmece açılacak', 'Masaüstünde yukarıdan aşağıya uzayan akış yerine solda dikey bir menü olacak; tıklanan sekmenin içeriği sağda gösterilecek (yaklaşık %25–%75 yerleşim). Sayfa ilk açıldığında profil fotoğrafı / profil durumu sekmesi seçili gelecek. Mobilde LinkedIn uygulamasındaki gibi isme tıklayınca soldan açılan çekmece kullanılacak.', '17 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'mvp-hedefleri', 'KARAR: profil menüsü solda dikey olacak, mobilde çekmece açılacak', 60),
    ('meeting_note', 'KARAR: Radar ana sayfada "8,8 milyon" bölümünün altına gelecek', 'Radar yeniden çalışır hâle geldiğinde ana sayfada "8,8 milyon Türk" bölümünün hemen altında gösterilecek. Eski haberler silinmeyecek; havuzdaki 135 haberden başlanarak onay mekanizmasıyla radara aktarılacak.', '17 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'mvp-hedefleri', 'KARAR: Radar ana sayfada "8,8 milyon" bölümünün altına gelecek', 70),
    ('meeting_note', 'KARAR: WhatsApp grupları sayfası geri gelecek, tek ülke seçilecek', 'Silinen grup sayfası geri getirilip menüye bağlanacak. Karmaşayı önlemek için çoklu/bölgesel seçim yerine yalnızca tek bir kaynak ülke seçtirilecek, ayrıntılar açıklama alanına bırakılacak. Platform olarak şimdilik yalnız WhatsApp kabul edilecek; Telegram ertelendi.', '17 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'topluluk-yonetimi', 'KARAR: WhatsApp grupları sayfası geri gelecek, tek ülke seçilecek', 80),
    ('meeting_note', 'KARAR: etkinlik motoru hem üye hem platform etkinliklerini taşıyacak', 'Kullanıcılar kendi fiziksel/dijital etkinliklerini ekleyebilecek; platform da şehir etkinliklerini haber akışı gibi duyurabilecek. Sosyal medya paylaşım düğmeleri bulunacak. (Hazırlık notundaki "etkinlik ne olacak?" sorusunun cevabı budur.)', '17 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'mvp-hedefleri', 'KARAR: etkinlik motoru hem üye hem platform etkinliklerini taşıyacak', 90),
    ('meeting_note', 'KARAR: rol başvurusunda belge yüklenmeden onay verilmeyecek', 'Rol başvurusu yapıldığında (ör. danışman) kullanıcıdan lisans, ruhsat veya sertifika isteyen bir açılır pencere çıkacak; bu belgeler yüklenmeden onay verilmeyecek.', '17 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'kullanici-kisitlamalari', 'KARAR: rol başvurusunda belge yüklenmeden onay verilmeyecek', 100),
    ('meeting_note', 'KARAR: 10 gün kapsam dar tutulacak, 28 Eylül''de Cadde–Profil toplantısı', 'Önümüzdeki 10 gün kapsam dar tutulacak ve yarıda kalmış (%50 hazır) özellikler tamamlanacak. 28 Eylül Pazartesi TSİ 13:00 / Almanya 12:00''de Cadde–Profil ilişkisi ana gündemiyle toplanılacak.', '17 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'ekip-ve-isbirligi', 'KARAR: 10 gün kapsam dar tutulacak, 28 Eylül''de Cadde–Profil toplantısı', 110),
    ('meeting_note', 'KARAR: Kurucu 1000 için mozaik tanıtım ve hediye sigorta kurgusu', 'Instagram''da iki satıra yayılan 6 kapaklı mozaik ızgara (carousel) ile kurucu üyeler öne çıkarılacak. Gizli referans kodları ve Can Sigorta üzerinden hediye seyahat sigortası kurgusuyla oyunlaştırma sağlanacak.', '17 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'influencer-partnerlikleri', 'KARAR: Kurucu 1000 için mozaik tanıtım ve hediye sigorta kurgusu', 120),

    -- ── UBT ────────────────────────────────────────────────────────────────────
    ('meeting_note', 'Profil menüsünü sola dikey taşı, mobilde çekmece yap', 'Profil gezinme menüsü sola dikey olarak taşınacak (~%25–%75 yerleşim) ve mobil için soldan açılan çekmece hazırlanacak. Ölçüm 27.09: ProfilePage.tsx''te kolon hâlâ sağda ve sabit, bölüm listesi yok — iş henüz başlamadı.', '17 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'mvp-hedefleri', 'Profil menüsünü sola dikey taşı, mobilde çekmece yap', 130),
    ('meeting_note', 'Google girişindeki marka adı / ek ücret konusunu çöz', 'Google ile girişte kendi marka adımızın görünmesi için gereken eklenti ücreti ve onay konusu incelenip çözülecek. Ölçüm 27.09: rehber yazıldı ama eklenti açılmadı; üye hâlâ proje kimliğini içeren adresi görüyor.', '17 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'ekip-ve-isbirligi', 'Google girişindeki marka adı / ek ücret konusunu çöz', 140),
    ('meeting_note', 'Radar''ı düzelt: anahtarlar, haber havuzu ve ana sayfa yerleşimi', 'API anahtarları kontrol edilecek, gerekirse ücretli bir test aracı ayarlanacak, haber havuzu geriye dönük doldurulacak ve Radar ana sayfadaki ilgili bölüme yerleştirilecek. ⚠️ Ölçüm 27.09: Radar 14 Eylül''den beri ÖLÜ — o tarihte "çalışıyor" durumunda takılı kalmış bir tarama var, günlük iş her sabah başarılı dönüyor ama tek haber üretmiyor.', '17 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, true, 'meeting_notes', 'T22', '17 Eylül 2026', 'mvp-hedefleri', 'Radar''ı düzelt: anahtarlar, haber havuzu ve ana sayfa yerleşimi', 150),
    ('meeting_note', 'WhatsApp grupları sayfasını yayına al ve formu sadeleştir', 'Silinen sayfa yayına alınacak, ana menüye bağlantısı eklenecek, grup ekleme formu tek ülke seçimine indirilecek ve mevcut grup bağlantılarının doğruluğu kontrol edilecek.', '17 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'topluluk-yonetimi', 'WhatsApp grupları sayfasını yayına al ve formu sadeleştir', 160),
    ('meeting_note', 'Etkinlik motorunu yayına hazır hâle getir', 'Kullanıcıların ve yöneticinin fiziksel/dijital ayrıntıları girip paylaşabileceği etkinlik modülü yayına hazırlanacak. Ölçüm 27.09: modül yapıldı, canlıda 1 etkinlik kayıtlı; kapak görseli alanı hâlâ ham adres kutusu.', '17 Eylül 2026', 'UBT', 'Devam ediyor', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'mvp-hedefleri', 'Etkinlik motorunu yayına hazır hâle getir', 170),
    ('meeting_note', 'Kayıt trafiğini izle ve admin bildirimleri ekle', 'Son 15 günde gelen kayıtların (70 tekil kullanıcı) hangi araçlardan geldiği izlenecek; admin paneline bekleyen onaylar ve rol talepleri için bildirim mekanizması eklenecek.', '17 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'mvp-hedefleri', 'Kayıt trafiğini izle ve admin bildirimleri ekle', 180),
    ('meeting_note', 'Rol onayı için belge toplayan açılır form tasarla', 'Rol talebinde bulunan uzmanlardan lisans/ruhsat/sertifika toplayacak açılır pencere formu tasarlanacak. Belge yüklenmeden onay verilmeyecek.', '17 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'kullanici-kisitlamalari', 'Rol onayı için belge toplayan açılır form tasarla', 190),
    ('meeting_note', 'Aslıhan ile Story Engine iş birliği için görüş', 'Aslıhan ile görüşülüp Instagram hikâye akışı ve kategorik diaspora hikâyeleri (Story Engine) iş birliği için nabız yoklanacak.', '17 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'influencer-partnerlikleri', 'Aslıhan ile Story Engine iş birliği için görüş', 200),
    ('meeting_note', 'Burak''ın rol profilleri dokümanını yapay zekâ talimatına ekle', 'Burak''ın ileteceği rol profilleri dokümanı ve istem metni, yapay zekâ asistanının talimatlarına/uzantısına eklenecek. Toplantı notları da Burak''a iletilecek.', '17 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'ekip-ve-isbirligi', 'Burak''ın rol profilleri dokümanını yapay zekâ talimatına ekle', 210),

    -- ── Burak ──────────────────────────────────────────────────────────────────
    ('meeting_note', '28 Eylül toplantısı için takvim daveti gönder', '28 Eylül Pazartesi için Barış''a takvim daveti gönderilecek (Almanya 12:00 / Türkiye 13:00).', '17 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'ekip-ve-isbirligi', '28 Eylül toplantısı için takvim daveti gönder', 220),
    ('meeting_note', 'Cadde–Profil ilişkisi taslağını hazırla', '28 Eylül toplantısına kadar Cadde ile Profil etkileşiminin nasıl çalışacağına dair hazırlık ve inceleme yapılacak. Toplantının ana gündemi budur.', '17 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'mvp-hedefleri', 'Cadde–Profil ilişkisi taslağını hazırla', 230),
    ('meeting_note', 'Katkıcı ekibinden diaspora WhatsApp gruplarını topla', 'Katkıcı (contributor) ekibine mesaj atılıp bildikleri diaspora WhatsApp gruplarını platforma eklemeleri veya iletmeleri istenecek.', '17 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'topluluk-yonetimi', 'Katkıcı ekibinden diaspora WhatsApp gruplarını topla', 240),
    ('meeting_note', 'Can Sigorta ile hediye seyahat sigortası için görüş', 'Can Sigorta''dan Sebi ile görüşülüp Kurucu 1000 kampanyasında kullanılmak üzere ücretsiz veya uygun maliyetli hediye seyahat sigortası imkânı sorulacak.', '17 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'influencer-partnerlikleri', 'Can Sigorta ile hediye seyahat sigortası için görüş', 250),
    ('meeting_note', 'Rol ve görev tanımları dokümanını güncelleyip gönder', 'Şirket içinde ihtiyaç duyulan pozisyon ve rolleri içeren mevcut doküman, güncel istem metniyle birlikte Barış''a gönderilecek.', '17 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'ekip-ve-isbirligi', 'Rol ve görev tanımları dokümanını güncelleyip gönder', 260),
    ('meeting_note', 'Dubai''deki pazarlama uzmanı Tolga ile görüş', 'Dubai''deki pazarlama uzmanı Tolga ile görüşülüp büyüme ve operasyonel destek potansiyeli değerlendirilecek.', '17 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'influencer-partnerlikleri', 'Dubai''deki pazarlama uzmanı Tolga ile görüş', 270);

  get diagnostics v_eklenen = row_count;
  if v_eklenen <> 22 then
    raise exception 'T22 gerçek çıktı seed 22 satır eklemeliydi, % eklendi.', v_eklenen;
  end if;

  if (
    select count(*) from public.command_center_items
    where item_type = 'meeting_note' and legacy_source_date_label = '17 Eylül 2026'
  ) <> 27 then
    raise exception 'T22 toplamı 27 satır olmalıydı.';
  end if;
end
$$;

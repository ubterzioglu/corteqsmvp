-- Seed: 24 Ağustos 2026 toplantısı (Zoom/Fathom) -> command_center_items (item_type=meeting_note)
-- Source meeting: T17 (24 Ağustos 2026). T16 = 19 Haziran zaten kullanımda.
-- Assignee mapping: UBT'nin kendi maddeleri -> UBT, Burak'ın kendi maddeleri -> Burak.
-- Kategori: tamamı operasyonel/koordinasyon içerikli, mevcut 9 kategoriden en yakını
-- 'ekip-ve-isbirligi' (T16'da aynı amaçla kullanıldı). Status: Baslanmadi. 12 rows.
-- Idempotent guard on legacy_source_date_label.

do $$
begin
  if exists (
    select 1 from public.command_center_items
    where item_type = 'meeting_note'
      and legacy_source_date_label = '24 Ağustos 2026'
  ) then
    raise notice 'T17 (24 Ağustos 2026) seed already present, skipping.';
    return;
  end if;

  insert into public.command_center_items
    (item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
     legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category, legacy_source_title, sort_order)
  values
    -- ── Umut Barış Terzioğlu (UBT) ─────────────────────────────────────────────
    ('meeting_note', 'PFA sitesi test sürecini Şahin''e yönlendir', 'Burak''tan PFA sitesinin giriş bilgilerini (credentials) al ve UI/güvenlik testleri için Şahin''e ilet. Karar: acele edilmemesine, Şahin''in uygun bir zamanda incelemesine karar verildi.', '24 Ağustos 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T17', '24 Ağustos 2026', 'ekip-ve-isbirligi', 'PFA sitesi test sürecini Şahin''e yönlendir', 10),
    ('meeting_note', 'Payal BI taşımasını Halil''e devret', 'Payal BI sitesinin kendi sunucularına (Doruk hosting) aktarılması ve WordPress taşıma işlemi için UBT''nin tanıdığı Halil ile iletişime geç ve süreci ona delege et.', '24 Ağustos 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T17', '24 Ağustos 2026', 'ekip-ve-isbirligi', 'Payal BI taşımasını Halil''e devret', 20),
    ('meeting_note', '26 Ağustos toplantısı için Cadde durum raporu hazırla', '26 Ağustos Çarşamba (13:00, TR saati) checkpoint toplantısı için Cadde projesinin durum raporunu hazırla ve Burak''a verilecek GitHub eğitiminin ön hazırlığını yap.', '24 Ağustos 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T17', '24 Ağustos 2026', 'ekip-ve-isbirligi', '26 Ağustos toplantısı için Cadde durum raporu hazırla', 30),
    ('meeting_note', '28 Ağustos toplantısı için profil değerlendirmesini hazırla', '28 Ağustos Cuma (13:00, TR saati) checkpoint toplantısı için profillerle ilgili değerlendirmeyi yap ve Burak''a durum raporunu HTML/kod formatında sun.', '24 Ağustos 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T17', '24 Ağustos 2026', 'ekip-ve-isbirligi', '28 Ağustos toplantısı için profil değerlendirmesini hazırla', 40),
    ('meeting_note', 'Çarşamba/Cuma toplantıları için Zoom davetiyesi gönder', 'Belirlenen Çarşamba (26 Ağustos) ve Cuma (28 Ağustos) checkpoint toplantıları için Burak''a Zoom davetiyelerini gönder ve güncel toplantı kaydını ortak alana (shared drive) yükle.', '24 Ağustos 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T17', '24 Ağustos 2026', 'ekip-ve-isbirligi', 'Çarşamba/Cuma toplantıları için Zoom davetiyesi gönder', 50),
    ('meeting_note', 'Burak''ı Cortex reposuna bağla', 'Burak''ı GitHub Cortex reposuna bağla ve onun üzerinden durum raporu iletebileceği bir sistem kur.', '24 Ağustos 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T17', '24 Ağustos 2026', 'ekip-ve-isbirligi', 'Burak''ı Cortex reposuna bağla', 60),

    -- ── Burak Akcakanat ─────────────────────────────────────────────────────────
    ('meeting_note', 'PFA giriş bilgilerini UBT''ye gönder', 'PFA sitesinin giriş bilgilerini (credentials) UBT''ye gönder.', '24 Ağustos 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T17', '24 Ağustos 2026', 'ekip-ve-isbirligi', 'PFA giriş bilgilerini UBT''ye gönder', 70),
    ('meeting_note', 'Payal BI hosting süresini 1 ay uzat', 'Taşıma işlemleri tamamlanana kadar zaman kazanmak için Payal BI''ın Doruk hosting üzerinden 1 aylık ek süresini satın al; site taşıma sürecinde kapanmasın.', '24 Ağustos 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T17', '24 Ağustos 2026', 'ekip-ve-isbirligi', 'Payal BI hosting süresini 1 ay uzat', 80),
    ('meeting_note', 'ChatGPT ortak hesabında %50 kuralına uy', 'Paylaşımlı ChatGPT (Cloud 200) hesabı bir ay daha denenecek. Kotanın çabuk dolması problemine karşı belirlenen %50''lik kullanım limitine dikkat ederek kullanıma devam et; verim alınamazsa hesaplar ayrılacak.', '24 Ağustos 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T17', '24 Ağustos 2026', 'ekip-ve-isbirligi', 'ChatGPT ortak hesabında %50 kuralına uy', 90),
    ('meeting_note', 'Profil geri bildirimlerini Notepad dosyasına yaz', 'Profillerle ilgili yaptığın inceleme sonrası gözüne batan hata veya eksikleri bir Notepad (To-Do) dosyası halinde UBT''ye ilet.', '24 Ağustos 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T17', '24 Ağustos 2026', 'ekip-ve-isbirligi', 'Profil geri bildirimlerini Notepad dosyasına yaz', 100),
    ('meeting_note', '27 Ağustos toplantısı için teknoloji giderleri tablosunu hazırla', '27 Ağustos Perşembe (13:00, TR saati) checkpoint toplantısı için teknoloji giderleri bütçe tablosunu (HTML raporu) hazır bulundur.', '24 Ağustos 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T17', '24 Ağustos 2026', 'ekip-ve-isbirligi', '27 Ağustos toplantısı için teknoloji giderleri tablosunu hazırla', 110),
    ('meeting_note', 'WhatsApp gruplarına içerik yükleme hatırlatması gönder', 'WhatsApp gruplarındaki üyelere siteye içerik yüklemeleri ve link paylaşmaları konusunda tekrar bilgilendirme mesajı geç.', '24 Ağustos 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T17', '24 Ağustos 2026', 'ekip-ve-isbirligi', 'WhatsApp gruplarına içerik yükleme hatırlatması gönder', 120);

end
$$;

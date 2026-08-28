-- Seed: 27 Ağustos 2026 toplantısı -> command_center_items (item_type=meeting_note)
-- Source meeting: T18 (27 Ağustos 2026). T17 = 24 Ağustos zaten kullanımda.
-- Assignee mapping: UBT'nin kendi maddeleri -> UBT, Burak'ın kendi maddeleri -> Burak.
-- 9 yapılacak (Baslanmadi) + 3 karar kaynaklı kapsam maddesi (Beklemede) = 12 satır.
-- Kategori (legacy_source_category) mevcut 9 MEETING_CATEGORIES içinden seçildi.
-- Idempotent guard on legacy_source_date_label.
--
-- Toplantının kararları (madde detaylarına işlendi):
--   * İnsanları Keşfet + Aktif Kafeler akışta yukarı taşınacak.
--   * Kafelerde instant chat YOK; yapı asenkron forum/feed olarak kalacak.
--   * Kafe arka plan temaları DB'den çekilmeyecek, hardcoded 3-4 sabit seçenek olacak.
--   * Jukebox kalacak ama ayrı modül olarak geliştirilip sonradan gömülecek.
--   * Çarşı (pazar yeri) lansman kapsamından çıkarıldı, ertelendi.
--   * Cadde + Profiller oturmadan dış pazarlama (Instagram reklamı) yapılmayacak.
--   * Reklam modeli: banner değil, in-feed sponsorlu içerik.
--   * Haftada en az 1, en fazla 3 toplantı; bir sonraki toplantı "Profiller" üzerine.

do $$
begin
  if exists (
    select 1 from public.command_center_items
    where item_type = 'meeting_note'
      and legacy_source_date_label = '27 Ağustos 2026'
  ) then
    raise notice 'T18 (27 Ağustos 2026) seed already present, skipping.';
    return;
  end if;

  insert into public.command_center_items
    (item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
     legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category, legacy_source_title, sort_order)
  values
    -- ── Umut Barış Terzioğlu (UBT) ─────────────────────────────────────────────
    ('meeting_note', 'Cadde ana sayfasında bileşen sıralamasını değiştir', 'İnsanları Keşfet (arkadaş arama) ve Aktif Kafeler bölümlerini akışta yukarı, kullanıcının ilk göreceği alana taşı. Karar: bu iki blok kullanıcı deneyimi açısından sayfanın üst kısmında yer alacak.', '27 Ağustos 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T18', '27 Ağustos 2026', 'mvp-hedefleri', 'Cadde ana sayfasında bileşen sıralamasını değiştir', 10),
    ('meeting_note', 'Kafe giriş akışındaki yenileme (refresh) sorununu optimize et', 'Onaylı ve parolalı kafe girişlerinde (kapı parolası mantığı) UI/UX tarafındaki anlık sayfa yenileme sorunlarını gider. Karar: anlık sohbet (instant chat) eklenmeyecek; moderasyon yükü (küfür, spam şikayetleri) nedeniyle yapı şimdilik asenkron forum/feed mantığında kalacak.', '27 Ağustos 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T18', '27 Ağustos 2026', 'mvp-hedefleri', 'Kafe giriş akışındaki yenileme (refresh) sorununu optimize et', 20),
    ('meeting_note', 'Jukebox''ı ayrı modül olarak kur', 'Jukebox özelliği platformda tutulacak ancak ayrı bir modül olarak geliştirilip sisteme sonradan gömülecek. Kodlamaya başlamadan önce Burak''tan gelecek kullanıcı senaryolarını bekle ve altyapıyı buna göre kur.', '27 Ağustos 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T18', '27 Ağustos 2026', 'mvp-hedefleri', 'Jukebox''ı ayrı modül olarak kur', 30),
    ('meeting_note', 'Kafeden ana akışa dönüş butonunu ekle', 'Kafelerin içinden Cadde ana akışına dönmeyi sağlayan "Geri Dön" butonunu sayfanın uygun yerlerine (özellikle alt kısma) entegre et.', '27 Ağustos 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T18', '27 Ağustos 2026', 'mvp-hedefleri', 'Kafeden ana akışa dönüş butonunu ekle', 40),
    ('meeting_note', 'Cadde workshop panosunda açık kalan maddeleri kapat', 'Hafta sonu mesaisini kullanarak Cadde workshop dosyasındaki açık kalan (AI''ın tam çözemediği veya eksik kalan) maddeleri tek tek test edip kapat.', '27 Ağustos 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T18', '27 Ağustos 2026', 'mvp-hedefleri', 'Cadde workshop panosunda açık kalan maddeleri kapat', 50),
    ('meeting_note', 'Çarşı (ikinci el) modülünü lansman kapsamı dışına al', 'Karar: Çarşı / pazar yeri konsepti Almanya''daki yasal mevzuat, dolandırıcılık ve para aklama regülasyonu riskleri nedeniyle lansman kapsamından çıkarıldı ve ileri bir tarihe ertelendi.', '27 Ağustos 2026', 'UBT', 'Beklemede', 5, null, false, 'meeting_notes', 'T18', '27 Ağustos 2026', 'mvp-hedefleri', 'Çarşı (ikinci el) modülünü lansman kapsamı dışına al', 60),
    ('meeting_note', 'Reklam modelini in-feed sponsorlu içeriğe göre kurgula', 'Karar: eski tip sağ/sol kolon banner reklamları kullanılmayacak; Instagram akışına benzer şekilde araya giren sponsorlu içerik (in-feed) modeli uygulanacak.', '27 Ağustos 2026', 'UBT', 'Beklemede', 5, null, false, 'meeting_notes', 'T18', '27 Ağustos 2026', 'reklam-modeli', 'Reklam modelini in-feed sponsorlu içeriğe göre kurgula', 70),

    -- ── Burak Akcakanat ─────────────────────────────────────────────────────────
    ('meeting_note', 'Site ikonlarını SVG formatında hazırla', 'Site içinde kullanılacak özel ikonları, siteyi yormaması (yükleme hızını etkilememesi) için JPG/PNG yerine SVG (grafik kod) formatında hazırla.', '27 Ağustos 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T18', '27 Ağustos 2026', 'mvp-hedefleri', 'Site ikonlarını SVG formatında hazırla', 80),
    ('meeting_note', 'Kafeler için 3 arka plan teması hazırla', 'Kafelerde kullanılacak 3 farklı arka plan (tema) görselini (tüten kahve bardağı, nota vb.) hazırlayıp UBT''ye ilet. Karar: görseller her kullanıcı girişinde veritabanından çekilmeyecek; sunucu maliyetini korumak için sisteme gömülü (hardcoded) 3-4 sabit tema olarak sunulacak.', '27 Ağustos 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T18', '27 Ağustos 2026', 'mvp-hedefleri', 'Kafeler için 3 arka plan teması hazırla', 90),
    ('meeting_note', 'Jukebox kullanıcı senaryolarını yaz ve UBT''ye gönder', 'Jukebox özelliğinin tam olarak nasıl çalışması gerektiğine dair tüm kullanıcı senaryolarını (user scenarios) adım adım yazarak UBT''ye gönder.', '27 Ağustos 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T18', '27 Ağustos 2026', 'mvp-hedefleri', 'Jukebox kullanıcı senaryolarını yaz ve UBT''ye gönder', 100),
    ('meeting_note', 'Profiller toplantısı için ön hazırlığı tamamla', 'Bir sonraki toplantı "Profiller" üzerine olacak. Bu toplantı için ön hazırlık ve tasarım gözden geçirmelerini tamamla.', '27 Ağustos 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T18', '27 Ağustos 2026', 'ekip-ve-isbirligi', 'Profiller toplantısı için ön hazırlığı tamamla', 110),
    ('meeting_note', 'Cadde ve Profiller hazır olana dek dış pazarlamayı durdur', 'Karar: erken gelen kullanıcıları (early birds) hayal kırıklığına uğratmamak için Cadde, Profiller ve site içi araçlar tam oturmadan masif sosyal medya (Instagram reklamı vb.) pazarlaması yapılmayacak. Ölçüm: hiç reklam yapılmadan son 90 günde ~1.300 ziyaretçi (Microsoft Clarity).', '27 Ağustos 2026', 'Burak', 'Beklemede', 5, null, false, 'meeting_notes', 'T18', '27 Ağustos 2026', 'topluluk-yonetimi', 'Cadde ve Profiller hazır olana dek dış pazarlamayı durdur', 120);

end
$$;

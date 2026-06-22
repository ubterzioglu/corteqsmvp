-- Seed: 12 Haziran 2026 Zoom toplantısı (Burak <-> Barış / Fathom) -> command_center_items
-- Source: T15 (12 Haziran 2026). item_type=meeting_note. status=Baslanmadi (açık).
-- Assignee mapping: Barış -> UBT, Burak -> Burak, ortak/karar -> Atanmadi.
-- 21 satır (16 aksiyon + 5 karar). Idempotent guard: legacy_source_date_label = '12 Haziran 2026'.
-- NOT: legacy_source_title unique index'i nedeniyle her başlık 'T15 · ' önekiyle benzersiz.

do $$
begin
  if exists (
    select 1 from public.command_center_items
    where item_type = 'meeting_note'
      and legacy_source_code = 'T15'
      and legacy_source_date_label = '12 Haziran 2026'
  ) then
    raise notice 'meeting15 (T15 / 12 Haziran 2026) seed already present, skipping.';
    return;
  end if;

  insert into public.command_center_items
    (item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
     legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category, legacy_source_title, sort_order)
  values
    -- Profil & Onboarding
    ('meeting_note', 'Chatbot kaydını kaldır, tek kayıt yolu üstteki Kaydol olsun', 'Aşağıdaki chatbot üzerinden kayıt alımını kaldır; karmaşa olmasın diye tek kayıt yolu sayfanın üstündeki Kaydol butonu olsun. Friction sıfıra inecek: bas ve kayıt ol.', '12 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'kullanici-kisitlamalari', 'T15 · Chatbot kaydını kaldır, tek kayıt yolu üstteki Kaydol olsun', 10),
    ('meeting_note', 'Profili 5 zorunlu alan tamamlanana dek kilitle', 'Kullanıcı Gmail/SupaWeb ile kayıt olduktan sonra 5 zorunlu profil alanını doldurmadan arama dışında işlem yapamasın (profile basamasın, ayrıntı göremesin).', '12 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'kullanici-kisitlamalari', 'T15 · Profili 5 zorunlu alan tamamlanana dek kilitle', 20),
    ('meeting_note', 'Diasporada profile basınca Ayrıntı için kaydolun göster', 'Diasporada/Dizinde kayıtsız kullanıcı arayabilsin ama profile basıp ayrıntı göremesin; bunun yerine Ayrıntı görmek için kaydolun mesajı çıksın.', '12 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'kullanici-kisitlamalari', 'T15 · Diasporada profile basınca Ayrıntı için kaydolun göster', 30),
    ('meeting_note', 'İlk giren kullanıcıya Beni Oku ve rol değiştirme talebi bağlantısı ekle', 'Bireysel panele ilk giren kullanıcıya bir Beni Oku alanı ekle; işletme veya farklı bir rolse Buradan değiştir / bize talep gönder bağlantısı sun.', '12 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'mvp-hedefleri', 'T15 · İlk giren kullanıcıya Beni Oku ve rol değiştirme talebi bağlantısı ekle', 40),
    -- AFS / Roller
    ('meeting_note', 'AFS gözden geçir, eksik attribute feature section öner', 'AFS yapısını (attribute, feature, section) rol bazında gözden geçir; eksik olanları öner (ör. event/etkinlik attribute eksikliği). Burak rol bazında eksikleri işaretleyecek.', '12 Haziran 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'veritabani-tasarimi', 'T15 · AFS gözden geçir, eksik attribute feature section öner', 50),
    ('meeting_note', '76 rolden 3 ünü birleştir 2 sini ayrı tut, default açıklamaları yaz', 'Lovable kaynaklı 76 rolde benzer rolleri birleştir: belirlenen 3 rol mergelenecek, 2 rol ayrı kalacak. Her rol için default rol açıklamalarını Burak yazacak (ayrı tutmak zor, birleştirmek kolay).', '12 Haziran 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'veritabani-tasarimi', 'T15 · 76 rolden 3 ünü birleştir 2 sini ayrı tut, default açıklamaları yaz', 60),
    ('meeting_note', 'Hizmet talebi feature ını tüm rollere toplu aç', 'Hizmet talebi gibi ortak feature ları tek tek değil backend ten toplu (mass) güncellemeyle tüm rollere aç (ör. dernek de Türk badanacıdan hizmet talep edebilsin). Bu tür kitlesel değişiklikler arka planda yapılacak.', '12 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'veritabani-tasarimi', 'T15 · Hizmet talebi feature ını tüm rollere toplu aç', 70),
    -- Dünya Kupası
    ('meeting_note', 'Ana sayfaya Dünya Kupası butonu ekle', 'Dünya Kupası kampanya sayfası ana sayfada görünmüyor; ana sayfaya kampanyaya götüren bir buton ekle ki gelen ziyaretçi ulaşabilsin.', '12 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'mvp-hedefleri', 'T15 · Ana sayfaya Dünya Kupası butonu ekle', 80),
    ('meeting_note', 'Dünya Kupası ilanlarına telefon adres görsel ekle, şehir haritası kalsın', 'Dünya Kupası işletme kartlarına telefon, adres ve görsel yükleme ekle (rezervasyon/yol tarifi için). Harita entegrasyonu şehir bazlı kalsın (birebir adres pinine gerek yok, basit script ile şehre gider).', '12 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'mvp-hedefleri', 'T15 · Dünya Kupası ilanlarına telefon adres görsel ekle, şehir haritası kalsın', 90),
    -- Scraper & Veri / Haber
    ('meeting_note', 'Python web scraper kur, çıktıyı admin onayıyla profile çevir', 'Python ile web scraper kur: admin panelinden ör. Dortmund + Doktor + sayı gir, 5 dakika sonra bulunan kayıtlar listelensin; admin yarat dedikçe profiller oluşsun (Maps tabanlı veri çekme).', '12 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'veritabani-tasarimi', 'T15 · Python web scraper kur, çıktıyı admin onayıyla profile çevir', 100),
    ('meeting_note', 'Otomatik haber çekmeyi kur, admin onayıyla radara işle', 'Sunucu 7/24 çalıştığından günde 1-2 kez otomatik haber çeksin, adayları admine atsın; admin onayladıkça radara/habere işlensin (otomatik yayın yok).', '12 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'veritabani-tasarimi', 'T15 · Otomatik haber çekmeyi kur, admin onayıyla radara işle', 110),
    ('meeting_note', 'Haberleri kullanıcı ilgi alanına göre kişiselleştir ve e-posta gönder', 'Kullanıcı ilgi alanlarını seçtiği için, ilgilendiği konulardaki haberleri eşleştirip ona e-posta ile gönder (kişiye göre customize edilmiş haber akışı).', '12 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'reklam-modeli', 'T15 · Haberleri kullanıcı ilgi alanına göre kişiselleştir ve e-posta gönder', 120),
    -- Strateji & Ekip
    ('meeting_note', 'Sosyal medya otomasyonuna Cadde den sonra eğil', 'Sosyal medya otomasyonu herkese lazım ama daha zor bir konu (videoları biz mi atalım, otomatik mi); Cadde çıktıktan sonra bu konuya eğil.', '12 Haziran 2026', 'Atanmadi', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'mvp-hedefleri', 'T15 · Sosyal medya otomasyonuna Cadde den sonra eğil', 130),
    ('meeting_note', 'Cadde nin son durumuna bak ve Cadde yi öne çek', 'Caddenin son durumuna henüz bakılmadı; Cadde yi öne çekip son haline bak (revizyon sonrası odaklanılacak ana iş).', '12 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'mvp-hedefleri', 'T15 · Cadde nin son durumuna bak ve Cadde yi öne çek', 140),
    ('meeting_note', 'Reels leri Cadde revizyonu bitince sosyal medyaya bas', 'Hazır bekleyen reels leri, bu revizyon/Cadde işi bitince Instagram ve Reddit gibi kanallara bas.', '12 Haziran 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'topluluk-yonetimi', 'T15 · Reels leri Cadde revizyonu bitince sosyal medyaya bas', 150),
    ('meeting_note', 'Dünya Kupası güncellemelerinin WhatsApp özetini at', 'Bu toplantıda Dünya Kupası ile ilgili eklenecek maddeleri Burak WhatsApp tan kısaca özetleyip Barış a iletecek.', '12 Haziran 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'ekip-ve-isbirligi', 'T15 · Dünya Kupası güncellemelerinin WhatsApp özetini at', 160),
    -- Kararlar / Durum Tespitleri
    ('meeting_note', 'KARAR: İşletme formu doldurulunca arka planda işletme profili otomatik açılır', 'Karar: Dünya Kupası işletme formunu dolduran kişi için arka planda işletme profili otomatik açılır; böylece hem üye olur hem data toplanır.', '12 Haziran 2026', 'Atanmadi', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'mvp-hedefleri', 'T15 · KARAR: İşletme formu doldurulunca arka planda işletme profili otomatik açılır', 170),
    ('meeting_note', 'KARAR: Taraftarın işletme profilini görmesine gerek yok', 'Karar: Maç izlemeye gelen taraftarın işletme profilini görmesine gerek yok; telefon, adres ve haritada açma yeterli (Profili Gör linki kaldırıldı).', '12 Haziran 2026', 'Atanmadi', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'mvp-hedefleri', 'T15 · KARAR: Taraftarın işletme profilini görmesine gerek yok', 180),
    ('meeting_note', 'KARAR: KVKK GDPR çerez metinleri kayıt akışında zaten mevcut', 'Karar/tespit: Gizlilik, KVKK, GDPR ve çerez metinleri kayıt akışında zaten oluşturuldu ve mevcut; telefon vb. yayınlanması bu kapsamda uygun.', '12 Haziran 2026', 'Atanmadi', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'audit-kayitlari', 'T15 · KARAR: KVKK GDPR çerez metinleri kayıt akışında zaten mevcut', 190),
    ('meeting_note', 'KARAR: Yeni sistem modüler, kampanya sadece frontend sayfa ve route ile eklenir', 'Karar/tespit: Rol sistemi oturduğu için yeni kampanya eklemek modüler; bir frontend sayfası yaz, route ekle, admine ekle, kampanya hazır. İş bitince kampanya silinir/gizlenir (olimpiyat, basket finali vb. aynı şekilde).', '12 Haziran 2026', 'Atanmadi', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'mvp-hedefleri', 'T15 · KARAR: Yeni sistem modüler, kampanya sadece frontend sayfa ve route ile eklenir', 200),
    ('meeting_note', 'KARAR: Bireysel kullanıcı default Cadde de ilan verebilir', 'Karar: Bireysel kullanıcıya Cadde de default bir ilan verme özelliği açılacak; ilan görseli ve açıklamasıyla, kendi ülke ve şehrinde Caddenin altındaki Çarşı da çıkacak.', '12 Haziran 2026', 'Atanmadi', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T15', '12 Haziran 2026', 'mvp-hedefleri', 'T15 · KARAR: Bireysel kullanıcı default Cadde de ilan verebilir', 210);

end
$$;

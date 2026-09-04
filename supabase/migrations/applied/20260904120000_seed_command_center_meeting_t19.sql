-- Seed: 3 Eylül 2026 "Profiller" toplantısı -> command_center_items (item_type=meeting_note)
-- Kaynak toplantı: T19 (3 Eylül 2026). T18 = 27 Ağustos zaten kullanımda.
-- Assignee eşlemesi: UBT'nin maddeleri -> UBT, Burak'ın maddeleri -> Burak,
-- ortak alınan kararlar -> B+B (mig 20260830120000 ile CHECK'e eklendi).
-- 17 yapılacak (Baslanmadi / biri Tamamlandi) + 7 karar maddesi (Beklemede) = 24 satır.
-- Kategori (legacy_source_category) mevcut 9 MEETING_CATEGORIES kimliğinden seçildi.
-- Idempotent guard: legacy_source_date_label = '3 Eylül 2026'.
--
-- Toplantının kararları (aşağıda ayrı "karar" satırları olarak da duruyor):
--   * Sisteme giren herkesten e-posta VE telefon doğrulaması alınacak (coğrafi tespit + güvenlik).
--   * Bireysel ilgi alanları public olacak; LinkedIn opsiyonel ama şiddetle tavsiye edilecek.
--   * Tek ana profil + onaylı rollere göre ek ETİKET; hesaplar arası toggle YOK.
--   * Tüzel kişilikler (kurum/dernek/hastane) şahıs ismi olmadan doğrudan kurum olarak yer alacak.
--   * Referans kodu ilk giriş ekranında değil, üye içeri alındıktan sonra içeride toplanacak.
--   * Özellik yetkileri tekil fiyat yerine sepet/abonelik paketlerine bölünecek.
--   * %50 boost token 13 Eylül'de bitiyor; WordPress taşıma 14 Eylül haftasına donduruldu.
--
-- Profil ile ilgili maddelerin bir kopyası ayrıca Profil Workshop panosuna işlenir
-- (mig 20260904121000_workshop_items_profil.sql, /admin/workshop/profil).

do $$
begin
  if exists (
    select 1 from public.command_center_items
    where item_type = 'meeting_note'
      and legacy_source_date_label = '3 Eylül 2026'
  ) then
    raise notice 'T19 (3 Eylül 2026) seed already present, skipping.';
    return;
  end if;

  insert into public.command_center_items
    (item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
     legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category, legacy_source_title, sort_order)
  values
    -- ── Umut Barış Terzioğlu (UBT) — Arayüz & Kullanıcı Deneyimi ────────────────
    ('meeting_note', 'Cadde gönderilerine 3 nokta (...) menüsü ekle', 'Cadde üzerindeki gönderilere düzenle / sil / paylaş seçeneklerini içeren 3 nokta (...) menüsü eklenecek. Menü gönderi kartının sağ üst köşesinde, sahibi ve moderatör için farklı seçeneklerle açılacak.', '3 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'mvp-hedefleri', 'Cadde gönderilerine 3 nokta (...) menüsü ekle', 10),
    ('meeting_note', 'Profil alanlarını yeniden düzenle: telefon en üste, profil tipi netleşsin', 'Telefon numarası profil formunda en üste (ilk kutuya) alınacak, profil tipi kullanıcıya net görünecek ve rozetlerin yanına üzerine gelince açıklama veren bilgi (i) ikonları eklenecek.', '3 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'mvp-hedefleri', 'Profil alanlarını yeniden düzenle: telefon en üste, profil tipi netleşsin', 20),
    ('meeting_note', 'Kayıt formundaki "Bizi nereden buldunuz?" alanını kaldır', 'Kayıt formundaki "Bizi nereden buldunuz?" sorusu tamamen kaldırılacak; kayıt akışı kısaltılacak.', '3 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'mvp-hedefleri', 'Kayıt formundaki "Bizi nereden buldunuz?" alanını kaldır', 30),
    ('meeting_note', 'Admin panelinde Güncellemeler sekmesini kapalı karta al, rol onaylarını öne çıkar', '"Güncellemeler" sekmesi varsayılan olarak kapalı (collapse) kart hâline getirilecek; "Bekleyen Rol Değişim Onayları" bloğu panelde daha görünür bir yere taşınacak.', '3 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'mvp-hedefleri', 'Admin panelinde Güncellemeler sekmesini kapalı karta al, rol onaylarını öne çıkar', 40),

    -- ── UBT — Doğrulama & Giriş (Login) Altyapısı ───────────────────────────────
    ('meeting_note', 'Supabase e-posta doğrulamasını (confirmation) aktif et', 'Supabase üzerinden giriş yapan kullanıcılar için e-posta doğrulaması (confirmation) açılacak. Karar: sisteme giren herkesten e-posta doğrulaması alınacak.', '3 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'kullanici-kisitlamalari', 'Supabase e-posta doğrulamasını (confirmation) aktif et', 50),
    ('meeting_note', 'Telefon doğrulaması ve ülke seçimi entegrasyonunu kur', 'Kullanıcının hangi ülkeden / diasporadan geldiğini tespit edebilmek için telefon doğrulaması (phone verification) ve ülke seçimi entegrasyonu yapılacak. Not: ülke bilgisi telefon alan kodundan TÜRETİLMEYECEK (+90 numaralı üye Berlin''de yaşıyor olabilir).', '3 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'kullanici-kisitlamalari', 'Telefon doğrulaması ve ülke seçimi entegrasyonunu kur', 60),

    -- ── UBT — Veritabanı & Üyelik İşlemleri ─────────────────────────────────────
    ('meeting_note', 'Eski üyeleri Gmail girişine ve profil tamamlamaya yönlendiren e-posta akışını kur', 'Eski üyelere ulaşıp yeni Gmail (Google Auth) giriş yöntemine ve profillerini tamamlamaya yönlendiren bir e-posta / bilgilendirme akışı kurulacak.', '3 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'topluluk-yonetimi', 'Eski üyeleri Gmail girişine ve profil tamamlamaya yönlendiren e-posta akışını kur', 70),
    ('meeting_note', 'Referans kodu giriş alanını giriş sonrası (post-login) aşamaya taşı', 'Google Auth ile girildiği için login esnasında referans kodu alınamıyor. Referans kodu alanı, kullanıcı içeri girdikten sonraki bir aşamaya (içerideki forma) entegre edilecek.', '3 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'topluluk-yonetimi', 'Referans kodu giriş alanını giriş sonrası (post-login) aşamaya taşı', 80),

    -- ── UBT — Mimari & Profil Sistemleri ────────────────────────────────────────
    ('meeting_note', 'Rol bazlı profil etiketleme sistemini kurgula', 'Kullanıcının tek profili olacak ancak aynı anda birden fazla unvan taşıyabilecek (örn. hem "Son Kullanıcı" hem "Danışman"). Rol başvurusu onaylandıkça profile ek etiket eklenecek; işlemler bu etiketlerle yürüyecek.', '3 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'veritabani-tasarimi', 'Rol bazlı profil etiketleme sistemini kurgula', 90),
    ('meeting_note', 'Ekstra özellik taleplerini Default / Talep Edilebilir paketlere böl ve checkout''a bağla', 'Grup ve WhatsApp yayınlama gibi ekstra özellik taleplerinin kapsamı gözden geçirilecek; özellikler "Default" ve "Talep Edilebilir" olmak üzere iki ayrı pakete (sepete) ayrılıp ödeme (checkout) adımına bağlanacak.', '3 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'reklam-modeli', 'Ekstra özellik taleplerini Default / Talep Edilebilir paketlere böl ve checkout''a bağla', 100),
    ('meeting_note', 'Burak''ın silinen admin yetkilerini geri ver ve test ettir', 'Yanlışlıkla silinen admin yetkisi geri verilecek ve Burak''ın panelde test etmesi sağlanacak. Durum: burakakcakanat@gmail.com hesabına Admin_SuperAdmin rolü atandı (migration 20260903130000, commit 91d6247) — Burak''ın panelde doğrulaması bekleniyor.', '3 Eylül 2026', 'UBT', 'Tamamlandi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'ekip-ve-isbirligi', 'Burak''ın silinen admin yetkilerini geri ver ve test ettir', 110),

    -- ── UBT — Operasyon & İletişim ──────────────────────────────────────────────
    ('meeting_note', 'WordPress taşıma işlemlerini 13 Eylül''e kadar dondur', '13 Eylül''e kadar WordPress site taşıma işlemleri dondurulacak (freeze). Taşımayı yapacak kişiyle görüşülüp Cloud''un erişebileceği bir altyapı talep edilecek.', '3 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'ekip-ve-isbirligi', 'WordPress taşıma işlemlerini 13 Eylül''e kadar dondur', 120),
    ('meeting_note', 'Google Auth ve admin paneli yetkilendirme rehberini hazırla', 'Google Auth ve admin paneli yetkilendirme işlemleri için adım adım bir rehber (guide) hazırlanıp Burak''a iletilecek.', '3 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'ekip-ve-isbirligi', 'Google Auth ve admin paneli yetkilendirme rehberini hazırla', 130),
    ('meeting_note', 'Toplantı notlarını "Profil Workshop Notları" formatında Burak''a gönder', 'Toplantıda konuşulan notlar "Profil Workshop Notları" formatında toparlanıp Burak''a gönderilecek. Pano: /admin/workshop/profil.', '3 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'ekip-ve-isbirligi', 'Toplantı notlarını "Profil Workshop Notları" formatında Burak''a gönder', 140),

    -- ── Burak Akcakanat ─────────────────────────────────────────────────────────
    ('meeting_note', 'Referans sistemi kural kitapçığını yaz', 'Referans sistemi için kapsamlı bir kural kitapçığı yazılacak. Örnek sorular: kontribütör birini getirirse %15 nasıl işleyecek, son kullanıcı bir emlakçıyı getirirse kime hangi indirim veya kredi sağlanacak?', '3 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'topluluk-yonetimi', 'Referans sistemi kural kitapçığını yaz', 150),
    ('meeting_note', 'Komuta Merkezi TOP 10 HOT FIX listesini önceliklendir', 'Admin panelindeki Komuta Merkezi (TOP 10 HOT FIX) bloğuna girilip platformda acilen yapılması gereken ilk 10 madde önceliklendirilerek listelenecek. Tablo hazır ve şu an boş (/admin/workspace/command-center).', '3 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'mvp-hedefleri', 'Komuta Merkezi TOP 10 HOT FIX listesini önceliklendir', 160),
    ('meeting_note', 'Toplantı notlarını Excel tablosuna işle', 'Bu toplantıda alınan notlar toparlanıp Excel tablosuna işlenecek.', '3 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'ekip-ve-isbirligi', 'Toplantı notlarını Excel tablosuna işle', 170),

    -- ── Alınan kararlar (yapılacak değil, kapsam kaydı) ─────────────────────────
    ('meeting_note', 'KARAR: e-posta ve telefon doğrulaması zorunlu olacak', 'Sisteme giren kullanıcılardan coğrafi tespit ve güvenlik amacıyla mutlaka e-posta ve telefon doğrulaması alınacaktır.', '3 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'kullanici-kisitlamalari', 'KARAR: e-posta ve telefon doğrulaması zorunlu olacak', 180),
    ('meeting_note', 'KARAR: bireysel ilgi alanları public, LinkedIn opsiyonel', 'Kişilerin ağını (network) genişletmesine ve sistemin doğru eşleştirme yapmasına fayda sağladığı için "Bireysel İlgi Alanları" diğer kullanıcılara görünür (public) olacak. LinkedIn hesabı eklemek opsiyonel olacak ancak şiddetle tavsiye edilecek.', '3 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'mvp-hedefleri', 'KARAR: bireysel ilgi alanları public, LinkedIn opsiyonel', 190),
    ('meeting_note', 'KARAR: tekil profil + çoklu unvan (toggle yerine etiket)', 'LinkedIn''deki gibi hesaplar arası geçişin (bireysel profil ile şirket profili arasında toggle) teknik ve operasyonel zorlukları sebebiyle kullanıcılar platformda TEK bir ana profille gezecek. Rol başvurusu (örn. danışman) onaylanan kullanıcılara ek etiketler eklenecek, işlemler bu etiketlerle yürütülecek.', '3 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'veritabani-tasarimi', 'KARAR: tekil profil + çoklu unvan (toggle yerine etiket)', 200),
    ('meeting_note', 'KARAR: tüzel kişilikler şahıstan bağımsız profil olacak', 'Şahıslardan bağımsız olan kurum, dernek veya hastane gibi tüzel kişiliklerin profilleri şahıs ismi olmadan, doğrudan kurum olarak platformda yer alacak.', '3 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'veritabani-tasarimi', 'KARAR: tüzel kişilikler şahıstan bağımsız profil olacak', 210),
    ('meeting_note', 'KARAR: referans kodları giriş sonrası içeride toplanacak', 'Referans kodları sisteme ilk giriş ekranında değil, üye içeri alındıktan sonra içerideki bir form vasıtasıyla toplanacak ve eşleştirmeler içeride yapılacak.', '3 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'topluluk-yonetimi', 'KARAR: referans kodları giriş sonrası içeride toplanacak', 220),
    ('meeting_note', 'KARAR: monetizasyon tekil fiyat değil sepet / abonelik paketi', 'Özellik talepleri ve kullanıcı yetkileri (etkinlik oluşturma, WhatsApp numarası gösterme, teklif verme vb.) tekil fiyatlandırma yerine endüstri standardı olan sepet / abonelik paketlerine (Paket 1, Paket 2 …) bölünerek sunulacak.', '3 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'reklam-modeli', 'KARAR: monetizasyon tekil fiyat değil sepet / abonelik paketi', 230),
    ('meeting_note', 'KARAR: 13 Eylül''e kadar AI geliştirme, WordPress taşıma 14 Eylül''e ertelendi', 'Sistemdeki mevcut %50 boost token süresi 13 Eylül''de biteceği için yapay zekâ ile geliştirme sürecine bu tarihe kadar maksimum ağırlık verilecek. WordPress site taşıma operasyonu 14 Eylül haftasına kadar askıya alındı (frozen).', '3 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'ekip-ve-isbirligi', 'KARAR: 13 Eylül''e kadar AI geliştirme, WordPress taşıma 14 Eylül''e ertelendi', 240);

  -- Seed sayısını doğrula: eksik/fazla satır sessizce geçmesin (WS2 seed dersi).
  if (
    select count(*) from public.command_center_items
    where item_type = 'meeting_note' and legacy_source_date_label = '3 Eylül 2026'
  ) <> 24 then
    raise exception 'T19 seed 24 satır eklemeliydi.';
  end if;
end
$$;

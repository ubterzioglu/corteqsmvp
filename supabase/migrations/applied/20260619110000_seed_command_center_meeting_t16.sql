-- Seed: 19 Haziran 2026 toplantısı (Fathom) -> command_center_items (item_type=meeting_note)
-- Source meeting: T16 (19 Haziran 2026). T15 = 12 Haziran zaten kullanımda.
-- Assignee mapping: Barış/UBT -> UBT, Burak -> Burak, sahibi netleşmemiş ortak karar -> Atanmadi.
-- Status: Baslanmadi (open tasks). 28 rows. Idempotent guard on legacy_source_date_label.

do $$
begin
  if exists (
    select 1 from public.command_center_items
    where item_type = 'meeting_note'
      and legacy_source_date_label = '19 Haziran 2026'
  ) then
    raise notice 'T16 (19 Haziran 2026) seed already present, skipping.';
    return;
  end if;

  insert into public.command_center_items
    (item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
     legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category, legacy_source_title, sort_order)
  values
    -- ── Ekip ve İşbirliği (sözleşme + sync) ───────────────────────────────────
    ('meeting_note', 'Cortex sözleşmesini oku ve Barış''a geri dön', 'Cortex Operating Engine hazırlık/revize sözleşmesini oku, hafta sonu açıp incele ve Barış''a geri bildirim ver.', '19 Haziran 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'ekip-ve-isbirligi', 'Cortex sözleşmesini oku ve Barış''a geri dön', 10),
    ('meeting_note', 'Cortex sözleşmesini avukat/danışmanlara okut', 'Sözleşmeyi tanıdık avukat ve startup danışmanlarıyla paylaş; farklı perspektiften değerlendirme ve geri bildirim topla.', '19 Haziran 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'ekip-ve-isbirligi', 'Cortex sözleşmesini avukat/danışmanlara okut', 20),
    ('meeting_note', 'Sözleşmeyi farklı senaryolarla çalıştır', 'Sözleşmeyi partner-dostu ve yatırımcı-dostu yapı, dispute/karşı durum senaryoları ve scalable bir ana yapı açısından çalıştırıp değerlendir.', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'ekip-ve-isbirligi', 'Sözleşmeyi farklı senaryolarla çalıştır', 30),
    ('meeting_note', 'Bir sonraki sync''i Pazartesi''ye planla', 'Bir sonraki toplantı/sync''i Pazartesi olarak planla (Elif/Burak seyahat takvimine göre).', '19 Haziran 2026', 'Atanmadi', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'ekip-ve-isbirligi', 'Bir sonraki sync''i Pazartesi''ye planla', 40),

    -- ── Veritabanı Tasarımı (toplu içe aktarma + onay) ────────────────────────
    ('meeting_note', 'Tablo şemasını export edip içe aktarma kılavuzu çıkar', 'Mevcut veri tablolarının (ör. doktor için hangi attribute''lar var) şemasını export et ve toplu içe aktarma için bir kılavuz (guide) hazırla.', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'veritabani-tasarimi', 'Tablo şemasını export edip içe aktarma kılavuzu çıkar', 50),
    ('meeting_note', 'Toplu içe aktarma için JSON/CSV prompt''u hazırla', 'Burak''ın Deep Research çıktılarını sisteme uygun JSON/CSV''ye çeviren standart bir prompt hazırla ve Burak''a gönder.', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'veritabani-tasarimi', 'Toplu içe aktarma için JSON/CSV prompt''u hazırla', 60),
    ('meeting_note', 'Admin onay kılavuzunu Burak''a ilet', 'Toplu içe aktarma onay kılavuzunu Burak''a ilet; Burak günde 5–10 pending kaydı tek tek inceleyip onaylasın.', '19 Haziran 2026', 'Atanmadi', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'veritabani-tasarimi', 'Admin onay kılavuzunu Burak''a ilet', 70),
    ('meeting_note', 'Pending''deki konsolosluk/danışman setlerini onayla', '/admin/data ''İncelemede'' filtresindeki konsolosluk, advisor ve diğer veri setlerini tek tek inceleyip onayla; hatalı kayıtları düzelt.', '19 Haziran 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'veritabani-tasarimi', 'Pending''deki konsolosluk/danışman setlerini onayla', 80),
    ('meeting_note', 'Yeni veri setlerini (Melbourne vb.) toplu içe aktar', 'Hazırlanan prompt''la yeni veri setlerini (ör. Melbourne) üret ve toplu içe aktarma ekranından sisteme al.', '19 Haziran 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'veritabani-tasarimi', 'Yeni veri setlerini (Melbourne vb.) toplu içe aktar', 90),

    -- ── Topluluk Yönetimi (içerik + söylem) ───────────────────────────────────
    ('meeting_note', 'Anasayfada ''diaspora'' kelime ağırlığını azalt', 'Anasayfada ''diaspora'' kelimesi fazla baskın (tarikat gibi duruyor geri bildirimi); ≈30/70 diaspora/Türk dengesine çek.', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'topluluk-yonetimi', 'Anasayfada ''diaspora'' kelime ağırlığını azalt', 100),
    ('meeting_note', '50 yeni rehber/blog makalesi yazdırmaya devam et', 'Radar/blog için 50 yeni rehber makalesini tek tek yazdırmaya devam et.', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'topluluk-yonetimi', '50 yeni rehber/blog makalesi yazdırmaya devam et', 110),

    -- ── MVP Hedefleri (frontend cilası + uygulama) ────────────────────────────
    ('meeting_note', 'Kırık ''Şehir Elçileri'' linkini düzelt', '''Şehir Elçileri'' linki yanlışlıkla Founders sayfasına gidiyor; doğru hedefe bağla. Genel kırık link taraması yap.', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'mvp-hedefleri', 'Kırık ''Şehir Elçileri'' linkini düzelt', 120),
    ('meeting_note', 'Kuruluş/İşletme/Profesyonel dizinini kart görünümüne çevir', 'Kuruluşlar, İşletmeler ve Profesyoneller dizinini liste yerine kart (sahibinden vitrini gibi) görünümüne çevir; İnsanlar listede kalsın.', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'mvp-hedefleri', 'Kuruluş/İşletme/Profesyonel dizinini kart görünümüne çevir', 130),
    ('meeting_note', 'Landing page''e tanlatıcı hero video ekle', 'Landing page''de 3 saniyede her şeyi anlatan tek bir hero video ekle (sağdaki boşluğa/hero alanına); video değiştirilebilir olsun.', '19 Haziran 2026', 'Atanmadi', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'mvp-hedefleri', 'Landing page''e tanlatıcı hero video ekle', 140),
    ('meeting_note', 'Landing alt bölümlerden arka sayfalara CTA ekle', 'İnsanlar/İşletmeler gibi landing alt bölümlerine tıklayınca gerçek arka (beta) sayfalara giden CTA''lar ekle.', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'mvp-hedefleri', 'Landing alt bölümlerden arka sayfalara CTA ekle', 150),
    ('meeting_note', 'Venture Hub kategorisi oluştur', 'Startup/yatırımcı hub''ı için Venture Hub kategorisi oluştur: kendi kategori sayfası, ayrı/öne çıkan CTA ve startuplara yönelik video (Spindora hikâyesi tam buraya oturur).', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'mvp-hedefleri', 'Venture Hub kategorisi oluştur', 160),
    ('meeting_note', 'Frontend/profil cilası (2–3 hafta)', 'Önümüzdeki 2–3 hafta frontend cilasına asıl: video yeri, profil görünümleri ve experimental/farklı profillerin unification''ı.', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'mvp-hedefleri', 'Frontend/profil cilası (2–3 hafta)', 170),
    ('meeting_note', 'Relocation Engine''i bitir (öncelik)', 'Relocation/Taşınma Motoru''nu öncelikli olarak bitir; ardından Cadde iyileştirmelerine geç.', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'mvp-hedefleri', 'Relocation Engine''i bitir (öncelik)', 180),
    ('meeting_note', 'Cadde''yi çıkışa hazırla, post üretmeye devam et', 'Cadde''yi duyuru/çıkış için hazırla; çıktığında hemen paylaşılabilecek görsel ve postları önceden üretmeye devam et (elde hazır bulunsun).', '19 Haziran 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'mvp-hedefleri', 'Cadde''yi çıkışa hazırla, post üretmeye devam et', 190),
    ('meeting_note', 'Android uygulamasını Google Play closed test''e al', 'Hazır Android uygulamasını Google Play''e yükle (14 gün / 12 kişi closed test). iOS pahalı olduğu için sonraya ertelendi.', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'mvp-hedefleri', 'Android uygulamasını Google Play closed test''e al', 200),

    -- ── Influencer / Partnerlikler (Spindora + tool''lar) ──────────────────────
    ('meeting_note', 'Spindora SEO/GEO API entegrasyonu', 'Spindora (Batuhan) SEO/GEO API''lerini entegre et: üyelere embedded perk ver, rapor bizim pencereden çekilsin, premium/daha fazla fonksiyon için Spindora''ya yönlendir.', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'influencer-partnerlikleri', 'Spindora SEO/GEO API entegrasyonu', 210),
    ('meeting_note', 'Spindora CV Optimizer API''sini entegre et', 'Spindora''nın CV Optimizer API''sini entegre et; kendi pencerede CV optimizasyon hizmeti ver (Taşınma Motoru içine de konabilir).', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'influencer-partnerlikleri', 'Spindora CV Optimizer API''sini entegre et', 220),
    ('meeting_note', '''Sana uygun ülkeyi bul'' anketi/tool''u yap', '20 soruluk, catchy, kapalı devre bir ''sana uygun ülkeyi bul'' anketi/tool''u yap (skorlamayla en uygun ülkeyi çıkarır; Instagram''da paylaşıma uygun).', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'influencer-partnerlikleri', '''Sana uygun ülkeyi bul'' anketi/tool''u yap', 230),
    ('meeting_note', 'Mesleğe/CV''ye göre ülke-şehir öneren tool', 'Meslek, CV ve tecrübeye göre diasporada uygun ülke/şehir öneren bir tool (Relocation kapsamı; kapalı devre, skorlamalı).', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'influencer-partnerlikleri', 'Mesleğe/CV''ye göre ülke-şehir öneren tool', 240),

    -- ── Reklam Modeli (maliyet/abonelik optimizasyonu) ────────────────────────
    ('meeting_note', 'Cloud planını 1 ay $100/ay plana düşür', 'Üyelik optimizasyonu: Cloud (×20) planını yaklaşık 1 ay boyunca $100/ay (×5) plana düşürüp dene, sonra değerlendir.', '19 Haziran 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'reklam-modeli', 'Cloud planını 1 ay $100/ay plana düşür', 250),
    ('meeting_note', 'Aylık AI/altyapı maliyetini ~130–150$ bandına çek', 'Tüm üyelikleri (Gemini, ChatGPT, Cloud) gözden geçirip atıl olanları tasfiye et; aylık toplam AI/altyapı maliyetini ~130–150$ bandında tut.', '19 Haziran 2026', 'Atanmadi', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'reklam-modeli', 'Aylık AI/altyapı maliyetini ~130–150$ bandına çek', 260),
    ('meeting_note', 'Cloud-uyumlu video üretim alternatifi araştır', 'Gemini video üretimini Cloud''dan çözemiyoruz; Cloud connector ile çalışabilen, ~$20–30/ay maliyetli ayrı bir video üretim aracı araştır (Higgsfield/Kling/Nano Banana sınırlamalarına dikkat).', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'reklam-modeli', 'Cloud-uyumlu video üretim alternatifi araştır', 270),

    -- ── Ekip ve İşbirliği (mail altyapısı) ────────────────────────────────────
    ('meeting_note', 'Thunderbird mailleri kur ve config export et', 'Thunderbird''e tüm ortak mailleri ekle, ayarları config dosyası olarak export et ve Burak''a güvenli şekilde ilet (real-time bağlı olacak).', '19 Haziran 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'ekip-ve-isbirligi', 'Thunderbird mailleri kur ve config export et', 280),
    ('meeting_note', 'Thunderbird config''i import et, mail listesini ilet', 'Burak: Thunderbird''i kur ve Barış''ın gönderdiği config''i import et. Kullandığın tüm mail hesaplarının kullanıcı adı/şifrelerini güvenli bir yerde derle ve güvenli kanaldan Barış''a ilet (sonra karşılıklı silinir).', '19 Haziran 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'ekip-ve-isbirligi', 'Thunderbird config''i import et, mail listesini ilet', 290),
    ('meeting_note', 'Barış''ı mail servisinde siteli kullanıcı ekle', 'Mail servisine Barış''ı siteli (site) kullanıcı olarak ekle.', '19 Haziran 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T16', '19 Haziran 2026', 'ekip-ve-isbirligi', 'Barış''ı mail servisinde siteli kullanıcı ekle', 300);

end
$$;

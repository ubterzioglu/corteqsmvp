-- Seed: 9 Ekim 2026 toplantısı (T23) — 7 karar + 5 UBT + 5 Burak = 17 satır.
--
-- Kaynak: toplantı transkriptinden çıkarılmış resmi karar/yapılacaklar listesi
-- (10 Ekim'de iletildi). Desen T22 gerçek çıktı seed'iyle aynı; idempotent guard
-- ilk KARAR satırının legacy_source_title'ı üzerinde.
--
-- Not: Atınç bu toplantıda QS'te danışman, CorteQS Global'de kurucu ortak olarak
-- konumlandırıldı; Admin_SuperAdmin rolü ayrı migration'la verildi (20261010120000).

do $$
declare
  v_eklenen int;
begin
  if exists (
    select 1 from public.command_center_items
    where item_type = 'meeting_note'
      and legacy_source_code = 'T23'
      and legacy_source_title = 'KARAR: %20 hisse QS''e devredilecek, %10 yönetici havuzu ayrılacak'
  ) then
    raise notice 'T23 seed already present, skipping.';
    return;
  end if;

  insert into public.command_center_items
    (item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
     legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category, legacy_source_title, sort_order)
  values
    -- ── Kararlar ───────────────────────────────────────────────────────────────
    ('meeting_note', 'KARAR: %20 hisse QS''e devredilecek, %10 yönetici havuzu ayrılacak', 'Burak ve Barış''ın hisselerinden %10''ar olmak üzere toplam %20 hisse QS''e devredilecek; QS bu hisseleri ilk değerleme üzerinden ödeyerek alacak. Ayrıca gelecekteki üst düzey yöneticiler (CFO, CMO vb.) için cap table''da %10''luk bir havuz ayrılacak.', '9 Ekim 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T23', '9 Ekim 2026', 'ekip-ve-isbirligi', 'KARAR: %20 hisse QS''e devredilecek, %10 yönetici havuzu ayrılacak', 10),
    ('meeting_note', 'KARAR: Atınç QS''te danışman, CorteQS Global''de kurucu ortak', 'Atınç, QS''te danışman (advisor), CorteQS Global''de kurucu ortak (co-founder) olarak konumlandırılacak. Sistemin genel mimarisini Barış ile birlikte yürütecek.', '9 Ekim 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T23', '9 Ekim 2026', 'ekip-ve-isbirligi', 'KARAR: Atınç QS''te danışman, CorteQS Global''de kurucu ortak', 20),
    ('meeting_note', 'KARAR: SMS ve telefon numaraları ABD (+1) olacak, WhatsApp ve SMS ayrı numara', 'SMS ve telefon numaraları ABD bazlı (+1) alınacak. WhatsApp botu ile SMS onay kodları için birbirinden ayrı numaralar kullanılacak.', '9 Ekim 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T23', '9 Ekim 2026', 'mvp-hedefleri', 'KARAR: SMS ve telefon numaraları ABD (+1) olacak, WhatsApp ve SMS ayrı numara', 30),
    ('meeting_note', 'KARAR: Stripe altyapısı kurulacak, paketler Burak onayından sonra yayına çıkacak', 'Stripe''ın temel altyapısı kurulacak; abonelik paketleri hazırlandıktan sonra Burak''ın onayından geçip yayına alınacak. (Ücretli abonelik hedef tarihi 1 Ocak 2027 — T21 kararı.)', '9 Ekim 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T23', '9 Ekim 2026', 'reklam-modeli', 'KARAR: Stripe altyapısı kurulacak, paketler Burak onayından sonra yayına çıkacak', 40),
    ('meeting_note', 'KARAR: Atınç Pazartesi toplantılarına dahil edilecek', 'Pazartesi günleri yapılan düzenli toplantılara Atınç da katılacak.', '9 Ekim 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T23', '9 Ekim 2026', 'ekip-ve-isbirligi', 'KARAR: Atınç Pazartesi toplantılarına dahil edilecek', 50),
    ('meeting_note', 'KARAR: Atınç''ın CorteQS tasarımı onaylandı', 'Atınç''ın hazırladığı CorteQS tasarımı (WhatsApp entegrasyonu, Cadde çözümü, ana sayfa) onaylandı ve kullanılacak.', '9 Ekim 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T23', '9 Ekim 2026', 'mvp-hedefleri', 'KARAR: Atınç''ın CorteQS tasarımı onaylandı', 60),
    ('meeting_note', 'KARAR: soft launch sonrası CorteQS "platform engine" hâline getirilecek', 'Soft launch sonrasında CorteQS dil, bayrak ve ülke gibi değişkenlere ayrılarak başka topluluklar için çoğaltılabilir bir platform motoruna (ör. CorteQS Japonya) dönüştürülecek.', '9 Ekim 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T23', '9 Ekim 2026', 'veritabani-tasarimi', 'KARAR: soft launch sonrası CorteQS "platform engine" hâline getirilecek', 70),

    -- ── UBT ────────────────────────────────────────────────────────────────────
    ('meeting_note', 'Stripe temel backend altyapısını kur, paketleri Burak''ın onayına sun', 'Stripe sisteminin temel backend altyapısı kurulacak; abonelik paketleri yayınlanmadan önce Burak''ın onayına sunulacak.', '9 Ekim 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T23', '9 Ekim 2026', 'reklam-modeli', 'Stripe temel backend altyapısını kur, paketleri Burak''ın onayına sun', 80),
    ('meeting_note', 'Twilio SMS ve onay numarası sorularını listeleyip Burak''a ilet', 'Twilio SMS ve onay numaralarıyla ilgili teknik detaylar ve sorular listelenip bir toplantıda veya chat üzerinden Burak''a iletilecek. (Numaralar ABD +1, WhatsApp ve SMS ayrı — bu toplantının kararı.)', '9 Ekim 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T23', '9 Ekim 2026', 'mvp-hedefleri', 'Twilio SMS ve onay numarası sorularını listeleyip Burak''a ilet', 90),
    ('meeting_note', 'Admin paneli chatbot''u ile kullanıcı chatbot''unu ayır', 'Admin panelindeki chatbot ile kullanıcı panelindeki chatbot birbirinden ayrılacak; farklı renkler ve roller tanımlanacak.', '9 Ekim 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T23', '9 Ekim 2026', 'mvp-hedefleri', 'Admin paneli chatbot''u ile kullanıcı chatbot''unu ayır', 100),
    ('meeting_note', 'WhatsApp botunu tamamla ve SMS konfirmasyonundan ayır', 'WhatsApp bot geliştirmeleri tamamlanacak ve SMS konfirmasyon sisteminden ayrılacak (ayrı numara kararı).', '9 Ekim 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T23', '9 Ekim 2026', 'topluluk-yonetimi', 'WhatsApp botunu tamamla ve SMS konfirmasyonundan ayır', 110),
    ('meeting_note', 'Pre-lansman SEO/GEO iyileştirmelerini Şahin ve Baran''a ver', 'Site pre-lansmandan önce ücretsiz SEO/GEO iyileştirmeleri yapmaları için geliştirici arkadaşlar Şahin''e (ve Baran''a) verilecek.', '9 Ekim 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T23', '9 Ekim 2026', 'ekip-ve-isbirligi', 'Pre-lansman SEO/GEO iyileştirmelerini Şahin ve Baran''a ver', 120),

    -- ── Burak ──────────────────────────────────────────────────────────────────
    ('meeting_note', 'Cap table ve hisse yapısını anlatan MD dosyasını Barış''a gönder', 'Cap table ve hisse yapısını madde madde, sade anlatan bir Markdown dosyası hazırlanıp Barış''a gönderilecek.', '9 Ekim 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T23', '9 Ekim 2026', 'ekip-ve-isbirligi', 'Cap table ve hisse yapısını anlatan MD dosyasını Barış''a gönder', 130),
    ('meeting_note', 'Cap table simülatörünün linkini Barış''a ilet', 'QS altında çalışacak şifreli hisse/değerleme simülatörünün (round eklenince hissenin nasıl değiştiğini gösteren araç) linki Barış''a iletilecek.', '9 Ekim 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T23', '9 Ekim 2026', 'ekip-ve-isbirligi', 'Cap table simülatörünün linkini Barış''a ilet', 140),
    ('meeting_note', 'Gamification/affiliate modelini MD olarak tasarlat, RAG''e ekle', 'Affiliate/gamification (tavsiye/puan) modeli Claude''a MD olarak tasarlatılıp CorteQS RAG sisteminde "Gamification" klasörü altına eklenecek.', '9 Ekim 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T23', '9 Ekim 2026', 'influencer-partnerlikleri', 'Gamification/affiliate modelini MD olarak tasarlat, RAG''e ekle', 150),
    ('meeting_note', 'Atınç ile görüşüp Pazartesi toplantısına dahil et', 'Atınç ile görüşülerek kendisi Pazartesi günü yapılacak toplantıya dahil edilecek.', '9 Ekim 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T23', '9 Ekim 2026', 'ekip-ve-isbirligi', 'Atınç ile görüşüp Pazartesi toplantısına dahil et', 160),
    ('meeting_note', 'Ana Gmail hesabının yapay zekâ bağlantısını kes (prompt injection önlemi)', 'Banka ve hassas bilgilerin bulunduğu ana Gmail hesabının yapay zekâ (Claude vb.) bağlantısı kesilecek; yapay zekâ işlemleri için banka hesabı içermeyen ayrı bir mail hesabı kullanılacak.', '9 Ekim 2026', 'Burak', 'Baslanmadi', 5, null, true, 'meeting_notes', 'T23', '9 Ekim 2026', 'ekip-ve-isbirligi', 'Ana Gmail hesabının yapay zekâ bağlantısını kes (prompt injection önlemi)', 170);

  get diagnostics v_eklenen = row_count;
  if v_eklenen <> 17 then
    raise exception 'T23 seed 17 satır eklemeliydi, % eklendi.', v_eklenen;
  end if;
end
$$;

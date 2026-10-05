-- B3b · Örnek iş ilanları (DEMO seed).
--
-- Kaynak: docs/plans/qwen-sirali/01-tek-plan-kalan-isler.md §2.2
--
-- job_listings tablosu şu anda boş (0 satır). Bu migration 6 örnek ilan ekler.
-- İlanlar açıkça "[DEMO]" öneki ile işaretlenir. Gerçek ilan gelince silinir.
--
-- ⚠️ user_id: Canlıya uygulanmadan önce gerçek bir test kullanıcısı ID'si ile
-- değiştirilmelidir. Şu anki değer placeholder'dır.

begin;

-- ⚠️ BU DEĞER CANLIDA GERÇEK BİR TEST KULLANICISI ID'Sİ İLE DEĞİŞTİRİLMELİDİR.
-- Şu anki değer placeholder'dır ve muhtemelen auth.users'ta yoktur.
DO $$
DECLARE
  v_test_user_id uuid := '00000000-0000-0000-0000-000000000000'; -- placeholder
BEGIN
  -- Test kullanıcısı var mı kontrol et
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_test_user_id) THEN
    -- Varsa ilk admin kullanıcısını al, yoksa hata ver
    SELECT id INTO v_test_user_id FROM auth.users LIMIT 1;
    IF v_test_user_id IS NULL THEN
      RAISE EXCEPTION 'job_listings seed: Hiç kullanıcı yok. Önce bir test kullanıcısı oluşturun.';
    END IF;
    RAISE NOTICE 'job_listings seed: Test kullanıcısı bulunamadı, ilk kullanıcı kullanılıyor: %', v_test_user_id;
  END IF;

  -- 6 örnek ilan
  INSERT INTO public.job_listings (
    user_id, business_name, title, department, employment_type, location_type,
    country, city, description, requirements, package, status, hide_business_name
  ) VALUES
  (
    v_test_user_id,
    '[DEMO] Örnek Şirket A.Ş.',
    '[DEMO] Frontend Geliştirici',
    'Mühendislik',
    'Tam Zamanlı',
    'remote',
    'Almanya',
    'Berlin',
    'Bu bir DEMO ilandır. Gerçek ilan değildir. React, TypeScript deneyimi.Required',
    'React, TypeScript, 2+ yıl deneyim',
    'basic',
    'published',
    false
  ),
  (
    v_test_user_id,
    '[DEMO] Tech Startup GmbH',
    '[DEMO] Backend Engineer (Node.js)',
    'Mühendislik',
    'Tam Zamanlı',
    'hybrid',
    'Almanya',
    'Münih',
    'Bu bir DEMO ilandır. Node.js, PostgreSQL bilgisi.Required',
    'Node.js, PostgreSQL, Docker',
    'basic',
    'published',
    false
  ),
  (
    v_test_user_id,
    '[DEMO] Danışmanlık Ltd.',
    '[DEMO] İş Analisti',
    'Danışmanlık',
    'Tam Zamanlı',
    'office',
    'Türkiye',
    'İstanbul',
    'Bu bir DEMO ilandır. İş gereksinimleri analizi, SQL.Required',
    'SQL, iş analizi, 3+ yıl deneyim',
    'basic',
    'published',
    false
  ),
  (
    v_test_user_id,
    '[DEMO] Avrupa Teknoloji A.Ş.',
    '[DEMO] DevOps Mühendisi',
    'Mühendislik',
    'Tam Zamanlı',
    'remote',
    'Hollanda',
    'Amsterdam',
    'Bu bir DEMO ilandır. AWS, Kubernetes, CI/CD.Required',
    'AWS, Kubernetes, Terraform',
    'basic',
    'published',
    false
  ),
  (
    v_test_user_id,
    '[DEMO] Finans Corp',
    '[DEMO] Veri Bilimci',
    'Veri Analitiği',
    'Tam Zamanlı',
    'hybrid',
    'Fransa',
    'Paris',
    'Bu bir DEMO ilandır. Python, ML, istatistik.Required',
    'Python, TensorFlow, SQL',
    'basic',
    'published',
    false
  ),
  (
    v_test_user_id,
    '[DEMO] Medya Grubu',
    '[DEMO] İçerik Üreticisi (Part-time)',
    'Pazarlama',
    'Yarı Zamanlı',
    'remote',
    'Türkiye',
    'Ankara',
    'Bu bir DEMO ilandır. Sosyal medya, içerik oluşturma.Required',
    'Sosyal medya yönetimi, içerik oluşturma',
    'basic',
    'published',
    false
  );
END $$;

commit;

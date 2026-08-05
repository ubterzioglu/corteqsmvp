-- Cadde açılış script'i — 2026-08-05
-- ============================================================================
-- K1 (çöp veri) + K2 (seed fixture) + açılış içeriği TEK transaction'da.
-- Sıra kritik: K1 `author_user_id IS NOT NULL` olan HER postu siler, dolayısıyla
-- editöryel içerik silmelerden SONRA eklenmelidir. Ayrı script'lerde yanlış sırayla
-- çalıştırma riski vardı — bu yüzden birleştirildi.
--
-- Hata olursa TAMAMI geri sarar (ON_ERROR_STOP + tek BEGIN/COMMIT).
-- Yedek (silme öncesi tam anlık görüntü): C:\tmp\cadde-yedek-2026-08-04\*.csv
-- Geri yükleme: \copy <tablo> FROM <dosya> WITH CSV HEADER
--
-- ÇALIŞTIRMA (repo kökünden):
--   $pw = (Select-String -Path .env.local -Pattern '^SUPABASE_DB_PASSWORD=(.*)$').Matches[0].Groups[1].Value.Trim().Trim('"')
--   $env:PGPASSWORD = $pw
--   psql "host=aws-1-eu-west-2.pooler.supabase.com port=5432 dbname=postgres user=postgres.injprdrsklkxgnaiixzh sslmode=require" -f docs/operations/2026-08-05-cadde-acilis.sql
--
-- Türkçe metin komut satırından GEÇİRİLMEZ (CLAUDE.md Türkçe kuralı md.4:
-- PowerShell'den psql'e geçen `ı` bozulur). Bu yüzden -f ile dosyadan okunur ve
-- client_encoding açıkça UTF8'e sabitlenir.
-- ============================================================================
\encoding UTF8
\set ON_ERROR_STOP on

BEGIN;
SET client_encoding = 'UTF8';

\echo ''
\echo '=== 0) SILME ONCESI ==='
SELECT 'posts (kullanici)' AS grup, count(*) FROM public.cadde_posts WHERE author_user_id IS NOT NULL
UNION ALL SELECT 'posts (seed)',       count(*) FROM public.cadde_posts WHERE author_user_id IS NULL
UNION ALL SELECT 'posts public',       count(*) FROM public.cadde_posts WHERE visibility = 'public'
UNION ALL SELECT 'cafes (kullanici)',  count(*) FROM public.cadde_cafes WHERE host_user_id IS NOT NULL
UNION ALL SELECT 'cafes (seed)',       count(*) FROM public.cadde_cafes WHERE host_user_id IS NULL
UNION ALL SELECT 'yorum',              count(*) FROM public.cadde_post_comments
UNION ALL SELECT 'reaksiyon',          count(*) FROM public.cadde_post_reactions
UNION ALL SELECT 'bildirim (cadde.%)', count(*) FROM public.notifications WHERE type LIKE 'cadde.%'
ORDER BY 1;

-- ---------------------------------------------------------------------------
-- K1 — çöp veri (canlıya geçmeden önceki deneme kayıtları)
-- FK cascade: cadde_cafes -> cadde_posts.cafe_id, cadde_posts -> yorum/reaksiyon/
-- hedef/ilgi. Bu yüzden önce kafeler, sonra kalan postlar.
-- ---------------------------------------------------------------------------
\echo ''
\echo '=== 1) K1: kullanici kafeleri (cascade: uyeler + kafe ici postlar) ==='
DELETE FROM public.cadde_cafes WHERE host_user_id IS NOT NULL;

\echo '=== 2) K1: kalan kullanici postlari ==='
DELETE FROM public.cadde_posts WHERE author_user_id IS NOT NULL;

\echo '=== 3) K1: test verisine baglanan cadde bildirimleri (olu deep-link) ==='
DELETE FROM public.notifications WHERE type LIKE 'cadde.%';

-- ---------------------------------------------------------------------------
-- K2 — seed fixture'lar. Kullanıcı kararı 05.08: uydurma içerik gider, yerine
-- gerçek ekip hesabından editöryel içerik gelir.
-- ---------------------------------------------------------------------------
\echo ''
\echo '=== 4) K2: seed fixture postlari ve kafeleri ==='
DELETE FROM public.cadde_cafes WHERE host_user_id IS NULL;
DELETE FROM public.cadde_posts WHERE author_user_id IS NULL;

-- ---------------------------------------------------------------------------
-- AÇILIŞ İÇERİĞİ
--
-- Yazar gerçek bir ekip hesabıdır; kimlik UYDURULMAZ. Kartta "CorteQS" adı ve
-- "Resmî hesap" rozeti görünür (author_name_override + author_role), böylece
-- kimse bunu bireysel bir üye sanmaz ve cevap yazan gerçek karşılık bulur.
--
-- Hedefleme neden şart: list_cadde_feed_v1 varsayılan akışta bir postu YALNIZ
-- izleyicinin şehri/ülkesi eşleşirse gösterir; global fallback 10 reaksiyon ister
-- (cadde.global.min_reactions=10). Hedefsiz "global" bir post yeni haliyle HİÇ
-- KİMSEYE görünmez. Bu yüzden ülke/şehir hedefleri açıkça yazılır.
--
-- Şehirler canlı üye dağılımına göre seçildi (05.08 ölçümü): Istanbul 14,
-- Doha 12, ankara 7, Berlin 5+, izmir 5, Frankfurt/Dortmund/Magdeburg 2'şer.
-- Köln ve München cadde_cities'te YOK — o yüzden içerikte de yok.
-- ---------------------------------------------------------------------------
\echo ''
\echo '=== 5) Yazar hesabi kontrolu ==='
DO $guard$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ubterzioglu@gmail.com') THEN
    RAISE EXCEPTION 'Yazar hesabi bulunamadi: ubterzioglu@gmail.com';
  END IF;
END
$guard$;

CREATE TEMP TABLE cadde_acilis_spec (
  sira          int,
  post_type     text,
  is_bridge     boolean,
  pinned        boolean,
  country_name  text,
  city_name     text,
  title         text,
  body          text
) ON COMMIT DROP;

-- country_name / city_name cadde_countries.name ve cadde_cities.name ile BİREBİR
-- eşleşmeli (canlıda 'Turkiye' aksansız, 'ankara'/'izmir' küçük harf). Eşleşmezse
-- aşağıdaki kontrol hata verir ve her şey geri sarar.
INSERT INTO cadde_acilis_spec VALUES
  -- A) Yönlendirme — tüm aktif ülkelere hedeflenir (country_name NULL = global)
  (1, 'text', false, true, NULL, NULL,
   $t$Cadde açıldı$t$,
   $t$Burası şehrindeki Türklerle tanışıp soru sorabileceğin ortak akış. Bir soru, bir tavsiye ya da şehrinden kısa bir not — hepsi buraya yazılır. Akış önce senin şehrine bakar; "Konum" kartındaki Ülke ve Şehir seçiminden başka yerleri de gezebilirsin.$t$),

  (2, 'text', false, false, NULL, NULL,
   $t$Cafe nedir, ne zaman açılır$t$,
   $t$Cafe, kendi teması olan süreli bir sohbet odası — süreli bir WhatsApp grubu gibi düşünebilirsin. İstersen herkese açık, istersen onaylı ya da davetli olur. "Berlin'de yeni başlayanlar" ya da "Hollanda'da freelance çalışma" gibi bir başlık aklına geldiyse odayı sen açabilirsin.$t$),

  (3, 'text', true, false, NULL, NULL,
   $t$Köprü modu ne işe yarar$t$,
   $t$Köprü, Türkiye ile diaspora arasındaki akış: taşınma, iş ve mentorluk. Türkiye'den taşınmayı düşünen biriyle o şehirde yaşayan birini aynı başlıkta buluşturur. "Konum" kartındaki anahtarla açıp kapatabilirsin.$t$),

  -- B) Türkiye tarafı — en büyük üye kitlesi, hepsi Köprü
  (4, 'question', true, false, 'Turkiye', 'Istanbul', NULL,
   $t$İstanbul'dan yurt dışına taşınmayı düşünenler: hangi ülke, ve seni en çok ne tutuyor? Aynı yolu geçmiş biri buradan cevap yazabilir.$t$),

  (5, 'question', true, false, 'Turkiye', 'ankara', NULL,
   $t$Ankara'dan taşınma planı yapanlara: karar aşamasında en çok hangi soruda tıkandınız — vize mi, iş mi, çocuğun okulu mu?$t$),

  (6, 'question', true, false, 'Turkiye', 'izmir', NULL,
   $t$İzmir'den soruyoruz: yurt dışında yaşayan birine soracağın tek soru ne olurdu? En çok merak edileni öne çıkaralım.$t$),

  (7, 'question', true, false, 'Turkiye', NULL, NULL,
   $t$Diasporadan mentor arıyorsan hangi konuda? Sektörünü ve hedef ülkeni yazarsan eşleştirmeye buradan başlayalım.$t$),

  -- C) Almanya
  (8, 'question', false, false, 'Almanya', 'Berlin', NULL,
   $t$Berlin'de Anmeldung randevusunu en son ne kadar beklediniz ve hangi Bürgeramt'ı denediniz? Yeni gelenler için gerçek bir tablo çıkarmak istiyoruz.$t$),

  (9, 'question', false, false, 'Almanya', 'Dortmund', NULL,
   $t$Dortmund'da Türkçe konuşan aile hekimi arayan çok. Kendi doktorundan memnunsan adını buraya bırakır mısın?$t$),

  (10, 'question', false, false, 'Almanya', 'Frankfurt', NULL,
   $t$Frankfurt'ta ilk iş görüşmesine giderken Almanca seviyeniz neydi? "B1 yeter mi" sorusunun sektöre göre gerçek cevabını merak ediyoruz.$t$),

  -- D) Katar — üye sayısında üçüncü sırada, gözden kaçmasın
  (11, 'question', false, false, 'Katar', 'Doha', NULL,
   $t$Doha'daki üyelere: yeni taşınan birine ilk hafta için tek tavsiyen ne olurdu? Konut, okul, ehliyet — hangisi en çok zorluyor?$t$),

  -- E) Hollanda / Birleşik Krallık
  (12, 'question', false, false, 'Hollanda', 'Amsterdam', NULL,
   $t$Amsterdam'da BSN aldıktan sonraki ilk hafta: sırasıyla ne yaptınız? Yeni taşınanların en çok takıldığı yer burası.$t$),

  (13, 'question', false, false, 'Birlesik Krallik', 'Londra', NULL,
   $t$Londra'da GP kaydı yaptıranlar — adres kanıtı olarak neyi kabul ettiler? Kiracıların en çok zorlandığı adım bu.$t$),

  -- F) Dizini besleyen açık soru — tüm ülkelere hedeflenir
  (14, 'question', false, false, NULL, NULL, NULL,
   $t$Yaşadığın şehirde Türkçe hizmet veren, gerçekten memnun kaldığın bir esnaf, danışman ya da usta var mı? Şehir adıyla birlikte yaz — dizine ilk kayıtlar buradan çıksın.$t$);

\echo ''
\echo '=== 6) Ulke/sehir adlari cozuldu mu (cozulmezse hata) ==='
DO $resolve$
DECLARE
  v_bad text;
BEGIN
  SELECT string_agg(format('sira %s: %s / %s', s.sira, s.country_name, coalesce(s.city_name, '-')), E'\n')
    INTO v_bad
  FROM cadde_acilis_spec s
  LEFT JOIN public.cadde_countries c
         ON c.is_active AND c.name = s.country_name
  LEFT JOIN public.cadde_cities ci
         ON ci.is_active AND ci.name = s.city_name AND ci.country_id = c.id
  WHERE (s.country_name IS NOT NULL AND c.id IS NULL)
     OR (s.city_name IS NOT NULL AND ci.id IS NULL);

  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION E'Cozulemeyen ulke/sehir adi var:\n%', v_bad;
  END IF;
END
$resolve$;

CREATE TEMP TABLE cadde_acilis_ins (
  id uuid, country_id uuid, city_id uuid
) ON COMMIT DROP;

\echo '=== 7) Editoryel postlar ekleniyor ==='
WITH yeni AS (
  INSERT INTO public.cadde_posts (
    author_user_id, author_name_override, author_role,
    content_mode, status, post_type, title, body,
    country_id, city_id, is_bridge, pinned,
    visibility, diaspora_key, published_at
  )
  SELECT
    (SELECT id FROM auth.users WHERE email = 'ubterzioglu@gmail.com'),
    'CorteQS', 'Resmî hesap',
    'real', 'published', s.post_type, s.title, s.body,
    c.id, ci.id, s.is_bridge, s.pinned,
    'public', 'tr', now()
  FROM cadde_acilis_spec s
  LEFT JOIN public.cadde_countries c
         ON c.is_active AND c.name = s.country_name
  LEFT JOIN public.cadde_cities ci
         ON ci.is_active AND ci.name = s.city_name AND ci.country_id = c.id
  ORDER BY s.sira
  RETURNING id, country_id, city_id
)
INSERT INTO cadde_acilis_ins SELECT * FROM yeni;

\echo '=== 8) Hedefler yaziliyor (hedefsiz post kimseye gorunmez) ==='
-- Şehir/ülke belirtilmiş postlar: kendi hedefi.
INSERT INTO public.cadde_post_targets (post_id, country_id, city_id)
SELECT id, country_id, city_id FROM cadde_acilis_ins WHERE country_id IS NOT NULL;

-- Yönlendirme + dizin postları: TÜM aktif ülkeler, böylece ülkesi çözülen her üye görür.
INSERT INTO public.cadde_post_targets (post_id, country_id, city_id)
SELECT i.id, c.id, NULL
FROM cadde_acilis_ins i
CROSS JOIN public.cadde_countries c
WHERE i.country_id IS NULL AND c.is_active;

\echo ''
\echo '=== 9) SILME/EKLEME SONRASI ==='
SELECT 'posts (editoryel)' AS grup, count(*) FROM public.cadde_posts WHERE author_user_id IS NOT NULL
UNION ALL SELECT 'posts (seed kalan)', count(*) FROM public.cadde_posts WHERE author_user_id IS NULL
UNION ALL SELECT 'posts public',       count(*) FROM public.cadde_posts WHERE visibility = 'public'
UNION ALL SELECT 'post hedefi',        count(*) FROM public.cadde_post_targets
UNION ALL SELECT 'cafes',              count(*) FROM public.cadde_cafes
UNION ALL SELECT 'cafe uyelik',        count(*) FROM public.cadde_cafe_members
UNION ALL SELECT 'yorum',              count(*) FROM public.cadde_post_comments
UNION ALL SELECT 'reaksiyon',          count(*) FROM public.cadde_post_reactions
UNION ALL SELECT 'bildirim (cadde.%)', count(*) FROM public.notifications WHERE type LIKE 'cadde.%'
ORDER BY 1;

COMMIT;

\echo ''
\echo '=== 10) AKISTA GORUNECEK ICERIK ==='
SELECT
  p.post_type AS tip,
  coalesce(cn.name, 'TUM ULKELER') AS ulke,
  coalesce(ct.name, '-')           AS sehir,
  p.pinned,
  p.is_bridge AS kopru,
  (SELECT count(*) FROM public.cadde_post_targets t WHERE t.post_id = p.id) AS hedef,
  left(replace(coalesce(p.title, p.body), chr(10), ' '), 52) AS metin
FROM public.cadde_posts p
LEFT JOIN public.cadde_countries cn ON cn.id = p.country_id
LEFT JOIN public.cadde_cities   ct ON ct.id = p.city_id
ORDER BY p.pinned DESC, cn.name NULLS FIRST, ct.name NULLS FIRST;

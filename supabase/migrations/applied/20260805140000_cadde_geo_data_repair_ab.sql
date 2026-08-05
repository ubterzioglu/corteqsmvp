-- Cadde — profil konum verisi onarimi (A + B gruplari) + eksik katalog satirlari.
--
-- BAGLAM: 20260805130000 hedef eslesmesini aksan/kasa duyarsiz yapti. Geriye,
-- yazilis farki DEGIL, bambaska bir kelime oldugu icin cozulemeyen degerler kaldi
-- (Qatar/Katar, Deutschland/Almanya, ABD/Amerika Birlesik Devletleri gibi).
-- Karar: alias/kural tablosu eklemek yerine DOGRUDAN VERIYI duzeltmek.
--
-- CANLIDA OLCULDU (2026-08-05):
--   A grubu (16 kayit) — hedef ulke katalogda VAR, sadece ad cevrilecek.
--                        Bu 16 kaydin sehirlerinin tamami katalogda mevcut.
--   B grubu (5 kayit)  — hedef ulke katalogda YOK. Ulke eklemek TEK BASINA YETMEZ:
--                        create_cadde_post_v2 sehri de zorunlu kilar
--                        (`city_name is not null and city_id is null` -> gecersiz),
--                        yeni ulkelerde ise hic sehir olmaz. Bu yuzden 4 ulke ile
--                        birlikte 4 sehir de eklenir.
--
-- KAPSAM DISI (bilerek):
--   C grubu (2 kayit)  — sehirden cikarim gerekiyor, kullanici karari bekliyor.
--   D grubu (15 kayit) — 2026-06-09 WhatsApp toplu ice aktarimi; adlari telefon
--                        numarasi, e-postalari <telefon>@wa.local, profil hic
--                        doldurulmamis. Telefon ulke kodundan cikarim yapmak bu
--                        uruende sistematik olarak yaniltir (+90 numarali uye
--                        Berlin'de yasiyor olabilir) — dokunulmuyor.
--   Ayrica: ulkesi cozulup SEHRI cozulemeyen 5 uye var (Böblingen, München,
--   Düsseldorf/Grevenbroich, Çankaya, Vanuu). Ayri bir karar konusu, burada degil.
--
-- KALICILIK UYARISI: profil formu hala serbest metin. Bu migration bugunku kayitlari
-- duzeltir, tekrarini ONLEMEZ. Kalici cozum formu katalogdan beslenen secim
-- listesine cevirmektir.
--
-- NOT: Turkce karakter iceren VERI yaziyor. Daima `psql -f <dosya>` ile ve
-- PGCLIENTENCODING=UTF8 ile uygulanmalidir; komut satirindan (-c) gecirilirse
-- Windows/PowerShell karakterleri bozar (bkz. CLAUDE.md "Turkce Metin Kurallari").

begin;

-- ── 1. Eksik ulkeler ────────────────────────────────────────────────────────
-- sort_order mevcut kayitlarda 10..180 araliginda ve 10'ar artiyor; devam ediliyor.
insert into public.cadde_countries (code, name, sort_order, is_active)
select v.code, v.name, v.sort_order, true
from (values
  ('ZA'::text, 'Güney Afrika'::text,    190),
  ('IT',       'İtalya',                200),
  ('MD',       'Moldova',               210),
  ('SA',       'Suudi Arabistan',       220)
) as v(code, name, sort_order)
where not exists (
  select 1
  from public.cadde_countries c
  where c.code = v.code
     or public.cadde_fold_text(c.name) = public.cadde_fold_text(v.name)
);

-- ── 2. Yeni ulkelerin sehirleri ─────────────────────────────────────────────
-- "Kişinev" bilerek Turkce yazildi: cadde_fold_text('Kişinev') = 'kisinev', yani
-- uyenin yazdigi "Kisinev" ile eslesir, ayrica uye kaydina dokunmak gerekmez.
-- "Cape Town" ve "Riyad" ise uyenin yazdigiyla ESLESMEZ ("capetown" / "riyadh"),
-- o iki deger 4. adimda duzeltilir.
insert into public.cadde_cities (country_id, name, timezone, sort_order, is_active)
select c.id, v.name, v.timezone, v.sort_order, true
from (values
  ('ZA'::text, 'Cape Town'::text, 'Africa/Johannesburg'::text, 10),
  ('IT',       'Roma',            'Europe/Rome',               10),
  ('MD',       'Kişinev',         'Europe/Chisinau',           10),
  ('SA',       'Riyad',           'Asia/Riyadh',               10)
) as v(country_code, name, timezone, sort_order)
join public.cadde_countries c on c.code = v.country_code
where not exists (
  select 1
  from public.cadde_cities ci
  where ci.country_id = c.id
    and public.cadde_fold_text(ci.name) = public.cadde_fold_text(v.name)
);

-- ── 3-4. Uye profil degerlerinin duzeltilmesi ───────────────────────────────
-- Guvenlik kilidi: beklenen satir sayisi asilirsa migration kendini iptal eder.
-- Bu adim UYE VERISI yazar; sessizce genis bir UPDATE calistirmasina izin verilmez.
do $$
declare
  v_country_updated int;
  v_city_updated int;
begin
  -- Eslesme SOL tarafta fold ile yapilir; boylece 'ABD'/'Abd' ve
  -- 'İngiltere'/'ingiltere' gibi varyantlar tek satirla yakalanir.
  with mapping(from_fold, to_name) as (
    values
      -- A grubu
      ('abd'::text,                 'Amerika Birlesik Devletleri'::text),
      ('united states',             'Amerika Birlesik Devletleri'),
      ('birlesik arap emirlikleri', 'BAE'),
      ('deutschland',               'Almanya'),
      ('germany',                   'Almanya'),
      ('france',                    'Fransa'),
      ('ingiltere',                 'Birlesik Krallik'),
      ('qatar',                     'Katar'),
      ('katar, doha',               'Katar'),
      ('tr',                        'Turkiye'),
      -- B grubu (ulkeleri 1. adimda eklendi)
      ('italy',                     'İtalya'),
      ('moldova',                   'Moldova'),
      ('south africa',              'Güney Afrika'),
      ('suudi arabistan',           'Suudi Arabistan')
  )
  update public.user_profile_attributes upa
  set value_text = m.to_name,
      updated_at = now()
  from public.afs_attributes a, mapping m
  where a.id = upa.attribute_id
    and a.key = 'country'
    and public.cadde_fold_text(upa.value_text) = m.from_fold;

  get diagnostics v_country_updated = row_count;

  -- Sehir duzeltmesi yalnizca katalog adiyla eslesmeyen iki deger icin.
  -- Yanlis uyeye dokunmamak adina, ayni uyenin ULKESI de dogrulanir.
  with city_mapping(from_fold, to_name, country_fold) as (
    values
      ('capetown'::text, 'Cape Town'::text, 'guney afrika'::text),
      ('riyadh',         'Riyad',           'suudi arabistan')
  )
  update public.user_profile_attributes upa
  set value_text = cm.to_name,
      updated_at = now()
  from public.afs_attributes a, city_mapping cm
  where a.id = upa.attribute_id
    and a.key = 'city'
    and public.cadde_fold_text(upa.value_text) = cm.from_fold
    and exists (
      select 1
      from public.user_profile_attributes upc
      join public.afs_attributes ac on ac.id = upc.attribute_id and ac.key = 'country'
      where upc.user_id = upa.user_id
        and public.cadde_fold_text(upc.value_text) = cm.country_fold
    );

  get diagnostics v_city_updated = row_count;

  raise notice 'ulke degeri guncellenen satir: %, sehir degeri guncellenen satir: %',
    v_country_updated, v_city_updated;

  -- Olculen beklenti: 21 ulke + 3 sehir. Ust sinir asilirsa bir sey yanlis
  -- gitmistir (ornegin mapping cok genis eslesmistir) — transaction geri alinir.
  if v_country_updated > 25 then
    raise exception 'beklenenden fazla ulke satiri guncellendi (%) — islem geri alindi', v_country_updated;
  end if;
  if v_city_updated > 6 then
    raise exception 'beklenenden fazla sehir satiri guncellendi (%) — islem geri alindi', v_city_updated;
  end if;
end $$;

commit;

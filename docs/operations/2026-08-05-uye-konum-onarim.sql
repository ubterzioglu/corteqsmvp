-- Üye konum onarımı — 20260805200000_cadde_geo_bridge_backfill.sql "Bölüm 2"nin uygulanan hâli
-- Uygulandı: 2026-08-05, canlı Supabase (injprdrsklkxgnaiixzh).
-- Yedek: docs/operations/2026-08-05-uye-konum-yedek.sql (35 satır, geri yükleme UPDATE'leri)
--
-- ⚠️ ORİJİNAL BÖLÜM 2 ÇALIŞTIRILAMADI — nedeni ve kararı:
-- Migration'ın yorum bloğu 32 satırı (`Belirtilmedi` 27 + çöp 5) `value_text = NULL`'a
-- çekmeyi öneriyordu. Bu, şemanın kısıtına takılıyor:
--     CHECK (value_text IS NOT NULL OR value_json IS NOT NULL)
-- Hedef satırların hiçbirinde `value_json` dolu değil (ölçüldü: 35/35 boş), dolayısıyla
-- `value_text`'i NULL yapmak satırı geçersiz kılıyor. Şemanın kastı açık: "değer yoksa
-- satır da olmaz" — yani doğru işlem DELETE olurdu.
--
-- KULLANICI KARARI (2026-08-05): 32 satır SİLİNMEYECEK, olduğu gibi kalacak.
-- Yalnız aşağıdaki 3 gerçek onarım uygulanır. Sebep: bu satırlar bugün kimseyi
-- engellemiyor (kör-izleyici emniyet valfi devrede) ve üye verisi silmek geri dönüşsüz.
--
-- Ön kontrol yapıldı: 3 hedef ismin üçü de `cadde_cities` içinde MEVCUT
-- (Münih ✓ · Ankara ✓ · Düsseldorf ✓) — onarım gerçekten eşleşme sağlıyor.
--
-- Çalıştırma (Türkçe karakter komut satırından geçmez — daima -f ile dosyadan okut):
--   psql "$CONN" -v ON_ERROR_STOP=1 -f docs/operations/2026-08-05-uye-konum-onarim.sql
-- ─────────────────────────────────────────────────────────────────────────────

begin;

set local statement_timeout = '30s';

-- Çankaya bir İLÇE, şehir değil → üyenin şehri Ankara.
-- Düsseldorf/Grevenbroich tek alana iki şehir yazılmış → ilki alınır.
-- München katalogdaki Türkçe karşılığına (Münih) çekilir.
with a as (select id, key from public.afs_attributes where key in ('country', 'city'))
update public.user_profile_attributes upa
set value_text = case
      when btrim(upa.value_text) = 'München'                 then 'Münih'
      when btrim(upa.value_text) = 'Çankaya'                 then 'Ankara'
      when btrim(upa.value_text) = 'Düsseldorf/Grevenbroich' then 'Düsseldorf'
    end
from a
where a.id = upa.attribute_id
  and btrim(coalesce(upa.value_text, '')) in
      ('München', 'Çankaya', 'Düsseldorf/Grevenbroich');

-- Doğrulama: eski değerlerden hiçbiri kalmamalı (beklenen 0).
select count(*) as kalan_eski_deger
from public.user_profile_attributes upa
join public.afs_attributes a on a.id = upa.attribute_id
where a.key in ('country', 'city')
  and btrim(coalesce(upa.value_text, '')) in
      ('München', 'Çankaya', 'Düsseldorf/Grevenbroich');

commit;

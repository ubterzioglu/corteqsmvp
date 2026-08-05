-- Üye konum verisi YEDEĞİ — 20260805200000_cadde_geo_bridge_backfill.sql "Bölüm 2" öncesi
-- Alındığı an: 2026-08-05, canlı Supabase (injprdrsklkxgnaiixzh), session pooler üzerinden.
--
-- NE İŞE YARAR: Bölüm 2, üyelerin KENDİ profil kayıtlarındaki konum değerlerini değiştirir
-- (3 onarım + 5 çöp NULL + 27 'Belirtilmedi' NULL). Üye verisi geri alınamaz; bu dosya tek
-- geri dönüş yoludur. Satırlar birincil anahtarla (`upa.id`) hedeflenir, yani geri yükleme
-- araya giren başka değişikliklerden etkilenmez ve tekrar çalıştırılabilir.
--
-- ⚠️ 35 SATIR, 34 DEĞİL. Migration dosyasının 122. satırındaki yorum "Mb, Vanuu, a, De → 4"
-- diyor ama `a` değeri HEM şehirde HEM ülkede var (aynı üye: 4ee27100). Gerçek dağılım:
--     3 onarım  (München, Çankaya, Düsseldorf/Grevenbroich)
--   + 5 çöp     (city: a, Mb, Vanuu · country: a, De)
--   + 27 'Belirtilmedi' (city 13 + country 14)
--   = 35
-- Değer listesi migration'la birebir aynıdır; yalnız yorumdaki tahmin bir eksikti.
--
-- GERİ YÜKLEME:
--   psql "$CONN" -v ON_ERROR_STOP=1 -f docs/operations/2026-08-05-uye-konum-yedek.sql
--   (Türkçe karakter komut satırından geçmez — daima -f ile dosyadan okut, -c kullanma.)
--
-- Yorumlardaki 8 karakterlik değer `user_id` önekidir; hangi üyenin satırı olduğunu
-- kimlik sızdırmadan izlemek için var.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

set local statement_timeout = '30s';

update public.user_profile_attributes set value_text = 'a' where id = 'fa147e5d-b72b-4cd3-8af9-87927bf4f353'::uuid;  -- city / 4ee27100
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = '0003f476-99fe-4d81-b1dc-5dc3ff1a4f96'::uuid;  -- city / 0fa7842e
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = '09fdda2e-6df0-497d-b046-e71ae87f4f6f'::uuid;  -- city / 8a7cf3bc
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = '0a2d1933-ceb4-4951-8c5d-a198e9fe5e82'::uuid;  -- city / 8135e74f
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = '0e33ee03-7b97-4579-919d-fcda73323266'::uuid;  -- city / 8a32612c
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = '4ca7082a-49d7-466c-bb42-b104223a8143'::uuid;  -- city / 9e447348
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = '96c94142-0be2-43d5-ad1c-a6e1ef30c3b0'::uuid;  -- city / 504f2332
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = 'a408ecaf-522e-410d-bf65-56bc6b786882'::uuid;  -- city / 31b42ffb
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = 'a9ad07eb-55a0-4fdf-9e1a-3bae16304f23'::uuid;  -- city / 85d9fa27
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = 'ab44e1cf-503f-473c-ab2f-f020c3a52ffa'::uuid;  -- city / 1145acdc
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = 'af8dc6d0-a724-4457-983a-89c301868bdf'::uuid;  -- city / 397b3418
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = 'bacfcdea-a18f-4f63-a86c-6cbbeee0c575'::uuid;  -- city / b9751b5e
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = 'c9b3db72-42ef-4021-a9b7-3fb589ce7189'::uuid;  -- city / 3da8592a
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = 'ca3218d5-ab06-444d-84f8-d8055398419e'::uuid;  -- city / 1b656ca4
update public.user_profile_attributes set value_text = 'Çankaya' where id = '238d2afa-c5c3-43bc-ab2f-a1ad6ee95150'::uuid;  -- city / 4832e60d
update public.user_profile_attributes set value_text = 'Düsseldorf/Grevenbroich' where id = '73f0fd1b-6289-4834-857d-7d14072d16d3'::uuid;  -- city / 6c7be625
update public.user_profile_attributes set value_text = 'Mb' where id = 'db5f7ee7-6aca-4f5f-a0a0-3185687f9493'::uuid;  -- city / 1c8e1fda
update public.user_profile_attributes set value_text = 'München' where id = 'fb4108df-4a43-4e11-a2e8-aa94dd65be2d'::uuid;  -- city / 5170de77
update public.user_profile_attributes set value_text = 'Vanuu' where id = 'aea6604b-a605-4e11-acfe-ecc8cc370652'::uuid;  -- city / c5dd56a5
update public.user_profile_attributes set value_text = 'a' where id = '4b59a530-0b4e-4154-88ec-9d6f5c67c936'::uuid;  -- country / 4ee27100
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = '0e7eee59-bae2-4507-9f14-617a65d2dbf2'::uuid;  -- country / 85d9fa27
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = '23550c9b-1355-4ed9-8b48-2e76fef14600'::uuid;  -- country / 8a32612c
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = '272a9f76-2c4b-49fe-9677-75a7ccbed2a4'::uuid;  -- country / 8135e74f
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = '329c90d9-c422-4bb4-8bf3-73e99edff3b0'::uuid;  -- country / b9751b5e
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = '4e6e30ad-7a69-4345-bcd5-88bda77ce029'::uuid;  -- country / 0fa7842e
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = '75cb6796-37d1-4e96-8072-9480c0e028b1'::uuid;  -- country / 3da8592a
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = '86307ac5-8b80-4cc2-8a8c-214014c0129e'::uuid;  -- country / 397b3418
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = '8bfc49dd-9e53-45f7-ba2d-0be9979a8ff8'::uuid;  -- country / 1145acdc
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = '8e4a64d6-c843-4850-8940-ae1df77c3377'::uuid;  -- country / 9e447348
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = 'a44df664-984d-456a-bc12-d0b7e00531c0'::uuid;  -- country / 4bf76eb0
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = 'a916739b-c158-4b31-b296-c7ad2b37d3ce'::uuid;  -- country / 1b656ca4
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = 'b4044ada-93b5-429b-b72a-f9f74fb062f8'::uuid;  -- country / 8a7cf3bc
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = 'f1bf2e98-14c3-48a3-9f02-ab92c192d814'::uuid;  -- country / 31b42ffb
update public.user_profile_attributes set value_text = 'Belirtilmedi' where id = 'f61612b7-d26a-4720-ad1a-3b28a2ab0e4b'::uuid;  -- country / 504f2332
update public.user_profile_attributes set value_text = 'De' where id = 'ae31c42b-8732-4af4-9efb-098da8fa3e5e'::uuid;  -- country / 1c8e1fda

-- Doğrulama: geri yükleme sonrası 35 satırın hepsi eski değerine dönmüş olmalı.
select count(*) as geri_yuklenen
from public.user_profile_attributes upa
join public.afs_attributes a on a.id = upa.attribute_id
where a.key in ('country', 'city')
  and btrim(coalesce(upa.value_text, '')) in
      ('München', 'Çankaya', 'Düsseldorf/Grevenbroich', 'Mb', 'Vanuu', 'a', 'De', 'Belirtilmedi');

commit;

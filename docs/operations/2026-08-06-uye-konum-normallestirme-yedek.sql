-- YEDEK — 2026-08-06 üye konum normalleştirmesi öncesi durum (25 satır)
-- Alındığı an: 2026-08-06, canlı Supabase (injprdrsklkxgnaiixzh).
-- Onarım dosyası: docs/operations/2026-08-06-uye-konum-normallestirme.sql
--
-- Satırlar birincil anahtarla (`upa.id`) hedeflenir → araya giren başka değişikliklerden
-- etkilenmez, tekrar çalıştırılabilir.
--
-- GERİ YÜKLEME (Türkçe karakter komut satırından geçmez — daima -f ile dosyadan okut):
--   psql "$CONN" -v ON_ERROR_STOP=1 -f docs/operations/2026-08-06-uye-konum-normallestirme-yedek.sql
--
-- Yorumlardaki 8 karakter `user_id` önekidir (kimlik sızdırmadan izlemek için).
-- ─────────────────────────────────────────────────────────────────────────────

begin;

set local statement_timeout = '30s';

-- ŞEHİR (12 satır)
update public.user_profile_attributes set value_text = 'ankara' where id = '15393ab8-ddb9-4b15-8aae-b8b0bd5c314d'::uuid;  -- city / 1cc3b97f
update public.user_profile_attributes set value_text = 'aschaffenburg' where id = '5bbac98c-2e8a-4a75-ae93-a5c19a4a0485'::uuid;  -- city / 2850fda7
update public.user_profile_attributes set value_text = 'ashford' where id = '4d41af68-225f-40ad-869f-c562ce5bf2cc'::uuid;  -- city / 5ca5e6e1
update public.user_profile_attributes set value_text = 'bilecik' where id = '65c5ffcf-3ed3-4ecc-8f86-7ebc0c7c089d'::uuid;  -- city / afab35af
update public.user_profile_attributes set value_text = 'diyarbakır' where id = '6034c6cf-df86-4394-9f07-cbcb6da64a60'::uuid;  -- city / a61bda2a
update public.user_profile_attributes set value_text = 'DOha' where id = 'cbdc6fb5-62bd-4f3b-bab4-3079c1cd17a6'::uuid;  -- city / c553d17e
update public.user_profile_attributes set value_text = 'istanbul' where id = '676d1bcd-5ff6-4d77-8492-aca0b8f52ef9'::uuid;  -- city / 471dcf4d
update public.user_profile_attributes set value_text = 'izmir' where id = '036da25f-4348-4c1b-a8ea-09e24f8b5d2a'::uuid;  -- city / f522ee96
update public.user_profile_attributes set value_text = 'ısparta' where id = 'ee4a3b31-13ea-4bed-9fdc-31478f7e749e'::uuid;  -- city / d753937b
update public.user_profile_attributes set value_text = 'kingston' where id = 'dfec2bc1-545e-409d-9341-3c0de4192cca'::uuid;  -- city / 5f4dbfb4
update public.user_profile_attributes set value_text = 'MAXHÜTTE-HAIDHOF' where id = '0ae3ff23-a409-408e-9da0-ddb5ca1c5edb'::uuid;  -- city / 6172cfea
update public.user_profile_attributes set value_text = 'new york' where id = '9526aed3-f125-4620-96cf-828ac58d531c'::uuid;  -- city / 802f7955

-- ÜLKE (13 satır)
update public.user_profile_attributes set value_text = 'almanya' where id = '63e748c0-bc95-4638-a218-d0a4f05f2944'::uuid;  -- country / 2850fda7
update public.user_profile_attributes set value_text = 'Amerika Birlesik Devletleri' where id = '15f79cfe-2aae-47c8-9363-d1f5f1c69210'::uuid;  -- country / 2e0d1ddd
update public.user_profile_attributes set value_text = 'Amerika Birlesik Devletleri' where id = '975aee3e-ef8f-4c7d-b009-cb18107537d6'::uuid;  -- country / d8c6e4d8
update public.user_profile_attributes set value_text = 'Amerika Birlesik Devletleri' where id = 'af945813-c911-40b2-a182-f017ccf540a0'::uuid;  -- country / 802f7955
update public.user_profile_attributes set value_text = 'Amerika Birlesik Devletleri' where id = 'f75f5dc6-2dc0-4fda-884f-9befed96e115'::uuid;  -- country / 51aecf94
update public.user_profile_attributes set value_text = 'Birlesik Krallik' where id = '27f7733f-69a0-411e-ae7b-bba902d55abe'::uuid;  -- country / 5ca5e6e1
update public.user_profile_attributes set value_text = 'Birlesik Krallik' where id = '7586e32b-8a7c-448d-82c6-9011abad4cd6'::uuid;  -- country / c37dee75
update public.user_profile_attributes set value_text = 'kanada' where id = 'baf288cb-2262-4d01-a48a-87b7ad21e68e'::uuid;  -- country / 5f4dbfb4
update public.user_profile_attributes set value_text = 'Turkiye' where id = '18e9c874-3fef-47b8-9d1f-4d22f5fbb7c5'::uuid;  -- country / f522ee96
update public.user_profile_attributes set value_text = 'Turkiye' where id = 'ad2148e0-8616-4b4e-be5c-1987825b2099'::uuid;  -- country / 125bb621
update public.user_profile_attributes set value_text = 'türkiye' where id = '4493c86e-d6b7-4a9a-86a9-36301130b721'::uuid;  -- country / d753937b
update public.user_profile_attributes set value_text = 'türkiye' where id = 'c7b31697-1818-4a0b-86b1-17fbcb2f7f67'::uuid;  -- country / afab35af
update public.user_profile_attributes set value_text = 'türkiye' where id = 'feb67943-a69c-4e0b-bf51-773554336880'::uuid;  -- country / 1cc3b97f

commit;

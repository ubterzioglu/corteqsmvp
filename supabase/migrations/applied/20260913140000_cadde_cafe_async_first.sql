-- C0 (m159): geçici Cafe modeli async-first.
-- Küçük kullanıcı tabanında iki saatlik canlı pencere boş oda beklentisi yaratıyordu.
-- Yeni Cafe varsayılanı 24 saat; kullanıcı 1, 3 veya 7 gün seçebilir.
--
-- Geri dönüş ayrı bir forward migration ile yapılır:
--   delete from public.cadde_settings
--   where key in ('cadde.cafe.mode', 'cadde.cafe.default_duration_hours');
--   update public.cadde_settings
--   set value = '6'::jsonb
--   where key = 'cadde.cafe.max_duration_hours';

insert into public.cadde_settings (key, value)
values
  ('cadde.cafe.mode', '"async_first"'::jsonb),
  ('cadde.cafe.default_duration_hours', '24'::jsonb),
  ('cadde.cafe.max_duration_hours', '168'::jsonb)
on conflict (key) do update
set value = excluded.value,
    updated_at = now();

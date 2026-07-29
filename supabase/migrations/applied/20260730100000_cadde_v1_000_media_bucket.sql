-- Cadde V1 (0/6): ortak medya altyapısı — cadde_settings anahtarları + `cadde-media` bucket.
--
-- Cadde 3.0 rebuild'inde paylaşımların medya desteği YOKTU (cadde_posts'ta kolon yok) ve
-- carsi_items.image_urls DB'de tanımlı olmasına rağmen hiçbir forma bağlı değildi. Bu migration
-- post / Çarşı / (ileride) Cafe dosyalarının paylaşacağı TEK bucket'ı ve limitleri kurar.
--
-- Kurallar:
--  * Limitler koda DEĞİL cadde_settings'e yazılır (ürün kararı = SQL update, deploy gerekmez).
--  * Bucket public READ'tir (feed görselleri anonim CDN'den servis edilir), ancak YAZMA
--    yalnız kullanıcının kendi `{uid}/` klasörüne yapılabilir — başkasının klasörüne
--    yazma/silme mümkün değil.
--  * Yol şeması: cadde-media/{uid}/post/{uuid}.{ext} · {uid}/carsi/{uuid}.{ext}
--                cadde-media/{uid}/cafe/{cafeId}/{uuid}.{ext}  (Faz 2)
--
-- Desen kaynakları:
--   • Bucket/policy deseni → 20260714120000_revision_request_attachments.sql
--   • Settings deseni      → 20260611110000_cadde300_009_carsi.sql (§4)

begin;

-- ── 1. Ayarlar ───────────────────────────────────────────────────────────────
-- Not: cadde_setting_int(text, integer) mevcut; boolean/text değerler value::jsonb'den
-- doğrudan okunur (cadde_phone_required deseni).
insert into public.cadde_settings (key, value) values
  ('cadde.media.max_images',    '4'::jsonb),
  ('cadde.media.max_image_mb',  '5'::jsonb),
  ('cadde.media.video_enabled', 'true'::jsonb),
  ('cadde.media.max_video_mb',  '50'::jsonb),
  ('cadde.hashtag.max_per_post','8'::jsonb),
  ('cadde.mention.max_per_post','10'::jsonb),
  ('cadde.carsi.paid_mode',     'false'::jsonb),
  ('cadde.carsi.scope',         '"global"'::jsonb)
on conflict (key) do nothing;

-- ── 2. Ayar yardımcıları ─────────────────────────────────────────────────────
-- cadde_setting_int zaten var; bool eşdeğeri yoktu (cadde_phone_required tek amaçlıydı).
create or replace function public.cadde_setting_bool(p_key text, p_default boolean)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select (value #>> '{}')::boolean from public.cadde_settings where key = p_key), p_default);
$$;

create or replace function public.cadde_setting_text(p_key text, p_default text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(nullif((select value #>> '{}' from public.cadde_settings where key = p_key), ''), p_default);
$$;

revoke all on function public.cadde_setting_bool(text, boolean) from public, anon;
revoke all on function public.cadde_setting_text(text, text) from public, anon;
grant execute on function public.cadde_setting_bool(text, boolean) to authenticated;
grant execute on function public.cadde_setting_text(text, text) to authenticated;

-- ── 3. `cadde-media` bucket ──────────────────────────────────────────────────
-- file_size_limit bucket seviyesinde en yüksek sınırdır (video: 50MB). Görsel için
-- daha dar olan 5MB limiti uygulama katmanında (cadde-media.ts + RPC) uygulanır.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'cadde-media',
  'cadde-media',
  true,
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
where not exists (select 1 from storage.buckets where id = 'cadde-media');

-- Okuma: public bucket olduğu için anon dahil herkes (feed görselleri).
drop policy if exists "cadde media public read" on storage.objects;
create policy "cadde media public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'cadde-media');

-- Yazma/güncelleme/silme: yalnız kendi `{uid}/` klasörü (+ admin her yerde).
drop policy if exists "cadde media own insert" on storage.objects;
create policy "cadde media own insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'cadde-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "cadde media own update" on storage.objects;
create policy "cadde media own update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'cadde-media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin_user(auth.uid()))
  )
  with check (
    bucket_id = 'cadde-media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin_user(auth.uid()))
  );

drop policy if exists "cadde media own delete" on storage.objects;
create policy "cadde media own delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'cadde-media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin_user(auth.uid()))
  );

commit;

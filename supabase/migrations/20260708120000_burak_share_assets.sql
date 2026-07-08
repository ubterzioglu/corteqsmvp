-- "BURAK BURAYA BAK" paylaşım bölümü medya kayıtları.
-- /admin/social-share-vault "BURAK BURAYA BAK" sekmesindeki her Canva yuvası (slot)
-- için yüklenen görsel + opsiyonel görsel linki + video linki + not.
-- İçerik metinleri kodda statik (src/lib/admin-shell/burak-share-tools.ts); burada
-- yalnız medya kayıtları. Görünürlük: tüm adminler ortak. RLS = public.is_admin(auth.uid()).
-- Desen kaynağı: 20260627100000_social_share_tracking.sql + 20260517110000_add_whatsapp_landing_hero_bucket.sql.

-- 1) Tablo: slot başına tek satır -------------------------------------------
create table if not exists public.social_share_assets (
  id            uuid primary key default gen_random_uuid(),
  slot_key      text not null,                 -- ör. 'burak/burak-tool-11/variant-1'
  image_bucket  text,
  image_path    text,
  image_url     text,                          -- foto yerine verilen Gmail/Drive görsel linki
  video_url     text,                          -- Drive'a yüklenen videonun paylaşım linki
  note          text,
  updated_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  constraint social_share_assets_slot_key_uniq unique (slot_key)
);

-- 2) RLS: yalnız admin okur/yazar; tüm adminler ortak görür -----------------
alter table public.social_share_assets enable row level security;

drop policy if exists social_share_assets_admin_select on public.social_share_assets;
create policy social_share_assets_admin_select on public.social_share_assets
  for select using (public.is_admin(auth.uid()));

drop policy if exists social_share_assets_admin_insert on public.social_share_assets;
create policy social_share_assets_admin_insert on public.social_share_assets
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists social_share_assets_admin_update on public.social_share_assets;
create policy social_share_assets_admin_update on public.social_share_assets
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists social_share_assets_admin_delete on public.social_share_assets;
create policy social_share_assets_admin_delete on public.social_share_assets
  for delete using (public.is_admin(auth.uid()));

comment on table public.social_share_assets is
  'BURAK BURAYA BAK paylaşım medya kayıtları: slot başına görsel/görsel-linki/video-linki/not (ortak, admin-only).';

-- 3) Private storage bucket (yalnız admin okuma/yazma) ----------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'burak-share',
  'burak-share',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where not exists (
  select 1 from storage.buckets where id = 'burak-share'
);

drop policy if exists "burak share admin read" on storage.objects;
create policy "burak share admin read"
  on storage.objects for select to authenticated
  using (bucket_id = 'burak-share' and public.is_admin(auth.uid()));

drop policy if exists "burak share admin insert" on storage.objects;
create policy "burak share admin insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'burak-share' and public.is_admin(auth.uid()));

drop policy if exists "burak share admin update" on storage.objects;
create policy "burak share admin update"
  on storage.objects for update to authenticated
  using (bucket_id = 'burak-share' and public.is_admin(auth.uid()))
  with check (bucket_id = 'burak-share' and public.is_admin(auth.uid()));

drop policy if exists "burak share admin delete" on storage.objects;
create policy "burak share admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'burak-share' and public.is_admin(auth.uid()));

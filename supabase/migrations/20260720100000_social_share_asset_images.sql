-- Sosyal Medya Paylaşım Deposu — birden fazla görsel desteği.
-- social_share_assets tablosu her slot (kalem/varyant) için TEK görsel
-- (image_bucket/image_path) tutuyordu. Bu migration, aynı slota EK görseller
-- eklenebilmesi için ayrı bir tablo açar; mevcut tekli görsel alanları
-- "kapak görseli" olarak aynen kalır, geriye dönük uyumlu.
-- Görünürlük: tüm adminler ortak. RLS = public.is_admin(auth.uid()).
-- Desen kaynağı: 20260708120000_burak_share_assets.sql.

create table if not exists public.social_share_asset_images (
  id            uuid primary key default gen_random_uuid(),
  slot_key      text not null,                 -- social_share_assets.slot_key ile aynı değer, FK yok (slot henüz oluşmamış olabilir)
  image_bucket  text not null,
  image_path    text not null,
  sort_order    integer not null default 0,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists social_share_asset_images_slot_key_idx
  on public.social_share_asset_images (slot_key, sort_order);

alter table public.social_share_asset_images enable row level security;

drop policy if exists social_share_asset_images_admin_select on public.social_share_asset_images;
create policy social_share_asset_images_admin_select on public.social_share_asset_images
  for select using (public.is_admin(auth.uid()));

drop policy if exists social_share_asset_images_admin_insert on public.social_share_asset_images;
create policy social_share_asset_images_admin_insert on public.social_share_asset_images
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists social_share_asset_images_admin_update on public.social_share_asset_images;
create policy social_share_asset_images_admin_update on public.social_share_asset_images
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists social_share_asset_images_admin_delete on public.social_share_asset_images;
create policy social_share_asset_images_admin_delete on public.social_share_asset_images
  for delete using (public.is_admin(auth.uid()));

comment on table public.social_share_asset_images is
  'Sosyal paylaşım deposu — slot başına ek görseller (kapak görseli hariç), sıralı liste. Ortak, admin-only.';

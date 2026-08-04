-- Member full_name -> catalog_items.title senkronu + tek seferlik backfill.
--
-- Problem: signup trigger'ı member bridge'in title'ını e-posta local-part'ından
-- üretir ("desiremapde" gibi) ve public profil sayfası (get_catalog_item_public_page_v2)
-- ismi catalog_items.title'dan okur. /profile editörü full_name'i
-- update_catalog_item_attribute üzerinden yazdığında title güncellenir (20260610172000),
-- ama user_profile_attributes tarafına yazan yollar (admin_update_user_profile_attribute,
-- update_profile_attribute, import/backfill akışları) title'ı HİÇ güncellemez.
-- Sonuç: kullanıcı "Ad Soyad" doldursa bile public profilde e-posta kullanıcı adı
-- görünmeye devam edebilir.
--
-- Fix (additive — mevcut hiçbir fonksiyon/trigger/RLS değiştirilmez):
--   1. user_profile_attributes üzerinde yeni AFTER INSERT/UPDATE trigger:
--      full_name attribute'u onaylı ve dolu ise kullanıcının member
--      catalog_items.title'ını senkronlar (boş/whitespace değer yok sayılır;
--      başlık zaten aynıysa no-op).
--   2. Tek seferlik backfill: full_name değeri (önce item-scoped
--      catalog_item_attribute_values, sonra user-scoped user_profile_attributes
--      önceliğiyle) dolu olup title'ı farklı kalan member item'ları düzeltir.
--
-- Idempotent: create or replace + drop trigger if exists + is distinct from korumalı
-- backfill. Rollback: trigger'ı drop et (backfill edilen title'lar istenen değerlerdir).

begin;

-- ─── 1. Trigger: UPA full_name -> member item title ─────────────────────────

create or replace function public.sync_member_title_from_full_name()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_attribute_key text;
  v_title text;
begin
  if new.user_id is null then
    return new;
  end if;

  select a.key
  into v_attribute_key
  from public.afs_attributes a
  where a.id = new.attribute_id;

  if v_attribute_key is distinct from 'full_name' then
    return new;
  end if;

  -- Onaylanmamış değişiklikler title'a yansımaz (onay akışıyla tutarlı).
  if coalesce(new.approval_status, 'approved') <> 'approved' then
    return new;
  end if;

  v_title := nullif(btrim(coalesce(new.value_text, '')), '');
  if v_title is null then
    return new;
  end if;

  update public.catalog_items ci
  set title = v_title, updated_at = now()
  where ci.linked_user_id = new.user_id
    and ci.item_type = 'member'
    and ci.deleted_at is null
    and ci.title is distinct from v_title;

  return new;
end;
$$;

comment on function public.sync_member_title_from_full_name() is
  'user_profile_attributes.full_name (onaylı, dolu) değerini kullanıcının member '
  'catalog_items.title alanına senkronlar; public profil ismi e-posta local-part''ında '
  'takılı kalmasın diye (20260611170000).';

drop trigger if exists trg_sync_member_title_from_full_name on public.user_profile_attributes;
create trigger trg_sync_member_title_from_full_name
after insert or update on public.user_profile_attributes
for each row
execute function public.sync_member_title_from_full_name();

-- ─── 2. Tek seferlik backfill ────────────────────────────────────────────────

-- 2a. Item-scoped full_name (catalog_item_attribute_values) -> title.
update public.catalog_items ci
set title = src.full_name, updated_at = now()
from (
  select cav.item_id, nullif(btrim(cav.value_text), '') as full_name
  from public.catalog_item_attribute_values cav
  join public.afs_attributes a on a.id = cav.attribute_id and a.key = 'full_name'
  where coalesce(cav.approval_status, 'approved') = 'approved'
) src
where src.full_name is not null
  and ci.id = src.item_id
  and ci.item_type = 'member'
  and ci.deleted_at is null
  and ci.title is distinct from src.full_name;

-- 2b. User-scoped full_name (user_profile_attributes) -> title (öncelikli kaynak).
update public.catalog_items ci
set title = src.full_name, updated_at = now()
from (
  select upa.user_id, nullif(btrim(upa.value_text), '') as full_name
  from public.user_profile_attributes upa
  join public.afs_attributes a on a.id = upa.attribute_id and a.key = 'full_name'
  where coalesce(upa.approval_status, 'approved') = 'approved'
) src
where src.full_name is not null
  and ci.linked_user_id = src.user_id
  and ci.item_type = 'member'
  and ci.deleted_at is null
  and ci.title is distinct from src.full_name;

commit;

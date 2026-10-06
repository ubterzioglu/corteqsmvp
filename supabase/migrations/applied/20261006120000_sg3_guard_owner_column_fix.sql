-- SG3 düzeltmesi · catalog_items koruma tetikleyicisi olmayan kolona bakıyordu
--
-- 20261006010000 tetikleyici fonksiyonu `new.owner_user_id`'ye başvuruyordu; catalog_items'ta
-- böyle bir kolon YOK (sahiplik: linked_user_id / catalog_item_managers). Admin olmayan
-- (auth.uid() null dahil: edge/cron/trigger zinciri) her UPDATE 42703 ile düşüyordu —
-- events→katalog senkronu ve üye profil düzenlemesi dahil.
-- Gövde aynı; yalnız var olmayan owner_user_id karşılaştırması çıkarıldı.

begin;

create or replace function public.catalog_items_guard_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  select public.is_admin(auth.uid()) into v_is_admin;
  if v_is_admin then
    return new;
  end if;

  if new.verification_status is distinct from old.verification_status
    or new.platform_role_key is distinct from old.platform_role_key
    or new.status is distinct from old.status
    or new.visibility is distinct from old.visibility
    or new.linked_user_id is distinct from old.linked_user_id
  then
    raise exception 'catalog_items_privileged_column_protected'
      using errcode = '28000',
            hint = 'Yalnız admin ayrıcalıklı kolonları değiştirebilir.';
  end if;

  return new;
end;
$$;

comment on function public.catalog_items_guard_privileged_columns() is
  'SG3: Ayrıcalıklı kolonları (verification_status, platform_role_key, status, visibility, linked_user_id) korur. Yalnız admin değiştirebilir.';

commit;

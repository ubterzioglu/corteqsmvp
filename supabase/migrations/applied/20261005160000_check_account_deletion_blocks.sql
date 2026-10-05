-- B13 · Profil silme — Engel kontrolü RPC (D1).
--
-- Kaynak: docs/plans/qwen-sirali/01-tek-plan-kalan-isler.md §2.8
--
-- Bu RPC, kullanıcının hesabını silmeden önce engelleri kontrol eder:
--   1. Tek sahibi olduğu grup var mı?
--   2. Yönetici/moderatör rolü var mı?
--   3. Açık abonelik var mı?
--
-- Engel varsa silmeyi reddeder, "önce devret" mesajı döner.

begin;

create or replace function public.check_account_deletion_blocks_v1(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_blocks jsonb[] := '{}';
  v_owned_groups integer;
  v_admin_roles integer;
  v_active_subscriptions integer;
begin
  -- 1. Tek sahibi olduğu gruplar
  select count(*) into v_owned_groups
  from public.catalog_item_managers
  where user_id = p_user_id
    and status = 'active'
    and not exists (
      select 1 from public.catalog_item_managers m2
      where m2.item_id = catalog_item_managers.item_id
        and m2.user_id != p_user_id
        and m2.status = 'active'
    );

  if v_owned_groups > 0 then
    v_blocks := v_blocks || jsonb_build_object(
      'block_type', 'owned_group',
      'message', format('%d grubun tek sahibisiniz. Önce başka birine devredin.', v_owned_groups)
    );
  end if;

  -- 2. Yönetici/moderatör rolleri
  select count(*) into v_admin_roles
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = p_user_id
    and ura.status = 'active'
    and (r.key like 'Admin_%' or r.key like 'Moderator_%' or r.key = 'User_PlatformAdmin');

  if v_admin_roles > 0 then
    v_blocks := v_blocks || jsonb_build_object(
      'block_type', 'admin_role',
      'message', format('%d yönetici/moderatör rolünüz var. Önce bu rolleri bırakın.', v_admin_roles)
    );
  end if;

  -- 3. Açık abonelikler (örn: premium)
  -- Not: Şu anki şemada abonelik tablosu yok, bu placeholder.
  -- Gerçek abonelik sistemi gelince buraya eklenecek.

  return jsonb_build_object(
    'can_delete', array_length(v_blocks, 1) is null,
    'blocks', to_jsonb(v_blocks)
  );
end;
$$;

revoke all on function public.check_account_deletion_blocks_v1(uuid) from public;
grant execute on function public.check_account_deletion_blocks_v1(uuid) to authenticated;

comment on function public.check_account_deletion_blocks_v1(uuid) is
  'B13 D1: Hesap silme engellerini kontrol eder. Engel varsa can_delete=false, blocks listesi döner.';

commit;

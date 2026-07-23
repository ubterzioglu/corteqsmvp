-- Admin: rol bazlı toplam kayıt sayısı RPC'si.
--
-- /admin/data sayfasında admin "Bireysel kullanıcı sayısı" (= User_DiasporaMember rolü,
-- User_Standard konsolidasyonundan sonra platformdaki tek bireysel-üye rolü) ve diğer tüm
-- rollerin toplam kayıt sayısını, sayfalamadan bağımsız görmek istedi. Mevcut
-- admin_list_unified_records yalnız sayfalanmış sonuç + filtrelenmiş total_count döner,
-- role göre gruplu toplam vermez.
--
-- catalog_items tek kaynak (member/katalog kayıtları burada; her auth kullanıcısı için
-- member bridge otomatik oluşturuluyor, bkz. sync_member_catalog_role_for_user). roles'e
-- LEFT JOIN yapılırken is_active filtrelenmez: pasif bir role (ör. eski User_Standard)
-- sahip kalıntı kayıt olursa "bilinmeyen rol" görünmesin, gerçek label'ı ile sayılsın.

begin;

create or replace function public.admin_role_record_counts()
returns table (
  role_key text,
  role_label text,
  record_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    coalesce(r.key, '__none__')::text as role_key,
    coalesce(r.label, 'Rol Atanmamış')::text as role_label,
    count(ci.id) as record_count
  from public.catalog_items ci
  left join public.roles r on r.key = ci.platform_role_key
  group by r.key, r.label, coalesce(r.sort_order, 999999)
  order by coalesce(r.sort_order, 999999) asc, role_label asc;
end;
$$;

comment on function public.admin_role_record_counts() is
  'Moderator-gated: catalog_items içindeki tüm kayıtların platform_role_key bazında '
  'gruplu toplam sayısı (label ile). /admin/data rol dağılımı kartı için.';

revoke all on function public.admin_role_record_counts() from public;
grant execute on function public.admin_role_record_counts() to authenticated;

commit;

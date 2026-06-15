-- Admin /admin/data detay panelinde "Oluşturan Kullanıcı" satırı yalnızca UUID
-- gösteriyordu. E-posta auth.users içinde ve PostgREST'in doğrudan select'iyle
-- (getAdminCatalogItemDetail catalog_items'tan okur) erişilemiyor. Bu RPC tek bir
-- UUID'yi e-postaya çözer; moderator gate'li, SECURITY DEFINER.
--
-- Dikkat (CLAUDE.md): auth.users.email = character varying(255). RETURNS text ile
-- cast'siz dönersek "Returned type character varying(255) does not match expected
-- type text" → PostgREST 400. Bu yüzden au.email::text cast'i ZORUNLU.

begin;

CREATE OR REPLACE FUNCTION public.admin_get_user_email(p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_email text;
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_user_id is null then
    return null;
  end if;

  select au.email::text into v_email
  from auth.users au
  where au.id = p_user_id;

  return v_email;
end;
$function$;

revoke all on function public.admin_get_user_email(uuid) from public;
grant execute on function public.admin_get_user_email(uuid) to authenticated;

commit;

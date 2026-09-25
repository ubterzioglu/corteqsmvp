-- ============================================================
-- Purpose: m135 — Kafe logosu güncelleme RPC'si
--          Host kendi kafesinin logosunu güncelleyebilir
-- Risk:    Düşük. Yalnız logo_url kolonunu günceller.
-- Access:  Yalnız host/admin/mod yetkisi.
-- Rollback: DROP FUNCTION IF EXISTS public.update_cadde_cafe_logo_v1;
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.update_cadde_cafe_logo_v1(p_cafe_id uuid, p_logo_url text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  -- Yalnız host/admin/mod güncelleyebilir
  if not exists (
    select 1
    from public.cadde_cafes c
    where c.id = p_cafe_id
      and (
        c.host_user_id = v_uid
        or public.is_admin(v_uid)
        or public.is_moderator(v_uid)
      )
  ) then
    raise exception 'cadde_cafe_owner_required';
  end if;

  update public.cadde_cafes
  set logo_url = nullif(trim(p_logo_url), ''),
      updated_at = now()
  where id = p_cafe_id;
end;
$function$;

REVOKE ALL ON FUNCTION public.update_cadde_cafe_logo_v1(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.update_cadde_cafe_logo_v1(uuid, text) TO authenticated, service_role;

COMMENT ON FUNCTION public.update_cadde_cafe_logo_v1(uuid, text) IS
  'm135: Kafe logosu güncelleme. Yalnız host/admin/mod yetkisi.';

COMMIT;

-- ============================================================
-- Purpose: (1) m93 kararı C (UBT, 25.09 18:39): katılım talebi kabul/red
--              edildiğinde talep sahibine HİÇ bildirim gitmez; kullanıcı
--              durumu kafeye girince görür. 20260925140000'in "X kafeye girdi"
--              bildirimi kaldırılır (üstelik üyeye KENDİ adıyla gidiyordu).
--              m91 (ev sahibine talep bildirimi, join_cadde_cafe_v1) DEĞİŞMEZ.
--          (2) m135: update_cadde_cafe_logo_v1 artık yalnız `cadde-media`
--              bucket'ının public URL'sini kabul eder. Önceden her metni
--              yazıyordu → host dış bir izleme/uygunsuz görsel adresi girebilirdi.
-- Risk:    Düşük. İki fonksiyon gövdesi değişir, tablo yapısı aynı kalır.
-- Rollback: 20260925140000 ve 20260925160000 tanımlarını yeniden uygula.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.approve_cadde_cafe_member_v1(p_member_id uuid, p_approve boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_member public.cadde_cafe_members%rowtype;
  v_cafe public.cadde_cafes%rowtype;
  v_approved_count integer;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  select * into v_member from public.cadde_cafe_members where id = p_member_id;
  if v_member.id is null then
    raise exception 'cadde_cafe_member_not_found';
  end if;

  select * into v_cafe from public.cadde_cafes where id = v_member.cafe_id;

  if v_cafe.host_user_id is distinct from v_uid
     and not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    raise exception 'cadde_cafe_owner_required';
  end if;

  if v_member.status <> 'pending' then
    raise exception 'cadde_cafe_not_pending';
  end if;

  if p_approve and v_cafe.capacity is not null then
    select count(*) into v_approved_count
    from public.cadde_cafe_members
    where cafe_id = v_cafe.id and status = 'approved';
    if v_approved_count >= v_cafe.capacity then
      raise exception 'cadde_cafe_full';
    end if;
  end if;

  update public.cadde_cafe_members
  set status = case when p_approve then 'approved' else 'rejected' end,
      approved_at = case when p_approve then now() end,
      approved_by = v_uid
  where id = p_member_id;

  -- m93 kararı C: kabulde de redde de bildirim YOK.
end;
$function$;

REVOKE ALL ON FUNCTION public.approve_cadde_cafe_member_v1(uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.approve_cadde_cafe_member_v1(uuid, boolean) TO authenticated, service_role;

COMMENT ON FUNCTION public.approve_cadde_cafe_member_v1(uuid, boolean) IS
  'Cafe katılım onay/red. m93 kararı C (25.09): talep sahibine bildirim gitmez.';

CREATE OR REPLACE FUNCTION public.update_cadde_cafe_logo_v1(p_cafe_id uuid, p_logo_url text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_url text := nullif(btrim(coalesce(p_logo_url, '')), '');
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

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

  -- Yalnız kendi medya bucket'ımızın public nesnesi. TS aynası:
  -- src/lib/cadde-cafe-logo.ts isCaddeCafeLogoUrl.
  if v_url is not null
     and v_url !~ '^https://[^/?#]+/storage/v1/object/public/cadde-media/[0-9a-f-]{36}/cafe/[A-Za-z0-9._-]+$' then
    raise exception 'cadde_cafe_logo_invalid';
  end if;

  update public.cadde_cafes
  set logo_url = v_url,
      updated_at = now()
  where id = p_cafe_id;
end;
$function$;

REVOKE ALL ON FUNCTION public.update_cadde_cafe_logo_v1(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.update_cadde_cafe_logo_v1(uuid, text) TO authenticated, service_role;

COMMENT ON FUNCTION public.update_cadde_cafe_logo_v1(uuid, text) IS
  'm135: Kafe logosu. Yalnız host/admin/mod; URL yalnız cadde-media/{uid}/cafe/ nesnesi olabilir.';

COMMIT;

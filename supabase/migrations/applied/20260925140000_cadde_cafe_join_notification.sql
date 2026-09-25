-- ============================================================
-- Purpose: m93 — Cafe katılım onay/red bildirimi değişikliği
--          "Talebin kabul/red edildi" yerine "X kafeye girdi" bildirimi
-- Risk:    Düşük. Mevcut RPC'yi değiştirir, tablo yapısı aynı kalır.
-- Access:  Yalnız host/admin/mod yetkisi (mevcut kontrol korunur).
-- Rollback: Önceki fonksiyon tanımını geri yükle.
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
  v_member_name text;
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

  -- m93: Onaylandığında "X kafeye girdi" bildirimi, reddedildiğinde bildirim yok
  if p_approve then
    -- Üye adını bul (full_name attribute'undan)
    select coalesce(
      (select upa.value_text
       from public.user_profile_attributes upa
       join public.afs_attributes a on a.id = upa.attribute_id
       where upa.user_id = v_member.user_id
         and a.key = 'full_name'
         and upa.approval_status = 'approved'
         and nullif(btrim(coalesce(upa.value_text, '')), '') is not null
       limit 1),
      'CorteQS Üyesi'
    ) into v_member_name;

    -- Kullanıcıya "X kafeye girdi" bildirimi gönder
    perform public.cadde_notify(
      v_member.user_id, v_uid, 'cadde.cafe.joined',
      v_member_name || ' kafeye girdi',
      v_cafe.title,
      'cafe', v_cafe.id,
      jsonb_build_object('action', 'joined')
    );
  end if;
  -- Reddedildiğinde bildirim gönderme (WhatsApp basitliği)
end;
$function$;

REVOKE ALL ON FUNCTION public.approve_cadde_cafe_member_v1(uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.approve_cadde_cafe_member_v1(uuid, boolean) TO authenticated, service_role;

COMMENT ON FUNCTION public.approve_cadde_cafe_member_v1(uuid, boolean) IS
  'm93: Cafe katılım onay/red. Onaylandığında üyeye "X kafeye girdi" bildirimi gider. Reddedildiğinde bildirim yok.';

COMMIT;

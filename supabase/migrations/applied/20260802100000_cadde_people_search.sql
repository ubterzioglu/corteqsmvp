-- ============================================================
-- Purpose:                Cadde "İnsanları Keşfet" için kişi arama RPC'si (workshop m38).
-- Module:                 CADDE (redesign F3 — plan: cadde-redesign-calisma-haritasi m38)
-- Risk level:             low-medium (yeni salt-okunur SECURITY DEFINER RPC; mevcut hiçbir
--                         fonksiyona dokunulmaz — denetçi şartı: search_directory_catalog
--                         GEVŞETİLMEZ, /directory davranışı değişmez)
--
-- Kapsam kararı (kullanıcı, 2026-08-02): "açık profiller + ad-soyad onaylılar" orta yolu —
--   * Açık bireysel profiller (visibility_status='open') tam satır (profil linklenebilir).
--   * Profili açık OLMAYAN ama full_name'i onaylı üyeler yalnız İSİM (+ şehir, şehir
--     attribute'u YALNIZ public görünürlükteyse) — profil linki YOK (has_profile=false).
--   * Gerekçe: canlı ölçüm 1 açık / 120 toplam profil — yalnız açık profiller keşfedilebilir
--     olsaydı keşfet fiilen tek kişilik kalıyordu; tam-herkes ise KVKK açısından agresif.
--
-- Güvenlik:
--   * auth zorunlu (cadde zaten login-gated; anon'a grant yok).
--   * Admin_/Moderator_ rol sahipleri DIŞLANIR — 20260730220000'daki dizin korumasının
--     birebir kopyası (denetçi: koruma otomatik taşınmaz, açıkça kopyalanır).
--   * Kapalı-profil dalında şehir yalnız upa.visibility='public' ise döner; başka hiçbir
--     alan (e-posta, rol, açıklama) sızmaz.
--
-- Rollback:               drop function public.search_cadde_people_v1(text, integer);
-- Estimated lock impact:  negligible (CREATE FUNCTION + ACL).
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.search_cadde_people_v1(
  p_query text,
  p_limit integer DEFAULT 12
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  city text,
  country text,
  has_profile boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_query text := btrim(coalesce(p_query, ''));
  v_limit integer := least(greatest(coalesce(p_limit, 12), 1), 25);
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  -- 2 karakterden kısa sorgu: tüm üye listesini dökmeyi engeller (enumerasyon koruması).
  if char_length(v_query) < 2 then
    return;
  end if;

  return query
  with named_users as (
    -- Onaylı full_name'i olan tüm üyeler (arama evreni) — yönetici/moderatör hariç.
    select upa.user_id as uid, upa.value_text as name
    from public.user_profile_attributes upa
    join public.afs_attributes a on a.id = upa.attribute_id
    where a.key = 'full_name'
      and upa.approval_status = 'approved'
      and nullif(btrim(coalesce(upa.value_text, '')), '') is not null
      and upa.value_text ilike '%' || v_query || '%'
      and not exists (
        select 1
        from public.user_role_assignments ura_x
        join public.roles r_x on r_x.id = ura_x.role_id
        where ura_x.user_id = upa.user_id
          and (r_x.key ilike 'Admin_%' or r_x.key ilike 'Moderator_%')
      )
  )
  select
    nu.uid,
    nu.name,
    case
      when ipd.user_id is not null then ipd.active_city
      else pub_city.value_text  -- kapalı profil: şehir YALNIZ public görünürlükteyse
    end as city,
    case when ipd.user_id is not null then ipd.active_country else null end as country,
    (ipd.user_id is not null) as has_profile
  from named_users nu
  left join public.individual_profile_details ipd
    on ipd.user_id = nu.uid and ipd.visibility_status = 'open'
  left join lateral (
    select upa2.value_text
    from public.user_profile_attributes upa2
    join public.afs_attributes a2 on a2.id = upa2.attribute_id
    where upa2.user_id = nu.uid
      and a2.key = 'city'
      and upa2.approval_status = 'approved'
      and upa2.visibility = 'public'
    limit 1
  ) pub_city on ipd.user_id is null
  order by (ipd.user_id is not null) desc, nu.name
  limit v_limit;
end;
$function$;

REVOKE ALL ON FUNCTION public.search_cadde_people_v1(text, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.search_cadde_people_v1(text, integer) TO authenticated, service_role;

COMMENT ON FUNCTION public.search_cadde_people_v1(text, integer) IS
  'Cadde İnsanları Keşfet araması (m38). Açık profiller tam satır; ad-onaylı kapalı profiller yalnız isim(+public şehir). Admin/Moderator dışlanır.';

COMMIT;

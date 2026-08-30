-- ============================================================
-- Purpose: Cadde cafe host onay paneline sınırlı talep/profil özeti sağlamak (m92).
-- Risk:    Düşük-orta. Yeni salt-okunur SECURITY DEFINER RPC; tablo/kolon değişmez.
-- Access:  Yalnız ilgili cafe host'u veya mevcut admin/moderatör yetkisi.
-- Privacy: Profil attribute'larından yalnız public + approved ülke/şehir/bio döner.
-- Rollback: DROP FUNCTION public.list_cadde_cafe_join_requests_v1(uuid);
-- Lock:     CREATE FUNCTION + ACL; tablo kilidi veya veri güncellemesi yoktur.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.list_cadde_cafe_join_requests_v1(p_cafe_id uuid)
RETURNS TABLE (
  member_id uuid,
  user_id uuid,
  status text,
  answer text,
  joined_at timestamptz,
  display_name text,
  country text,
  city text,
  role_key text,
  role_label text,
  short_bio text,
  has_public_profile boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF p_cafe_id IS NULL THEN
    RAISE EXCEPTION 'cadde_cafe_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.cadde_cafes c
    WHERE c.id = p_cafe_id
      AND (
        c.host_user_id = v_uid
        OR public.is_admin(v_uid)
        OR public.is_moderator(v_uid)
      )
  ) THEN
    RAISE EXCEPTION 'cadde_cafe_owner_required';
  END IF;

  RETURN QUERY
  SELECT
    m.id AS member_id,
    m.user_id,
    m.status::text,
    m.answer,
    m.joined_at,
    COALESCE(public_name.value_text, 'CorteQS Üyesi') AS display_name,
    public_country.value_text AS country,
    public_city.value_text AS city,
    r.key AS role_key,
    r.label AS role_label,
    public_bio.value_text AS short_bio,
    EXISTS (
      SELECT 1
      FROM public.catalog_items ci
      WHERE ci.linked_user_id = m.user_id
        AND public.catalog_item_is_publicly_visible(ci.id)
    ) AS has_public_profile
  FROM public.cadde_cafe_members m
  LEFT JOIN public.user_role_assignments ura ON ura.user_id = m.user_id
  LEFT JOIN public.roles r ON r.id = ura.role_id AND r.is_active = true
  LEFT JOIN LATERAL (
    SELECT upa.value_text
    FROM public.user_profile_attributes upa
    JOIN public.afs_attributes a ON a.id = upa.attribute_id
    WHERE upa.user_id = m.user_id
      AND a.key = 'full_name'
      AND upa.approval_status = 'approved'
      AND NULLIF(BTRIM(COALESCE(upa.value_text, '')), '') IS NOT NULL
    ORDER BY upa.updated_at DESC
    LIMIT 1
  ) public_name ON true
  LEFT JOIN LATERAL (
    SELECT upa.value_text
    FROM public.user_profile_attributes upa
    JOIN public.afs_attributes a ON a.id = upa.attribute_id
    WHERE upa.user_id = m.user_id
      AND a.key = 'country'
      AND upa.visibility = 'public'
      AND upa.approval_status = 'approved'
    ORDER BY upa.updated_at DESC
    LIMIT 1
  ) public_country ON true
  LEFT JOIN LATERAL (
    SELECT upa.value_text
    FROM public.user_profile_attributes upa
    JOIN public.afs_attributes a ON a.id = upa.attribute_id
    WHERE upa.user_id = m.user_id
      AND a.key = 'city'
      AND upa.visibility = 'public'
      AND upa.approval_status = 'approved'
    ORDER BY upa.updated_at DESC
    LIMIT 1
  ) public_city ON true
  LEFT JOIN LATERAL (
    SELECT upa.value_text
    FROM public.user_profile_attributes upa
    JOIN public.afs_attributes a ON a.id = upa.attribute_id
    WHERE upa.user_id = m.user_id
      AND a.key = 'bio_short'
      AND upa.visibility = 'public'
      AND upa.approval_status = 'approved'
    ORDER BY upa.updated_at DESC
    LIMIT 1
  ) public_bio ON true
  WHERE m.cafe_id = p_cafe_id
  ORDER BY m.joined_at ASC;
END;
$function$;

REVOKE ALL ON FUNCTION public.list_cadde_cafe_join_requests_v1(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.list_cadde_cafe_join_requests_v1(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.list_cadde_cafe_join_requests_v1(uuid) IS
  'Cafe host/admin/mod onay paneli: talep ve yalnız izinli profil özeti. Başka cafe veya özel profil alanı döndürmez.';

COMMIT;

-- Keep catalog placeholders in directory search while these records remain demo content.
-- The preceding migration's null featured normalization is intentionally preserved.

DO $$
DECLARE
  v_definition text;
BEGIN
  SELECT pg_get_functiondef(p.oid)
    INTO v_definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'search_directory_catalog'
    AND pg_get_function_identity_arguments(p.oid) =
      'p_search_text text, p_role_key text, p_country_code text, p_city text, p_featured_only boolean, p_limit integer, p_offset integer';

  IF v_definition IS NULL OR position('and ci.is_placeholder = false' IN v_definition) = 0 THEN
    RAISE EXCEPTION 'search_directory_catalog demo filtresi bulunamadı';
  END IF;

  -- remove the demo-only filter; the records remain intentionally visible.
  v_definition := replace(v_definition, E'\n      and ci.is_placeholder = false', '');
  EXECUTE v_definition;
END;
$$;

COMMENT ON FUNCTION public.search_directory_catalog(text, text, text, text, boolean, integer, integer) IS
  'Herkese açık dizin araması. Demo placeholder kayıtları görünür kalır; null featured filtresi kapalı sayılır.';

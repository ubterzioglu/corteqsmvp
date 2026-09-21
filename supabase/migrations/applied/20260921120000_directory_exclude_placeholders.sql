-- Directory search: keep public search aligned with public listing pages.
--
-- Placeholder rows remain published to support their dedicated demo surfaces, but
-- search answers “who is available?” and must therefore omit them. This migration
-- also makes an omitted/null featured flag equivalent to false.

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

  IF v_definition IS NULL THEN
    RAISE EXCEPTION 'search_directory_catalog (7 arguments) bulunamadı';
  END IF;

  IF position('v_offset       integer := greatest(coalesce(p_offset, 0), 0);' IN v_definition) = 0
     OR position('where ci.status = ''published''' IN v_definition) = 0
     OR position('not p_featured_only' IN v_definition) = 0 THEN
    RAISE EXCEPTION 'search_directory_catalog gövdesi beklenen sözleşmeyle eşleşmiyor';
  END IF;

  v_definition := replace(
    v_definition,
    'v_offset       integer := greatest(coalesce(p_offset, 0), 0);',
    'v_offset       integer := greatest(coalesce(p_offset, 0), 0);' || E'\n' ||
    '  v_featured_only boolean := coalesce(p_featured_only, false);'
  );
  v_definition := replace(
    v_definition,
    'where ci.status = ''published''' || E'\n' ||
    '      and ci.visibility in (''public'', ''unlisted'')',
    'where ci.status = ''published''' || E'\n' ||
    '      and ci.visibility in (''public'', ''unlisted'')' || E'\n' ||
    '      and ci.is_placeholder = false'
  );
  v_definition := replace(v_definition, 'not p_featured_only', 'not v_featured_only');

  EXECUTE v_definition;
END;
$$;

COMMENT ON FUNCTION public.search_directory_catalog(text, text, text, text, boolean, integer, integer) IS
  'Herkese açık dizin araması. Placeholder katalog kayıtlarını içermez; null featured filtresi kapalı sayılır.';

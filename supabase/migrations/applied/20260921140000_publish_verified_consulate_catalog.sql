-- B14: Publish the verified, non-placeholder consulate catalog cohort.
DO $$
DECLARE
  v_target_count integer;
BEGIN
  SELECT count(*) INTO v_target_count
  FROM public.catalog_items
  WHERE platform_role_key = 'Organization_EmbassyConsulate'
    AND is_placeholder = false
    AND status = 'pending_review'
    AND visibility = 'private';

  IF v_target_count <> 241 THEN
    RAISE EXCEPTION 'Beklenen 241 konsolosluk kaydı yerine % bulundu', v_target_count;
  END IF;

  UPDATE public.catalog_items
  SET status = 'published', visibility = 'public', updated_at = now()
  WHERE platform_role_key = 'Organization_EmbassyConsulate'
    AND is_placeholder = false
    AND status = 'pending_review'
    AND visibility = 'private';
END;
$$;

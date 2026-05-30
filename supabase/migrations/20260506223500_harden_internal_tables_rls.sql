DO $$
DECLARE
  table_name text;
  target_tables text[] := ARRAY[
    'diaspora_city_scan_queue',
    'diaspora_scan_runs',
    'rag_documents',
    'diaspora_instagram_accounts'
  ];
BEGIN
  FOREACH table_name IN ARRAY target_tables
  LOOP
    IF to_regclass('public.' || table_name) IS NULL THEN
      RAISE NOTICE 'Skipping missing table public.%', table_name;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admins can manage ' || table_name, table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), %L::public.app_role)) WITH CHECK (public.has_role(auth.uid(), %L::public.app_role))',
      'Admins can manage ' || table_name,
      table_name,
      'admin',
      'admin'
    );
  END LOOP;
END
$$;

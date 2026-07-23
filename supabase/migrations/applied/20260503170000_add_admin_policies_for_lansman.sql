GRANT SELECT, UPDATE ON public.lansman_registrations TO authenticated;

DROP POLICY IF EXISTS "Admins can select lansman registrations"
  ON public.lansman_registrations;

CREATE POLICY "Admins can select lansman registrations"
  ON public.lansman_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can update lansman registrations"
  ON public.lansman_registrations;

CREATE POLICY "Admins can update lansman registrations"
  ON public.lansman_registrations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

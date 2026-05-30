BEGIN;

DROP POLICY IF EXISTS "Admin users can delete referral codes" ON public.referral_codes;

CREATE POLICY "Admin users can delete referral codes"
  ON public.referral_codes
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));

COMMIT;
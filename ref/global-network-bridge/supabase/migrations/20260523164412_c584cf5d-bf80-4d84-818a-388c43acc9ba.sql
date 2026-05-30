
-- ============ profiles: remove public read ============
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Authenticated can view profiles"
ON public.profiles FOR SELECT TO authenticated USING (true);

-- ============ user_roles: prevent privilege escalation ============
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ notifications: prevent spoofing ============
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- ============ cafe_memberships: restrict SELECT ============
DROP POLICY IF EXISTS "Anyone can view memberships" ON public.cafe_memberships;
CREATE POLICY "Members and owners can view memberships"
ON public.cafe_memberships FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.cafes c WHERE c.id = cafe_memberships.cafe_id AND c.created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM public.cafe_memberships m2 WHERE m2.cafe_id = cafe_memberships.cafe_id AND m2.user_id = auth.uid())
);

-- ============ Storage: interest-uploads ============
DROP POLICY IF EXISTS "Anyone can upload interest files" ON storage.objects;
CREATE POLICY "Users can upload own interest files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'interest-uploads'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- ============ Storage: service-attachments (restrict SELECT to owner folder) ============
DROP POLICY IF EXISTS "Anyone can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
CREATE POLICY "Users can view own attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'service-attachments'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can upload own attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'service-attachments'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- ============ Storage: may19-uploads (require auth + own folder for upload) ============
DROP POLICY IF EXISTS "anyone upload may19" ON storage.objects;
DROP POLICY IF EXISTS "anyone read may19" ON storage.objects;
CREATE POLICY "Users can upload own may19 files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'may19-uploads'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
CREATE POLICY "Public can read may19 files"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'may19-uploads');

-- ============ Function search_path hardening (set fixed search_path on SECURITY DEFINER funcs) ============
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.notify_providers_on_welcome_pack() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.notify_admins_ambassador_application() SET search_path = public;
ALTER FUNCTION public.enforce_daily_cafe_open_limit() SET search_path = public;
ALTER FUNCTION public.notify_admins_whatsapp_join() SET search_path = public;
ALTER FUNCTION public.auto_connect_on_proposal() SET search_path = public;
ALTER FUNCTION public.notify_followers_on_event() SET search_path = public;
ALTER FUNCTION public.notify_provider_on_appointment() SET search_path = public;
ALTER FUNCTION public.notify_birthday_followers() SET search_path = public;
ALTER FUNCTION public.notify_consultants_on_request() SET search_path = public;
ALTER FUNCTION public.notify_followers_on_job() SET search_path = public;
ALTER FUNCTION public.notify_admins_contact_message() SET search_path = public;
ALTER FUNCTION public.assign_ambassador_referral_code() SET search_path = public;
ALTER FUNCTION public.apply_referral_discount() SET search_path = public;
ALTER FUNCTION public.notify_owner_on_job_application() SET search_path = public;
ALTER FUNCTION public.notify_followers_on_cafe() SET search_path = public;
ALTER FUNCTION public.notify_admins_founding_1000() SET search_path = public;
ALTER FUNCTION public.notify_followers(uuid, text, text, text, uuid) SET search_path = public;
ALTER FUNCTION public.notify_on_connection_request() SET search_path = public;
ALTER FUNCTION public.notify_admins_whatsapp_link_request() SET search_path = public;
ALTER FUNCTION public.update_feed_like_count() SET search_path = public;
ALTER FUNCTION public.update_cafe_member_count() SET search_path = public;
ALTER FUNCTION public.enforce_tr_phone_restriction() SET search_path = public;
ALTER FUNCTION public.enforce_cafe_capacity() SET search_path = public;
ALTER FUNCTION public.process_ambassador_approval() SET search_path = public;

-- ============ Revoke EXECUTE on SECURITY DEFINER funcs from PUBLIC/anon/authenticated (except has_role used by RLS) ============
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_providers_on_welcome_pack() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_ambassador_application() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_daily_cafe_open_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_whatsapp_join() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_connect_on_proposal() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_followers_on_event() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_provider_on_appointment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_birthday_followers() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_consultants_on_request() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_followers_on_job() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_contact_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_ambassador_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_referral_discount() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_owner_on_job_application() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_followers_on_cafe() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_founding_1000() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_followers(uuid, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_connection_request() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_whatsapp_link_request() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_feed_like_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_cafe_member_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_tr_phone_restriction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_cafe_capacity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_ambassador_approval() FROM PUBLIC, anon, authenticated;

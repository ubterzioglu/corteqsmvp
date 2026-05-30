CREATE OR REPLACE FUNCTION public.notify_consultants_on_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Notify consultants whose categories match
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT 
    cc.user_id,
    'new_service_request',
    'Yeni Teklif Talebi!',
    '"' || NEW.title || '" başlıklı yeni bir ' || NEW.category || ' talebi oluşturuldu.',
    NEW.id
  FROM public.consultant_categories cc
  WHERE cc.category = NEW.category
    AND cc.user_id != NEW.user_id;

  -- Notify all businesses (RFQs go to providers in general)
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT 
    ur.user_id,
    'new_service_request',
    'Yeni Teklif Talebi!',
    '"' || NEW.title || '" başlıklı yeni bir ' || NEW.category || ' talebi oluşturuldu.',
    NEW.id
  FROM public.user_roles ur
  WHERE ur.role = 'business'::app_role
    AND ur.user_id != NEW.user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.consultant_categories cc
      WHERE cc.user_id = ur.user_id AND cc.category = NEW.category
    );

  RETURN NEW;
END;
$function$;
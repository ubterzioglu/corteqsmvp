
-- Table to store which categories each consultant serves
CREATE TABLE public.consultant_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, category)
);

ALTER TABLE public.consultant_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can manage own categories"
ON public.consultant_categories
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view consultant categories"
ON public.consultant_categories
FOR SELECT
TO authenticated
USING (true);

-- Function to auto-notify consultants when a service request is created
CREATE OR REPLACE FUNCTION public.notify_consultants_on_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notifications for all consultants who serve the request's category
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT 
    cc.user_id,
    'new_service_request',
    'Yeni Hizmet Talebi!',
    '"' || NEW.title || '" başlıklı yeni bir ' || NEW.category || ' talebi oluşturuldu.',
    NEW.id
  FROM public.consultant_categories cc
  WHERE cc.category = NEW.category
    AND cc.user_id != NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_consultants_on_request
AFTER INSERT ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_consultants_on_request();

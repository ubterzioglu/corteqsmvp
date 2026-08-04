
-- Service requests table
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT,
  country TEXT,
  budget_min NUMERIC,
  budget_max NUMERIC,
  preferred_time TEXT,
  urgency TEXT DEFAULT 'normal',
  attachment_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Service proposals from consultants
CREATE TABLE public.service_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE NOT NULL,
  consultant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  price NUMERIC,
  estimated_duration TEXT,
  scope TEXT,
  payment_terms TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- In-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Storage bucket for service request attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('service-attachments', 'service-attachments', true);

-- RLS for service_requests
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own requests" ON public.service_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own requests" ON public.service_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own requests" ON public.service_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Consultants can view open requests
CREATE POLICY "Consultants can view open requests" ON public.service_requests FOR SELECT TO authenticated USING (
  status = 'open' AND public.has_role(auth.uid(), 'consultant')
);

-- RLS for service_proposals
ALTER TABLE public.service_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can create proposals" ON public.service_proposals FOR INSERT TO authenticated WITH CHECK (auth.uid() = consultant_id);
CREATE POLICY "Consultants can view own proposals" ON public.service_proposals FOR SELECT TO authenticated USING (auth.uid() = consultant_id);
CREATE POLICY "Users can view proposals for their requests" ON public.service_proposals FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.service_requests WHERE id = request_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update proposals for their requests" ON public.service_proposals FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.service_requests WHERE id = request_id AND user_id = auth.uid())
);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Storage RLS
CREATE POLICY "Authenticated users can upload attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'service-attachments');
CREATE POLICY "Anyone can view attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'service-attachments');

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_proposals;

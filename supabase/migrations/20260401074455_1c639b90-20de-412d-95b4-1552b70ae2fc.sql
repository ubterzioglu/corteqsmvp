
-- Welcome pack orders table
CREATE TABLE public.welcome_pack_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  arrival_date DATE NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  has_pet BOOLEAN NOT NULL DEFAULT false,
  pet_details TEXT,
  needs_baby_seat BOOLEAN NOT NULL DEFAULT false,
  needs_airport_transfer BOOLEAN NOT NULL DEFAULT false,
  needs_car_rental BOOLEAN NOT NULL DEFAULT false,
  needs_flight_discount BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.welcome_pack_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own orders" ON public.welcome_pack_orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own orders" ON public.welcome_pack_orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON public.welcome_pack_orders
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Businesses and consultants can view open orders" ON public.welcome_pack_orders
  FOR SELECT TO authenticated
  USING (status = 'open' AND (has_role(auth.uid(), 'business') OR has_role(auth.uid(), 'consultant')));

CREATE POLICY "Admins can view all orders" ON public.welcome_pack_orders
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Welcome pack proposals table
CREATE TABLE public.welcome_pack_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.welcome_pack_orders(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL,
  category TEXT NOT NULL, -- 'airport_transfer', 'car_rental', 'flight_discount'
  price NUMERIC,
  message TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.welcome_pack_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can create proposals" ON public.welcome_pack_proposals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = provider_id AND (has_role(auth.uid(), 'business') OR has_role(auth.uid(), 'consultant')));

CREATE POLICY "Providers can view own proposals" ON public.welcome_pack_proposals
  FOR SELECT TO authenticated USING (auth.uid() = provider_id);

CREATE POLICY "Order owners can view proposals" ON public.welcome_pack_proposals
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.welcome_pack_orders WHERE id = order_id AND user_id = auth.uid()));

CREATE POLICY "Order owners can update proposal status" ON public.welcome_pack_proposals
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.welcome_pack_orders WHERE id = order_id AND user_id = auth.uid()));

CREATE POLICY "Admins can view all proposals" ON public.welcome_pack_proposals
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Trigger to notify businesses/consultants on new order
CREATE OR REPLACE FUNCTION public.notify_providers_on_welcome_pack()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Notify businesses and consultants
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT ur.user_id, 'welcome_pack_order', 'Yeni Hoşgeldin Paketi Talebi!',
    NEW.city || ', ' || NEW.country || ' için ' || NEW.adults || ' yetişkin, geliş: ' || NEW.arrival_date,
    NEW.id
  FROM public.user_roles ur
  WHERE ur.role IN ('business', 'consultant')
    AND ur.user_id != NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_on_welcome_pack
  AFTER INSERT ON public.welcome_pack_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_providers_on_welcome_pack();

-- Enable realtime for proposals
ALTER PUBLICATION supabase_realtime ADD TABLE public.welcome_pack_proposals;
